import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Put, Req, Res, UnauthorizedException, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { Role } from "@prisma/client";
import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";
import type { Request, Response } from "express";
import { Public } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { OptionalJwtAuthGuard } from "../../common/guards/optional-jwt-auth.guard";
import { TIER_ADMIN_INTERNAL, TIER_AUTH_STRICT } from "../../common/config/rate-limit.config";
import { PrismaService } from "../../database/prisma.service";
import { AccountSecurityService } from "./account-security.service";
import { AuthService } from "./auth.service";
import { setAuthCookie, STRONG_PASSWORD, STRONG_PASSWORD_MESSAGE } from "./auth-cookie";

class EmailDto {
  @IsEmail({}, { message: "Enter a valid email address" })
  @MaxLength(254)
  email!: string;
}

class TokenDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  token!: string;
}

class ResetPasswordDto extends TokenDto {
  @IsString()
  @MinLength(8, { message: "Password must be at least 8 characters" })
  @MaxLength(128)
  @Matches(STRONG_PASSWORD, { message: STRONG_PASSWORD_MESSAGE })
  password!: string;
}

class SetPasswordDto {
  @IsOptional()
  @IsString()
  @MaxLength(128)
  currentPassword?: string;

  @IsString()
  @MinLength(8, { message: "Password must be at least 8 characters" })
  @MaxLength(128)
  @Matches(STRONG_PASSWORD, { message: STRONG_PASSWORD_MESSAGE })
  newPassword!: string;
}

class IdTokenDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(4096)
  idToken!: string;
}

class CodeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  code!: string;
}

class ChallengeDto {
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  challengeToken?: string;
}

class ChallengeCodeDto extends CodeDto {
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  challengeToken?: string;
}

class SecuritySettingsDto {
  @IsBoolean()
  requireStaffTwoStep!: boolean;
}

const metadataOf = (req: Request) => ({ ipAddress: req.ip, userAgent: req.headers["user-agent"] });

/**
 * Account security: password reset, email verification, adding a phone or
 * email, choosing a password, and two-step verification (authenticator app).
 */
@Controller("auth")
export class AccountSecurityController {
  constructor(
    private readonly security: AccountSecurityService,
    private readonly auth: AuthService,
  ) {}

  // ── Password reset (signed out) ───────────────────────────────────────────

