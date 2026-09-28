import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Prisma } from "@prisma/client";
import * as crypto from "crypto";
import * as QRCode from "qrcode";
import { PrismaService } from "../../database/prisma.service";
import { MailService } from "../mail/mail.service";
import { FirebaseService } from "../firebase/firebase.service";
import { RedisService } from "../../integrations/redis/redis.service";
import { AuditService } from "../audit/audit.service";
import { PasswordHelper } from "../../common/utils/password.helper";
import { canEncryptSettings, decryptSecret, encryptSecret } from "../finance/settings-crypto";
import { hashRecoveryCode, matchTotp, newRecoveryCodes, newTotpSecret, otpauthUrl } from "./totp";

const SECURITY_KEY = "security";
const EMAIL_LINK_HOURS = 24;
const CHALLENGE_MINUTES = 10;
const MAX_CODE_FAILURES = 5;
const CODE_LOCK_SECONDS = 15 * 60;

/** Logins whose accounts can use (and may be required to use) two-step verification. */
const PANEL_ROLES = new Set(["ADMIN", "ASTROLOGER"]);

export interface SecuritySettings {
  /** Staff and astrologers must use an authenticator app to sign in. */
  requireStaffTwoStep: boolean;
}

const DEFAULT_SECURITY: SecuritySettings = { requireStaffTwoStep: false };

export type TwoStepStage = "VERIFY" | "SETUP";

