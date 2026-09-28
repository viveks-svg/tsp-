import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../database/prisma.service";
import { Request } from "express";
import { checkAccessToken } from "./token-check";

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
      secretOrKey: configService.getOrThrow<string>("jwt.secret"),
    });
  }

  async validate(payload: any) {
    return checkAccessToken(this.prisma, payload);
  }
}