  @Public()
  @Throttle(TIER_AUTH_STRICT)
  @Post("forgot-password")
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() dto: EmailDto) {
    return this.auth.forgotPassword({ email: dto.email.trim().toLowerCase() });
  }

  @Public()
  @Throttle(TIER_AUTH_STRICT)
  @Post("reset-password")
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto);
  }

  // ── Email ─────────────────────────────────────────────────────────────────

  @Public()
  @Throttle(TIER_AUTH_STRICT)
  @Post("verify-email")
  @HttpCode(HttpStatus.OK)
  verifyEmail(@Body() dto: TokenDto) {
    return this.security.verifyEmail(dto.token);
  }

  @Throttle({ default: { limit: 3, ttl: 60_000 }, long: { limit: 10, ttl: 3_600_000 } })
  @Post("verify-email/resend")
  @HttpCode(HttpStatus.OK)
  resendVerification(@CurrentUser() user: { id: string }) {
    return this.security.sendEmailVerification(user.id);
  }

  /** Add or change the account's email; it takes effect when its link is clicked. */
  @Throttle({ default: { limit: 3, ttl: 60_000 }, long: { limit: 10, ttl: 3_600_000 } })
  @Post("email")
  @HttpCode(HttpStatus.OK)
  addEmail(@CurrentUser() user: { id: string }, @Body() dto: EmailDto) {
    return this.security.addEmail(user.id, dto.email);
  }

  // ── Phone & password ──────────────────────────────────────────────────────

  /** Add a phone number proven by an SMS code (the Firebase token from that check). */
  @Throttle(TIER_AUTH_STRICT)
  @Post("phone")
  @HttpCode(HttpStatus.OK)
  linkPhone(@CurrentUser() user: { id: string }, @Body() dto: IdTokenDto) {
    return this.security.linkPhone(user.id, dto.idToken);
  }

  @Throttle(TIER_AUTH_STRICT)
  @Post("password")
  @HttpCode(HttpStatus.OK)
  setPassword(@CurrentUser() user: { id: string; sid: string | null }, @Body() dto: SetPasswordDto) {
    return this.security.setPassword(user.id, user.sid, dto.currentPassword, dto.newPassword);
  }

  // ── Two-step verification ─────────────────────────────────────────────────

  @Get("two-step")
  twoStepStatus(@CurrentUser() user: { id: string }) {
    return this.security.status(user.id);
  }

  /**
   * Start setting up an authenticator. Signed in: from the account page.
   * With a SETUP challenge: during sign-in, when the office requires it.
   */
  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Throttle(TIER_AUTH_STRICT)
  @Post("two-step/setup")
  @HttpCode(HttpStatus.OK)
  setup(@Req() req: Request, @Body() dto: ChallengeDto) {
    return this.security.beginSetup(this.whoIsSettingUp(req, dto.challengeToken));
  }

  /** Confirm the first code. During sign-in this also finishes signing in. */
  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Throttle(TIER_AUTH_STRICT)
  @Post("two-step/enable")
  @HttpCode(HttpStatus.OK)
  async enable(@Req() req: Request, @Res({ passthrough: true }) res: Response, @Body() dto: ChallengeCodeDto) {
    const userId = this.whoIsSettingUp(req, dto.challengeToken);
    const { recoveryCodes } = await this.security.enable(userId, dto.code);
    if (!dto.challengeToken) return { recoveryCodes };
    const signedIn = await this.auth.completeSignIn(userId, metadataOf(req), "Signed in (set up two-step verification)");
    setAuthCookie(res, signedIn.accessToken);
    return { ...signedIn, recoveryCodes };
  }

  /** Second step of signing in: the code from the authenticator app, or a recovery code. */
  @Public()
  @Throttle(TIER_AUTH_STRICT)
  @Post("two-step/verify")
  @HttpCode(HttpStatus.OK)
  async verify(@Req() req: Request, @Res({ passthrough: true }) res: Response, @Body() dto: ChallengeCodeDto) {
    if (!dto.challengeToken) throw new UnauthorizedException("This sign-in has expired. Please start again.");
    const { userId, stage } = this.security.readChallenge(dto.challengeToken);
    if (stage !== "VERIFY") throw new UnauthorizedException("This sign-in has expired. Please start again.");
    const used = await this.security.verifyCode(userId, dto.code);
    const signedIn = await this.auth.completeSignIn(
      userId,
      metadataOf(req),
      used === "RECOVERY" ? "Signed in with a recovery code" : "Signed in (two-step verified)",
    );
    setAuthCookie(res, signedIn.accessToken);
    return signedIn;
  }

  @Throttle(TIER_AUTH_STRICT)
  @Post("two-step/disable")
  @HttpCode(HttpStatus.OK)
  disable(@CurrentUser() user: { id: string }, @Body() dto: CodeDto) {
    return this.security.disable(user.id, dto.code);
  }

  @Throttle(TIER_AUTH_STRICT)
  @Post("two-step/recovery-codes")
  @HttpCode(HttpStatus.OK)
  recoveryCodes(@CurrentUser() user: { id: string }, @Body() dto: CodeDto) {
    return this.security.regenerateRecoveryCodes(user.id, dto.code);
  }

  private whoIsSettingUp(req: Request, challengeToken?: string): string {
    if (challengeToken) {
      const { userId, stage } = this.security.readChallenge(challengeToken);
      if (stage !== "SETUP") throw new UnauthorizedException("This sign-in has expired. Please start again.");
      return userId;
    }
    const user = (req as any).user as { id: string } | null;
    if (!user?.id) throw new UnauthorizedException("Please sign in.");
    return user.id;
  }
}

/** Super admins: require two-step for the team, and reset it for someone who lost their phone. */
@Controller("admin")
@Roles(Role.ADMIN)
@Throttle(TIER_ADMIN_INTERNAL)
export class AdminAccountSecurityController {
  constructor(
    private readonly security: AccountSecurityService,
    private readonly prisma: PrismaService,
  ) {}

  @Get("settings/security")
  @RequirePermission("settings.manage")
  getSettings() {
    return this.security.getSettings();
  }

  @Put("settings/security")
  @RequirePermission("settings.manage")
  saveSettings(@CurrentUser() actor: { id: string }, @Body() dto: SecuritySettingsDto) {
    return this.security.saveSettings(actor.id, dto);
  }

  @Post("team/:userId/reset-two-step")
  @RequirePermission("team.manage")
  @HttpCode(HttpStatus.OK)
  async resetStaff(@Param("userId") userId: string) {
    await this.prisma.user.findFirstOrThrow({ where: { id: userId, role: "ADMIN" }, select: { id: true } });
    return this.security.adminReset(userId);
  }

  @Post("astrologers/:id/reset-two-step")
  @RequirePermission("astrologers.manage")
  @HttpCode(HttpStatus.OK)
  async resetAstrologer(@Param("id") astrologerId: string) {
    const a = await this.prisma.astrologer.findUniqueOrThrow({ where: { id: astrologerId }, select: { userId: true } });
    return this.security.adminReset(a.userId);
  }
}
