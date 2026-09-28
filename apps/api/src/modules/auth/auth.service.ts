import { permissionsFor } from "../../common/permissions";
import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../../database/prisma.service";
import { SignupDto, LoginDto } from "./dto/auth.dto";
import { PasswordHelper } from "../../common/utils/password.helper";
import { FirebaseService } from "../firebase/firebase.service";
import { MailService } from "../mail/mail.service";
import * as crypto from "crypto";
import { AuditService } from "../audit/audit.service";
import { RedisService } from "../../integrations/redis/redis.service";
import { AccountSecurityService } from "./account-security.service";

/** Wrong passwords allowed per account in the window before it is locked for that window. */
const MAX_FAILED_LOGINS = 10;
const LOCK_WINDOW_SECONDS = 15 * 60;
/** Compared against when the email doesn't exist, so the reply takes as long as a real check. */
const DUMMY_HASH =
  "3f0c3a1e5b1d6c2a9e8f7d6c5b4a39281706f5e4d3c2b1a0f9e8d7c6b5a49382716f5e4d3c2b1a0f9e8d7c6b5a4938271605f4e3d2c1b0a9f8e7d6c5b4a3928.0123456789abcdef0123456789abcdef";

/** Accounts whose sign-ins go in the activity log. */
const PANEL_ROLES = new Set(["ADMIN", "ASTROLOGER"]);

