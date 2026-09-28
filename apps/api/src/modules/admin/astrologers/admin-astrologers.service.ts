import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { randomInt } from "crypto";
import { PrismaService } from "../../../database/prisma.service";
import { PasswordHelper } from "../../../common/utils/password.helper";
import { AuthService } from "../../auth/auth.service";
import { ScheduleService } from "../../schedule/schedule.service";
import { CreateAstrologerDto, UpdateAstrologerDto } from "./admin-astrologers.dto";

/**
 * Admins create and look after astrologer logins. Astrologers are never admins:
 * an astrologer login only reaches the astrologer panel and their own sessions.
 */
@Injectable()
export class AdminAstrologersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
    private readonly schedule: ScheduleService,
  ) {}

  async list() {
    const [rows, provider] = await Promise.all([
      this.prisma.astrologer.findMany({
        orderBy: { createdAt: "asc" },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true, totpEnabledAt: true } },
          _count: { select: { consultations: true } },
        },
      }),
      this.schedule.getProvider(),
    ]);
    return rows.map((a) => ({
      id: a.id,
      userId: a.userId,
      name: a.user.name,
      email: a.user.email,
      phone: a.user.phone,
      bio: a.bio,
      pricingPerMin: Number(a.pricingPerMin),
      status: a.status,
      isAvailable: a.isAvailable,
      loginActive: a.user.role === "ASTROLOGER",
      twoStepEnabled: !!a.user.totpEnabledAt,
      consultations: a._count.consultations,
      takesLiveQueue: provider?.astrologerId === a.id,
      createdAt: a.createdAt,
    }));
  }

  async create(actorId: string, dto: CreateAstrologerDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({
      where: { email },
      include: { astrologer: { select: { id: true } } },
    });

    if (existing?.astrologer) throw new ConflictException("This email is already an astrologer.");
    if (existing && existing.id === actorId) {
      throw new BadRequestException("You can't turn your own admin login into an astrologer.");
    }
    if (existing && !dto.convertExisting) {
      // The UI asks the admin to confirm before converting someone else's account.
      throw new ConflictException({
        code: "ACCOUNT_EXISTS",
        role: existing.role,
        message:
          existing.role === "ADMIN"
            ? "This email is an admin login. Converting it removes its admin access."
            : "This email already has a client account. Converting it makes it an astrologer login.",
      });
    }
    if (existing?.role === "ADMIN") {
      const otherAdmins = await this.prisma.user.count({ where: { role: "ADMIN", id: { not: existing.id } } });
      if (otherAdmins === 0) throw new BadRequestException("The last admin can't be converted.");
    }

    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await PasswordHelper.hash(temporaryPassword);

    const astrologer = await this.prisma.$transaction(async (tx) => {
      const user = existing
        ? await tx.user.update({
            where: { id: existing.id },
            data: {
              role: "ASTROLOGER",
              name: dto.name.trim(),
              phone: dto.phone ?? existing.phone,
              passwordHash,
              sessionsRevokedAt: new Date(),
            },
          })
        : await tx.user.create({
            data: {
              email,
              name: dto.name.trim(),
              phone: dto.phone,
              passwordHash,
              role: "ASTROLOGER",
              authProvider: "EMAIL",
            },
          });

      // A converted account signs in again with the new credentials.
      if (existing) {
        await tx.userSession.updateMany({ where: { userId: user.id, isRevoked: false }, data: { isRevoked: true } });
      }

      await tx.wallet.upsert({
        where: { userId: user.id },
        create: { userId: user.id, balance: 0 },
        update: {},
      });

      return tx.astrologer.create({
        data: {
          userId: user.id,
          bio: dto.bio?.trim() || "",
          pricingPerMin: new Prisma.Decimal(dto.pricingPerMin),
          status: "APPROVED",
          approvedAt: new Date(),
          approvedById: actorId,
        },
      });
    });

    const setupEmailSent = dto.sendSetupEmail ? await this.auth.sendPasswordLink(email) : false;

    return { astrologerId: astrologer.id, email, temporaryPassword, setupEmailSent };
  }

  async update(id: string, dto: UpdateAstrologerDto) {
    const astrologer = await this.find(id);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: astrologer.userId },
        data: {
          ...(dto.name !== undefined && { name: dto.name.trim() }),
          ...(dto.phone !== undefined && { phone: dto.phone }),
        },
      }),
      this.prisma.astrologer.update({
        where: { id },
        data: {
          ...(dto.bio !== undefined && { bio: dto.bio.trim() }),
          ...(dto.pricingPerMin !== undefined && { pricingPerMin: new Prisma.Decimal(dto.pricingPerMin) }),
          ...(dto.isAvailable !== undefined && { isAvailable: dto.isAvailable }),
        },
      }),
    ]);
    return this.list();
  }

  /**
   * New temporary password (shown once; signs them out everywhere now), or an emailed
   * set-password link (they are signed out everywhere when they use it).
   */
  async resetPassword(id: string, mode: "temporary" | "email") {
    const astrologer = await this.find(id);
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: astrologer.userId } });

    if (mode === "email") {
      if (!user.email) throw new BadRequestException("This astrologer has no email address.");
      if (!(await this.auth.sendPasswordLink(user.email))) {
        throw new BadRequestException("The email couldn't be sent. Use a temporary password instead, or try again later.");
      }
      return { mode, sentTo: user.email };
    }

    const temporaryPassword = generateTemporaryPassword();
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash: await PasswordHelper.hash(temporaryPassword),
          resetToken: null,
          resetTokenExpiry: null,
          sessionsRevokedAt: new Date(),
        },
      }),
      this.prisma.userSession.updateMany({ where: { userId: user.id, isRevoked: false }, data: { isRevoked: true } }),
    ]);
    return { mode, email: user.email, temporaryPassword };
  }

  /** Signs them out, blocks sign-in and hides them from clients. Reversible. */
  async deactivate(id: string) {
    const astrologer = await this.find(id);
    const provider = await this.schedule.getProvider();
    if (provider?.chosen && provider.astrologerId === id) {
      throw new BadRequestException(
        "This astrologer holds the consultation hours. Choose another astrologer on Consultation Hours first.",
      );
    }
    await this.prisma.$transaction([
      this.prisma.astrologer.update({
        where: { id },
        data: { status: "REJECTED", rejectionReason: "Deactivated by the TSP office", isAvailable: false },
      }),
      this.prisma.user.update({ where: { id: astrologer.userId }, data: { sessionsRevokedAt: new Date() } }),
      this.prisma.userSession.updateMany({ where: { userId: astrologer.userId, isRevoked: false }, data: { isRevoked: true } }),
    ]);
    return this.list();
  }

  async reactivate(id: string) {
    await this.find(id);
    await this.prisma.astrologer.update({
      where: { id },
      data: { status: "APPROVED", rejectionReason: null, approvedAt: new Date() },
    });
    return this.list();
  }

  private async find(id: string) {
    const astrologer = await this.prisma.astrologer.findUnique({ where: { id } });
    if (!astrologer) throw new NotFoundException("Astrologer not found.");
    return astrologer;
  }
}

/**
 * 14 characters from an unambiguous alphabet (no 0/O, 1/l/I), always including
 * upper, lower, digit and symbol so it passes the sign-up password rules.
 */
function generateTemporaryPassword() {
  const sets = ["ABCDEFGHJKLMNPQRSTUVWXYZ", "abcdefghijkmnpqrstuvwxyz", "23456789", "@#$%&*!?"];
  const all = sets.join("");
  const chars = sets.map((s) => s[randomInt(s.length)]);
  while (chars.length < 14) chars.push(all[randomInt(all.length)]);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}