const sha256 = (s: string) => crypto.createHash("sha256").update(s).digest("hex");
const frontend = () => (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");
const normalEmail = (email: string) => email.trim().toLowerCase();

/**
 * Everything about how a person proves who they are, beyond the first sign-in:
 * verifying an email, adding a phone or email to an account, choosing a
 * password, and two-step verification with an authenticator app.
 */
@Injectable()
export class AccountSecurityService {
  private readonly logger = new Logger(AccountSecurityService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly firebase: FirebaseService,
    private readonly jwt: JwtService,
    private readonly redis: RedisService,
    private readonly audit: AuditService,
  ) {}

  // ── Settings ──────────────────────────────────────────────────────────────

  async getSettings(): Promise<SecuritySettings> {
    const row = await this.prisma.platformSetting.findUnique({ where: { key: SECURITY_KEY } });
    return { ...DEFAULT_SECURITY, ...((row?.value as Partial<SecuritySettings> | null) ?? {}) };
  }

  async saveSettings(actorId: string, input: SecuritySettings) {
    const value: SecuritySettings = { requireStaffTwoStep: Boolean(input.requireStaffTwoStep) };
    await this.prisma.platformSetting.upsert({
      where: { key: SECURITY_KEY },
      create: { key: SECURITY_KEY, value: value as unknown as Prisma.InputJsonValue, updatedById: actorId },
      update: { value: value as unknown as Prisma.InputJsonValue, updatedById: actorId },
    });
    return this.getSettings();
  }

  // ── Email ─────────────────────────────────────────────────────────────────

  /** Emails a one-time link proving the address (the current one, or `pendingEmail`). */
  async sendEmailVerification(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const target = user.pendingEmail ?? (user.emailVerifiedAt ? null : user.email);
    if (!target) return { sent: false, alreadyVerified: true };

    const token = crypto.randomBytes(32).toString("hex");
    await this.prisma.user.update({
      where: { id: userId },
      data: { emailVerifyTokenHash: sha256(token), emailVerifyExpiry: new Date(Date.now() + EMAIL_LINK_HOURS * 3600_000) },
    });
    const sent = await this.mail.sendActionEmail(target, {
      subject: "Confirm your email — Time Space & Planets",
      greetingName: user.name,
      paragraphs: [
        "Please confirm this is your email address, so we can send your booking confirmations and keep your account secure.",
        `The link works once and expires in ${EMAIL_LINK_HOURS} hours.`,
      ],
      buttonText: "Confirm my email",
      link: `${frontend()}/verify-email?token=${token}`,
      footnote: "If you didn't create an account with us, you can ignore this email.",
    });
    return { sent, email: target };
  }

  async verifyEmail(token: string) {
    if (!token || !/^[a-f0-9]{64}$/.test(token)) throw new BadRequestException("This link is not valid.");
    const user = await this.prisma.user.findUnique({ where: { emailVerifyTokenHash: sha256(token) } });
    if (!user || !user.emailVerifyExpiry || user.emailVerifyExpiry < new Date()) {
      throw new BadRequestException("This link has expired or was already used. Ask for a new one from your profile.");
    }
    const email = user.pendingEmail ?? user.email;
    if (!email) throw new BadRequestException("This link is not valid.");
    if (user.pendingEmail) {
      const taken = await this.prisma.user.findFirst({
        where: { email: { equals: user.pendingEmail, mode: "insensitive" }, id: { not: user.id } },
        select: { id: true },
      });
      if (taken) throw new ConflictException("That email now belongs to another account.");
    }
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        email,
        pendingEmail: null,
        emailVerifiedAt: new Date(),
        emailVerifyTokenHash: null,
        emailVerifyExpiry: null,
      },
    });
    return { email };
  }

  /** Adds (or changes) the email on an account; it takes effect once its link is clicked. */
  async addEmail(userId: string, rawEmail: string) {
    const email = normalEmail(rawEmail);
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (user.email && normalEmail(user.email) === email && user.emailVerifiedAt) {
      return { sent: false, alreadyVerified: true };
    }
    const taken = await this.prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" }, id: { not: userId } },
      select: { id: true },
    });
    if (taken) throw new ConflictException("That email is already used by another account. Sign in with it instead.");

    await this.prisma.user.update({ where: { id: userId }, data: { pendingEmail: email } });
    return this.sendEmailVerification(userId);
  }

  // ── Phone ─────────────────────────────────────────────────────────────────

  /** Adds a phone number proven by an SMS code (a Firebase phone sign-in token). */
  async linkPhone(userId: string, idToken: string) {
    const decoded: any = await this.firebase.verifyIdToken(idToken);
    if (decoded?.firebase?.sign_in_provider !== "phone" || !decoded.phone_number) {
      throw new UnauthorizedException("Please verify the number with the SMS code.");
    }
    const phone: string = decoded.phone_number;
    const other = await this.prisma.user.findUnique({ where: { phone } });
    if (other && other.id !== userId) {
      if (other.phoneVerifiedAt) {
        throw new ConflictException("This number already belongs to another account. Sign in with it instead.");
      }
      // It was typed somewhere without being proven; the person who proved it keeps it.
      await this.prisma.user.update({ where: { id: other.id }, data: { phone: null } });
    }
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { phone, phoneVerifiedAt: new Date() },
    });
    return { phone: user.phone };
  }

  // ── Password ──────────────────────────────────────────────────────────────

  /**
   * Sets or changes the password. Changing needs the current one; choosing a
   * first password (phone / Google accounts) needs a verified email, since
   * that is what it signs in with. Other signed-in devices are signed out.
   */
  async setPassword(userId: string, currentSessionId: string | null, currentPassword: string | undefined, newPassword: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (user.passwordHash) {
      if (!currentPassword || !(await PasswordHelper.compare(currentPassword, user.passwordHash))) {
        throw new BadRequestException("Your current password is not correct.");
      }
    } else if (!user.email || !user.emailVerifiedAt) {
      throw new BadRequestException("Add and confirm an email first — it is what you'll sign in with.");
    }

    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: { passwordHash: await PasswordHelper.hash(newPassword) } }),
      this.prisma.userSession.updateMany({
        where: { userId, isRevoked: false, ...(currentSessionId ? { id: { not: currentSessionId } } : {}) },
        data: { isRevoked: true },
      }),
    ]);
    if (PANEL_ROLES.has(user.role)) {
      void this.audit.record({
        actor: user,
        action: "auth.password_change",
        area: "security",
        summary: user.passwordHash ? "Changed their password (other devices signed out)" : "Chose a password",
        targetType: "User",
        targetId: user.id,
      });
    }
    return { ok: true };
  }

  // ── Two-step verification ─────────────────────────────────────────────────

  /** Whether this sign-in still needs a code (VERIFY) or setting up an authenticator (SETUP). */
  async twoStepStage(user: { role: string; totpEnabledAt: Date | null }): Promise<TwoStepStage | null> {
    if (!PANEL_ROLES.has(user.role)) return null;
    if (user.totpEnabledAt) return "VERIFY";
    return (await this.getSettings()).requireStaffTwoStep ? "SETUP" : null;
  }

  /** A short-lived token that only lets the holder finish this sign-in's second step. */
  issueChallenge(userId: string, stage: TwoStepStage) {
    return this.jwt.sign({ sub: userId, typ: "2fa", stage }, { expiresIn: `${CHALLENGE_MINUTES}m` });
  }

  readChallenge(token: string): { userId: string; stage: TwoStepStage } {
    try {
      const payload: any = this.jwt.verify(token);
      if (payload?.typ !== "2fa" || !payload.sub) throw new Error("wrong type");
      return { userId: payload.sub, stage: payload.stage };
    } catch {
      throw new UnauthorizedException("This sign-in has expired. Please start again.");
    }
  }

  async status(userId: string) {
    const [user, settings] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { role: true, totpEnabledAt: true, totpRecoveryCodes: true } }),
      this.getSettings(),
    ]);
    return {
      available: PANEL_ROLES.has(user.role),
      enabled: !!user.totpEnabledAt,
      enabledAt: user.totpEnabledAt,
      required: PANEL_ROLES.has(user.role) && settings.requireStaffTwoStep,
      recoveryCodesLeft: user.totpRecoveryCodes.length,
    };
  }

  /** Starts setting up an authenticator: a new secret, shown as a QR code. */
  async beginSetup(userId: string) {
    if (!canEncryptSettings()) throw new BadRequestException("The server can't store secrets yet (SETTINGS_ENCRYPTION_KEY is missing).");
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!PANEL_ROLES.has(user.role)) throw new ForbiddenException("Two-step verification is for staff and astrologer logins.");
    if (user.totpEnabledAt) throw new BadRequestException("Two-step verification is already on.");

    const secret = newTotpSecret();
    await this.prisma.user.update({ where: { id: userId }, data: { totpPendingSecret: encryptSecret(secret) } });
    const url = otpauthUrl(secret, user.email ?? user.phone ?? user.id);
    return {
      secret: secret.replace(/(.{4})/g, "$1 ").trim(),
      otpauthUrl: url,
      qrDataUrl: await QRCode.toDataURL(url, { margin: 1, width: 220, color: { dark: "#0B1233", light: "#FFFFFF" } }),
    };
  }

  /** Confirms the first code from the app, turns two-step on and returns recovery codes (shown once). */
  async enable(userId: string, code: string) {
    await this.assertNotLocked(userId);
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (user.totpEnabledAt) throw new BadRequestException("Two-step verification is already on.");
    if (!user.totpPendingSecret) throw new BadRequestException("Start the set-up again.");
    const step = matchTotp(decryptSecret(user.totpPendingSecret), code);
    if (step === null) {
      await this.recordFailure(userId);
      throw new BadRequestException("That code didn't match. Check the time on your phone and try the newest code.");
    }
    const codes = newRecoveryCodes();
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        totpSecret: user.totpPendingSecret,
        totpPendingSecret: null,
        totpEnabledAt: new Date(),
        totpLastStep: step,
        totpRecoveryCodes: codes.map(hashRecoveryCode),
      },
    });
    await this.clearFailures(userId);
    void this.audit.record({
      actor: user,
      action: "auth.two_step_on",
      area: "security",
      summary: "Turned on two-step verification",
      targetType: "User",
      targetId: user.id,
    });
    return { recoveryCodes: codes };
  }

  /**
   * Checks a code from the authenticator app (each works once) or a recovery
   * code (each works once). Five wrong codes lock it for 15 minutes.
   */
  async verifyCode(userId: string, code: string): Promise<"TOTP" | "RECOVERY"> {
    await this.assertNotLocked(userId);
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!user.totpSecret) throw new BadRequestException("Two-step verification is not set up.");
    const input = String(code ?? "").trim();

    if (/^\d{3}\s?\d{3}$/.test(input)) {
      const step = matchTotp(decryptSecret(user.totpSecret), input);
      if (step !== null && step > (user.totpLastStep ?? -1)) {
        // Accept once: the conditional update fails if another request used this step first.
        const claimed = await this.prisma.user.updateMany({
          where: { id: userId, OR: [{ totpLastStep: null }, { totpLastStep: { lt: step } }] },
          data: { totpLastStep: step },
        });
        if (claimed.count === 1) {
          await this.clearFailures(userId);
          return "TOTP";
        }
      }
    } else if (input.replace(/[\s-]/g, "").length === 8) {
      const hash = hashRecoveryCode(input);
      if (user.totpRecoveryCodes.includes(hash)) {
        await this.prisma.user.update({
          where: { id: userId },
          data: { totpRecoveryCodes: user.totpRecoveryCodes.filter((h) => h !== hash) },
        });
        await this.clearFailures(userId);
        void this.audit.record({
          actor: user,
          action: "auth.recovery_code_used",
          area: "security",
          summary: `Signed in with a recovery code (${user.totpRecoveryCodes.length - 1} left)`,
          targetType: "User",
          targetId: user.id,
        });
        return "RECOVERY";
      }
    }

    await this.recordFailure(userId);
    void this.audit.record({
      actor: user,
      action: "auth.two_step_failed",
      area: "security",
      summary: "Entered a wrong two-step verification code",
      outcome: "FAILED",
      targetType: "User",
      targetId: user.id,
    });
    throw new UnauthorizedException("That code didn't match. Use the newest code from your authenticator app.");
  }

  async regenerateRecoveryCodes(userId: string, code: string) {
    await this.verifyCode(userId, code);
    const codes = newRecoveryCodes();
    await this.prisma.user.update({ where: { id: userId }, data: { totpRecoveryCodes: codes.map(hashRecoveryCode) } });
    return { recoveryCodes: codes };
  }

  async disable(userId: string, code: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if ((await this.getSettings()).requireStaffTwoStep && PANEL_ROLES.has(user.role)) {
      throw new ForbiddenException("The TSP office requires two-step verification for your account.");
    }
    await this.verifyCode(userId, code);
    await this.clearTotp(userId);
    void this.audit.record({
      actor: user,
      action: "auth.two_step_off",
      area: "security",
      summary: "Turned off two-step verification",
      targetType: "User",
      targetId: user.id,
    });
    return { ok: true };
  }

  /** For a lost phone: an admin clears it; the person sets it up again at next sign-in. */
  async adminReset(targetUserId: string) {
    await this.clearTotp(targetUserId);
    await this.clearFailures(targetUserId);
    return { ok: true };
  }

  private clearTotp(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { totpSecret: null, totpPendingSecret: null, totpEnabledAt: null, totpLastStep: null, totpRecoveryCodes: [] },
    });
  }

  private async assertNotLocked(userId: string) {
    const n = Number((await this.redis.get(`2fa_fail:${userId}`).catch(() => null)) ?? 0);
    if (n >= MAX_CODE_FAILURES) throw new UnauthorizedException("Too many wrong codes. Please try again in 15 minutes.");
  }

  private async recordFailure(userId: string) {
    try {
      const client = this.redis.getClient();
      const n = await client.incr(`2fa_fail:${userId}`);
      if (n === 1) await client.expire(`2fa_fail:${userId}`, CODE_LOCK_SECONDS);
    } catch {
      /* Redis down: the per-IP rate limit still applies */
    }
  }

  private async clearFailures(userId: string) {
    await this.redis.del(`2fa_fail:${userId}`).catch(() => 0);
  }
}
