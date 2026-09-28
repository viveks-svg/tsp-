import { UnauthorizedException } from "@nestjs/common";
import type { PrismaService } from "../../database/prisma.service";

/**
 * Whether a verified access-token payload may still be used — shared by HTTP
 * requests (JwtStrategy) and socket connections (realtime gateway):
 *   - refresh tokens are not access tokens;
 *   - the session it belongs to must not be signed out or revoked;
 *   - tokens issued before a password reset / role change / "sign out everyone" are dead;
 *   - a deactivated astrologer can't use their login.
 */
export async function checkAccessToken(prisma: PrismaService, payload: any) {
  // Only access tokens: not refresh tokens, not two-step sign-in challenges.
  if (!payload?.sub || (payload.typ && payload.typ !== "access") || payload.sessionId) {
    throw new UnauthorizedException("Invalid token");
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      email: true,
      phone: true,
      name: true,
      role: true,
      staffRole: true,
      avatarUrl: true,
      sessionsRevokedAt: true,
      astrologer: { select: { status: true } },
    },
  });
  if (!user) throw new UnauthorizedException("User not found or session invalid");

  const { sessionsRevokedAt, astrologer, ...rest } = user;
  if (sessionsRevokedAt && typeof payload.iat === "number" && payload.iat < Math.floor(sessionsRevokedAt.getTime() / 1000)) {
    throw new UnauthorizedException("Session ended. Please sign in again.");
  }

  // Tokens carry their session (sid) so signing out or revoking a device ends them at once.
  // (Tokens issued before this check existed have no sid and simply run until they expire.)
  if (payload.sid) {
    const session = await prisma.userSession.findUnique({
      where: { id: payload.sid },
      select: { userId: true, isRevoked: true, expiresAt: true },
    });
    if (!session || session.userId !== user.id || session.isRevoked || session.expiresAt < new Date()) {
      throw new UnauthorizedException("Session ended. Please sign in again.");
    }
  }

  if (user.role === "ASTROLOGER" && astrologer?.status === "REJECTED") {
    throw new UnauthorizedException("This astrologer account is deactivated. Please contact the TSP office.");
  }

  return { ...rest, sid: (payload.sid as string | undefined) ?? null };
}
