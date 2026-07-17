import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Req,
  Res,
  Get,
  Param,
  Delete,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { AuthService } from "./auth.service";
import { SignupDto, LoginDto, RefreshTokenDto } from "./dto/auth.dto";
import { FirebaseAuthDto } from "./dto/firebase-auth.dto";
import { Public } from "../../common/decorators/public.decorator";
import { TIER_AUTH_STRICT, TIER_AUTH_REFRESH } from "../../common/config/rate-limit.config";
import { Request, Response } from "express";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { PrismaService } from "../../database/prisma.service";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
  ) { }

  /** Set the access token as an HTTP-only cookie on the response. */
  private setAuthCookie(res: Response, accessToken: string): void {
    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("access_token", accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: "/",
      maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days
    });
  }

  /** Clear the access token cookie. */
  private clearAuthCookie(res: Response): void {
    const isProduction = process.env.NODE_ENV === "production";
    res.clearCookie("access_token", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: "/",
    });
  }

  private getSessionMetadata(req: Request, body: any): any {
    const rawIp =
      req.headers["x-forwarded-for"] || req.ip || req.socket.remoteAddress;
    const ipAddress = Array.isArray(rawIp) ? rawIp[0] : (rawIp as string);

    return {
      ipAddress,
      userAgent: req.headers["user-agent"],
      deviceId:
        (req.headers["x-device-id"] as string) || body?.deviceId || null,
      deviceModel:
        (req.headers["x-device-model"] as string) || body?.deviceModel || null,
      os: (req.headers["x-device-os"] as string) || body?.os || null,
    };
  }

  @Public()
  @Throttle(TIER_AUTH_STRICT)
  @Post("signup")
  async signup(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() signupDto: SignupDto,
  ) {
    const metadata = this.getSessionMetadata(req, signupDto);
    const result = await this.authService.signup(signupDto, metadata);
    this.setAuthCookie(res, result.accessToken);
    return result;
  }

  @Public()
  @Throttle(TIER_AUTH_STRICT)
  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() loginDto: LoginDto,
  ) {
    const metadata = this.getSessionMetadata(req, loginDto);
    const result = await this.authService.login(loginDto, metadata);
    this.setAuthCookie(res, result.accessToken);
    return result;
  }

  @Public()
  @Throttle(TIER_AUTH_STRICT)
  @Post("firebase/phone")
  @HttpCode(HttpStatus.OK)
  async loginWithFirebasePhone(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() firebaseAuthDto: FirebaseAuthDto,
  ) {
    const metadata = this.getSessionMetadata(req, firebaseAuthDto);
    const result = await this.authService.loginWithFirebasePhone(
      firebaseAuthDto.idToken,
      metadata,
    );
    this.setAuthCookie(res, result.accessToken);
    return result;
  }

  @Public()
  @Throttle(TIER_AUTH_STRICT)
  @Post("firebase/google")
  @HttpCode(HttpStatus.OK)
  async loginWithFirebaseGoogle(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() firebaseAuthDto: FirebaseAuthDto,
  ) {
    const metadata = this.getSessionMetadata(req, firebaseAuthDto);
    const result = await this.authService.loginWithFirebaseGoogle(
      firebaseAuthDto.idToken,
      metadata,
    );
    this.setAuthCookie(res, result.accessToken);
    return result;
  }

  @Public()
  @Throttle(TIER_AUTH_STRICT)
  @Post("firebase/apple")
  @HttpCode(HttpStatus.OK)
  async loginWithFirebaseApple(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() firebaseAuthDto: FirebaseAuthDto,
  ) {
    const metadata = this.getSessionMetadata(req, firebaseAuthDto);
    const result = await this.authService.loginWithFirebaseApple(
      firebaseAuthDto.idToken,
      metadata,
    );
    this.setAuthCookie(res, result.accessToken);
    return result;
  }

  @Public()
  @Throttle(TIER_AUTH_REFRESH)
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() dto: RefreshTokenDto,
  ) {
    const metadata = this.getSessionMetadata(req, dto);
    const result = await this.authService.refresh(dto.refreshToken, metadata);
    this.setAuthCookie(res, result.accessToken);
    return result;
  }

  /**
   * GET /auth/me
   * Returns the currently authenticated user and their wallet balance.
   * Used by the frontend to hydrate auth state on page load.
   */
  @Get("me")
  async me(@CurrentUser() user: any) {
    // Fetch full user record + wallet balance
    const fullUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        role: true,
        avatarUrl: true,
        firebaseUid: true,
        authProvider: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const wallet = await this.prisma.wallet.findUnique({
      where: { userId: user.id },
      select: { balance: true },
    });

    return {
      user: fullUser,
      walletBalance: wallet?.balance ?? 0,
    };
  }

  /**
   * GET /auth/ws-token
   * Returns the current access token from the httpOnly cookie.
   * Used by the frontend Socket.io client to authenticate WebSocket
   * connections, since httpOnly cookies cannot be read by JavaScript
   * and cross-origin WebSocket handshakes may not carry them.
   *
   * This endpoint is itself protected by the JWT guard (which reads
   * the cookie), so only authenticated users can get a token.
   */
  @Get("ws-token")
  async getWsToken(@Req() req: Request) {
    const token = req.cookies?.access_token;
    if (!token) {
      return { token: null };
    }
    return { token };
  }


  /**
   * POST /auth/logout
   * Clears the auth cookie and revokes the current session.
   */
  @Post("logout")
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() user: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Revoke all active sessions for this user (simple approach)
    await this.prisma.userSession.updateMany({
      where: { userId: user.id, isRevoked: false },
      data: { isRevoked: true },
    });

    this.clearAuthCookie(res);
    return { success: true, message: "Logged out successfully" };
  }

  @Get("sessions")
  async getSessions(@CurrentUser() user: any) {
    return this.authService.getSessions(user.id);
  }

  @Delete("sessions/:id")
  async revokeSession(
    @CurrentUser() user: any,
    @Param("id") id: string,
  ) {
    await this.authService.revokeSession(user.id, id);
    return { success: true, message: "Session revoked successfully" };
  }
}
