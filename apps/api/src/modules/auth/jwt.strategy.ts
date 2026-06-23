import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../database/prisma.service";
import { Request } from "express";

/**
 * Extract JWT from the access_token cookie or the Authorization header.
 * This supports both web (cookie) and mobile (Bearer header) clients.
 */
function extractJwtFromCookieOrHeader(req: Request): string | null {
  // 1. Try cookie first (web clients)
  const cookieToken = req?.cookies?.access_token;
  if (cookieToken) {
    return cookieToken;
  }

  // 2. Fall back to Authorization: Bearer header (mobile clients)
  return ExtractJwt.fromAuthHeaderAsBearerToken()(req);
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: extractJwtFromCookieOrHeader,
      ignoreExpiration: false,
      secretOrKey: configService.get<string>("jwt.secret") || "dev-secret",
    });
  }

  async validate(payload: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        role: true,
        avatarUrl: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException("User not found or session invalid");
    }

    return user;
  }
}