export interface SessionMetadata {
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
  deviceModel?: string;
  os?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly firebaseService: FirebaseService,
    private readonly mailService: MailService,
    private readonly audit: AuditService,
    private readonly redis: RedisService,
    private readonly accountSecurity: AccountSecurityService,
  ) { }

  /**
   * Social / phone sign-in rules: the token must come from the provider this
   * endpoint is for, an email must be verified by that provider before it can
   * be matched to an existing account, and staff or astrologer logins can't be
   * reached this way at all — they sign in with their password.
   */
  private assertFirebaseProvider(decoded: any, provider: "google.com" | "apple.com" | "phone") {
    if (decoded?.firebase?.sign_in_provider !== provider) {
      throw new UnauthorizedException("This sign-in method doesn't match the token.");
    }
  }

  /**
   * Google/Apple just proved this email. If the account was opened with that
   * email but never confirmed, whoever chose its password never proved they own
   * the address — so that password and any sessions go, and the email is now verified.
   */
  private async claimUnverifiedEmailAccount(existing: { id: string; emailVerifiedAt: Date | null; passwordHash: string | null }) {
    if (existing.emailVerifiedAt) return {};
    if (existing.passwordHash) {
      await this.prisma.userSession.updateMany({ where: { userId: existing.id, isRevoked: false }, data: { isRevoked: true } });
      return { emailVerifiedAt: new Date(), passwordHash: null, sessionsRevokedAt: new Date() };
    }
    return { emailVerifiedAt: new Date() };
  }

  private assertClientAccount(user: { role: string } | null) {
    if (user && user.role !== "USER") {
      throw new UnauthorizedException("This account signs in with its email and password.");
    }
  }

  private async recordFailedLogin(key: string) {
    try {
      const client = this.redis.getClient();
      const n = await client.incr(key);
      if (n === 1) await client.expire(key, LOCK_WINDOW_SECONDS);
    } catch {
      /* Redis down: the per-IP limit still applies */
    }
  }

  private logPanelAccess(user: any, metadata: SessionMetadata, outcome: "SUCCESS" | "FAILED", summary: string) {
    if (!PANEL_ROLES.has(user.role)) return;
    void this.audit.record({
      actor: user,
      action: outcome === "SUCCESS" ? "auth.sign_in" : "auth.sign_in_failed",
      area: "security",
      summary,
      targetType: "User",
      targetId: user.id,
      outcome,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });
  }

  private async createSessionAndTokens(user: any, metadata: SessionMetadata) {
    const expiresAt = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000); // 15 days
    const session = await this.prisma.userSession.create({
      data: {
        userId: user.id,
        refreshTokenHash: "", // Temporary placeholder
        deviceId: metadata.deviceId || null,
        deviceModel: metadata.deviceModel || null,
        os: metadata.os || null,
        ipAddress: metadata.ipAddress || null,
        userAgent: metadata.userAgent || null,
        expiresAt,
      },
    });

    const accessToken = this.generateToken(user, session.id);
    const refreshToken = this.jwtService.sign(
      { sessionId: session.id, sub: user.id, typ: "refresh" },
      { expiresIn: "30d" },
    );

    const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
    await this.prisma.userSession.update({
      where: { id: session.id },
      data: { refreshTokenHash },
    });

    const wallet = await this.prisma.wallet.findUnique({
      where: { userId: user.id },
      select: { balance: true },
    });

    return {
      accessToken,
      refreshToken,
      walletBalance: wallet?.balance ?? 0,
    };
  }

  async signup(signupDto: SignupDto, metadata: SessionMetadata) {
    const { email, password, name } = signupDto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException("Email is already registered");
    }

    const passwordHash = await PasswordHelper.hash(password);

    const newUser = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          name,
          role: "USER",
          authProvider: "EMAIL",
        },
      });

      await tx.wallet.create({
        data: {
          userId: user.id,
          balance: 0.0,
        },
      });

      return user;
    });

    const tokens = await this.createSessionAndTokens(newUser, metadata);
    // Ask them to confirm the address (booking confirmations go there).
    void this.accountSecurity.sendEmailVerification(newUser.id).catch(() => undefined);

    return {
      user: this.formatUser(newUser),
      ...tokens,
    };
  }

  async login(loginDto: LoginDto, metadata: SessionMetadata) {
    const { email, password } = loginDto;
    const lockKey = `login_fail:${String(email).trim().toLowerCase()}`;

    // Per-account lockout, on top of the per-IP rate limit: spreading guesses
    // over many IPs still only gets 10 tries per 15 minutes per account.
    const failures = Number((await this.redis.get(lockKey).catch(() => null)) ?? 0);
    if (failures >= MAX_FAILED_LOGINS) {
      throw new UnauthorizedException("Too many wrong passwords. Please try again in 15 minutes.");
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // Same work whether or not the account exists, so timing doesn't reveal which emails are registered.
    const isPasswordValid = await PasswordHelper.compare(password, user?.passwordHash || DUMMY_HASH);
    if (!user || !user.passwordHash || !isPasswordValid) {
      await this.recordFailedLogin(lockKey);
      if (user && isPasswordValid === false && user.passwordHash) {
        this.logPanelAccess(user, metadata, "FAILED", "Tried to sign in with a wrong password");
      }
      throw new UnauthorizedException("Invalid credentials");
    }
    await this.redis.del(lockKey).catch(() => 0);

    if (user.role === "ASTROLOGER") {
      const profile = await this.prisma.astrologer.findUnique({ where: { userId: user.id }, select: { status: true } });
      if (profile?.status === "REJECTED") {
        throw new UnauthorizedException("This astrologer account is deactivated. Please contact the TSP office.");
      }
    }

    // Staff and astrologers with two-step verification (or required to set it
    // up) get a short-lived challenge instead of a session.
    const stage = await this.accountSecurity.twoStepStage(user);
    if (stage) {
      return {
        twoStep: stage,
        challengeToken: this.accountSecurity.issueChallenge(user.id, stage),
        name: user.name,
      };
    }

    return this.completeSignIn(user.id, metadata, "Signed in");
  }

  /** Opens a session for someone who has passed every step of signing in. */
  async completeSignIn(userId: string, metadata: SessionMetadata, summary: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const tokens = await this.createSessionAndTokens(user, metadata);
    this.logPanelAccess(user, metadata, "SUCCESS", summary);
    return {
      user: this.formatUser(user),
      ...tokens,
    };
  }

  async loginWithFirebasePhone(idToken: string, metadata: SessionMetadata) {
    const decodedToken = await this.firebaseService.verifyIdToken(idToken);
    this.assertFirebaseProvider(decodedToken, "phone");
    const { uid } = decodedToken;
    const phone = decodedToken.phone_number;

    if (!phone) {
      throw new UnauthorizedException("Firebase ID Token does not contain a phone number");
    }

    let user = await this.prisma.user.findUnique({
      where: { firebaseUid: uid },
    });

    if (!user) {
      let existingUserByPhone = await this.prisma.user.findUnique({
        where: { phone: phone },
      });
      this.assertClientAccount(existingUserByPhone);

      // A number typed into an account without an SMS code proves nothing: the
      // person who just proved it gets their own account, not that one.
      if (existingUserByPhone && !existingUserByPhone.phoneVerifiedAt) {
        await this.prisma.user.update({ where: { id: existingUserByPhone.id }, data: { phone: null } });
        existingUserByPhone = null;
      }

      if (existingUserByPhone) {
        user = await this.prisma.user.update({
          where: { id: existingUserByPhone.id },
          data: {
            firebaseUid: uid,
            phoneVerifiedAt: existingUserByPhone.phoneVerifiedAt ?? new Date(),
          },
        });
      } else {
        user = await this.prisma.$transaction(async (tx) => {
          const newUser = await tx.user.create({
            data: {
              phone: phone,
              phoneVerifiedAt: new Date(),
              firebaseUid: uid,
              authProvider: "PHONE",
              name: "Phone User",
              role: "USER",
            },
          });

          await tx.wallet.create({
            data: {
              userId: newUser.id,
              balance: 0.0,
            },
          });

          return newUser;
        });
      }
    }

    this.assertClientAccount(user);
    const tokens = await this.createSessionAndTokens(user, metadata);
    return {
      user: this.formatUser(user),
      ...tokens,
    };
  }

  async loginWithFirebaseGoogle(idToken: string, metadata: SessionMetadata) {
    const decodedToken = await this.firebaseService.verifyIdToken(idToken);
    this.assertFirebaseProvider(decodedToken, "google.com");
    const { uid, email, name, picture } = decodedToken;

    if (!email || decodedToken.email_verified !== true) {
      throw new UnauthorizedException("Your Google account's email must be verified.");
    }

    let user = await this.prisma.user.findUnique({
      where: { firebaseUid: uid },
    });

    if (!user) {
      const existingUserByEmail = await this.prisma.user.findUnique({
        where: { email },
      });
      this.assertClientAccount(existingUserByEmail);

      if (existingUserByEmail) {
        user = await this.prisma.user.update({
          where: { id: existingUserByEmail.id },
          data: {
            firebaseUid: uid,
            name: existingUserByEmail.name || name || null,
            avatarUrl: existingUserByEmail.avatarUrl || picture || null,
            ...(await this.claimUnverifiedEmailAccount(existingUserByEmail)),
          },
        });
      } else {
        user = await this.prisma.$transaction(async (tx) => {
          const newUser = await tx.user.create({
            data: {
              email,
              emailVerifiedAt: new Date(),
              firebaseUid: uid,
              authProvider: "GOOGLE",
              name: name || "Google User",
              avatarUrl: picture || null,
              role: "USER",
            },
          });

          await tx.wallet.create({
            data: {
              userId: newUser.id,
              balance: 0.0,
            },
          });

          return newUser;
        });
      }
    }

    this.assertClientAccount(user);
    const tokens = await this.createSessionAndTokens(user, metadata);
    return {
      user: this.formatUser(user),
      ...tokens,
    };
  }

  async loginWithFirebaseApple(idToken: string, metadata: SessionMetadata) {
    const decodedToken = await this.firebaseService.verifyIdToken(idToken);
    this.assertFirebaseProvider(decodedToken, "apple.com");
    const { uid, email, name } = decodedToken;

    let user = await this.prisma.user.findUnique({
      where: { firebaseUid: uid },
    });

    if (!user) {
      // Only a provider-verified email may be matched to an existing account.
      if (email && decodedToken.email_verified === true) {
        const existingUserByEmail = await this.prisma.user.findUnique({
          where: { email },
        });
        this.assertClientAccount(existingUserByEmail);

        if (existingUserByEmail) {
          user = await this.prisma.user.update({
            where: { id: existingUserByEmail.id },
            data: {
              firebaseUid: uid,
              name: existingUserByEmail.name || name || null,
              ...(await this.claimUnverifiedEmailAccount(existingUserByEmail)),
            },
          });
        }
      }

      if (!user) {
        user = await this.prisma.$transaction(async (tx) => {
          const newUser = await tx.user.create({
            data: {
              // An unverified email isn't stored, so it can't later be matched to anyone.
              email: email && decodedToken.email_verified === true ? email : null,
              emailVerifiedAt: email && decodedToken.email_verified === true ? new Date() : null,
              firebaseUid: uid,
              authProvider: "APPLE",
              name: name || "Apple User",
              role: "USER",
            },
          });

          await tx.wallet.create({
            data: {
              userId: newUser.id,
              balance: 0.0,
            },
          });

          return newUser;
        });
      }
    }

    this.assertClientAccount(user);
    const tokens = await this.createSessionAndTokens(user, metadata);
    return {
      user: this.formatUser(user),
      ...tokens,
    };
  }

  async refresh(refreshToken: string, metadata: SessionMetadata) {
    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken);
    } catch (err) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const sessionId = payload.sessionId;
    if (!sessionId || payload.typ === "access") {
      throw new UnauthorizedException("Invalid refresh token payload");
    }

    const session = await this.prisma.userSession.findUnique({
      where: { id: sessionId },
      include: { user: true },
    });

    if (!session || session.isRevoked || session.expiresAt < new Date()) {
      throw new UnauthorizedException("Session expired or revoked");
    }
    // A password reset, role change or "sign out everyone" ends refresh tokens too.
    const revokedAt = session.user.sessionsRevokedAt;
    if (revokedAt && typeof payload.iat === "number" && payload.iat < Math.floor(revokedAt.getTime() / 1000)) {
      throw new UnauthorizedException("Session ended. Please sign in again.");
    }

    // Hash incoming refresh token and compare to prevent replay attacks
    const incomingHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
    if (session.refreshTokenHash !== incomingHash) {
      // Refresh token reuse detected! Revoke all user sessions immediately for safety.
      await this.prisma.userSession.updateMany({
        where: { userId: session.userId },
        data: { isRevoked: true },
      });
      throw new UnauthorizedException("Token reuse detected. All sessions revoked");
    }

    // Revoke old session and issue a new one (Token Rotation)
    await this.prisma.userSession.update({
      where: { id: session.id },
      data: { isRevoked: true },
    });

    const newTokens = await this.createSessionAndTokens(session.user, metadata);

    return {
      user: this.formatUser(session.user),
      ...newTokens,
    };
  }

  async getSessions(userId: string) {
    return this.prisma.userSession.findMany({
      where: {
        userId,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        deviceId: true,
        deviceModel: true,
        os: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async revokeSession(userId: string, sessionId: string) {
    const session = await this.prisma.userSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.userId !== userId) {
      throw new UnauthorizedException("Session not found or access denied");
    }

    return this.prisma.userSession.update({
      where: { id: sessionId },
      data: { isRevoked: true },
    });
  }

  async forgotPassword(dto: { email: string }) {
    await this.sendPasswordLink(dto.email);
    // Same answer whether or not the email is registered (no account discovery).
    return { success: true, message: "If that email is registered, we've sent a password reset link." };
  }

  /** Emails a one-hour "set a new password" link. True when the email was handed to the mail service. */
  async sendPasswordLink(email: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.email) return false;

    const token = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    await this.prisma.user.update({
      where: { id: user.id },
      data: { resetToken: hashedToken, resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000) },
    });
    return this.mailService.sendPasswordResetEmail(user.email, token);
  }

  async resetPassword(dto: any) {
    const { token, password } = dto;
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await this.prisma.user.findFirst({
      where: {
        resetToken: hashedToken,
        resetTokenExpiry: { gt: new Date() }, // Ensure token is not expired
      },
    });

    if (!user) {
      throw new UnauthorizedException("Invalid or expired password reset token");
    }

    const newPasswordHash = await PasswordHelper.hash(password);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        resetToken: null,
        resetTokenExpiry: null,
        sessionsRevokedAt: new Date(),
        emailVerifiedAt: user.emailVerifiedAt ?? new Date(), // the link reached their inbox
      },
    });

    // Revoke all existing sessions for security
    await this.prisma.userSession.updateMany({
      where: { userId: user.id, isRevoked: false },
      data: { isRevoked: true },
    });
    this.logPanelAccess(user, {}, "SUCCESS", "Set a new password from an emailed link (signed out everywhere)");

    return { success: true, message: "Password has been successfully reset. You can now log in." };
  }

  private generateToken(user: { id: string; email: string | null; role: string }, sessionId: string) {
    const payload = { email: user.email, sub: user.id, role: user.role, sid: sessionId, typ: "access" };
    return this.jwtService.sign(payload);
  }

  private formatUser(user: any) {
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      name: user.name,
      role: user.role,
      staffRole: user.staffRole ?? null,
      permissions: permissionsFor(user.role, user.staffRole),
      avatarUrl: user.avatarUrl,
      firebaseUid: user.firebaseUid,
      authProvider: user.authProvider,
      emailVerified: !!user.emailVerifiedAt,
      phoneVerified: !!user.phoneVerifiedAt,
      pendingEmail: user.pendingEmail ?? null,
      hasPassword: !!user.passwordHash,
      twoStepEnabled: !!user.totpEnabledAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}


