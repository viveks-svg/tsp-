import { BadRequestException, ConflictException, GoneException, Injectable, NotFoundException } from "@nestjs/common";
import { Role, StaffRole } from "@prisma/client";
import { createHash, randomBytes } from "crypto";
import { PrismaService } from "../../../database/prisma.service";
import { PasswordHelper } from "../../../common/utils/password.helper";
import { AuditService } from "../../audit/audit.service";
import { MailService } from "../../mail/mail.service";
import { ROLE_PERMISSIONS } from "../../../common/permissions";

const INVITE_DAYS = 7;

export const STAFF_ROLE_LABEL: Record<StaffRole, string> = {
  SUPER_ADMIN: "Super Admin",
  MANAGER: "Manager",
  SUPPORT: "Support",
  CONTENT: "Content",
};

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

/**
 * The admin team: who has access, with which role, and invitations for new
 * teammates. Only SUPER_ADMINs reach this (permission "team.manage").
 * Guard rails: nobody changes or removes themselves, and the last super admin
 * can't be demoted or removed.
 */
@Injectable()
export class TeamService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly audit: AuditService,
  ) {}

  async overview() {
    const [members, invites] = await Promise.all([
      this.prisma.user.findMany({
        where: { role: "ADMIN" },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          name: true,
          email: true,
          staffRole: true,
          createdAt: true,
          totpEnabledAt: true,
          sessions: { where: { isRevoked: false }, orderBy: { updatedAt: "desc" }, take: 1, select: { updatedAt: true } },
        },
      }),
      this.prisma.staffInvite.findMany({
        where: { acceptedAt: null, revokedAt: null },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          name: true,
          staffRole: true,
          expiresAt: true,
          createdAt: true,
          invitedBy: { select: { name: true } },
        },
      }),
    ]);
    return {
      members: members.map(({ sessions, totpEnabledAt, ...m }) => ({
        ...m,
        lastActiveAt: sessions[0]?.updatedAt ?? null,
        twoStepEnabled: !!totpEnabledAt,
      })),
      invites: invites.map((i) => ({ ...i, expired: i.expiresAt < new Date(), invitedBy: i.invitedBy.name })),
      roles: (Object.keys(ROLE_PERMISSIONS) as StaffRole[]).map((r) => ({
        role: r,
        label: STAFF_ROLE_LABEL[r],
        permissions: ROLE_PERMISSIONS[r],
      })),
    };
  }

  async invite(inviterId: string, input: { email: string; name?: string; staffRole: StaffRole }) {
    const email = input.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email }, select: { role: true } });
    if (existing?.role === "ADMIN") throw new ConflictException("This person is already on the team.");
    if (existing?.role === "ASTROLOGER") {
      throw new BadRequestException("This email is an astrologer login. Astrologers can't be admins — use a different email.");
    }

    // One live invitation per email: a new invite replaces older ones.
    await this.prisma.staffInvite.updateMany({
      where: { email, acceptedAt: null, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    const token = randomBytes(32).toString("hex");
    const invite = await this.prisma.staffInvite.create({
      data: {
        email,
        name: input.name?.trim() || null,
        staffRole: input.staffRole,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + INVITE_DAYS * 86_400_000),
        invitedById: inviterId,
      },
    });
    return this.deliver(invite.id, token);
  }

  /** A fresh link for a pending invite (the old link stops working). */
  async resend(inviteId: string) {
    const invite = await this.prisma.staffInvite.findFirst({ where: { id: inviteId, acceptedAt: null, revokedAt: null } });
    if (!invite) throw new NotFoundException("That invitation is no longer pending.");
    const token = randomBytes(32).toString("hex");
    await this.prisma.staffInvite.update({
      where: { id: inviteId },
      data: { tokenHash: hashToken(token), expiresAt: new Date(Date.now() + INVITE_DAYS * 86_400_000) },
    });
    return this.deliver(inviteId, token);
  }

  async revoke(inviteId: string) {
    const { count } = await this.prisma.staffInvite.updateMany({
      where: { id: inviteId, acceptedAt: null, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (!count) throw new NotFoundException("That invitation is no longer pending.");
    return this.overview();
  }

  private async deliver(inviteId: string, token: string) {
    const invite = await this.prisma.staffInvite.findUniqueOrThrow({
      where: { id: inviteId },
      include: { invitedBy: { select: { name: true } } },
    });
    const link = `${process.env.FRONTEND_URL || "http://localhost:3000"}/accept-invite?token=${token}`;
    const emailed = await this.mail.sendStaffInviteEmail(invite.email, {
      name: invite.name,
      roleLabel: STAFF_ROLE_LABEL[invite.staffRole],
      link,
      inviterName: invite.invitedBy.name,
    });
    // The link is returned to the inviter so they can share it if email doesn't arrive.
    return { inviteId, email: invite.email, link, emailed, expiresAt: invite.expiresAt };
  }

  async changeRole(actorId: string, userId: string, staffRole: StaffRole) {
    if (actorId === userId) throw new BadRequestException("You can't change your own role.");
    const member = await this.member(userId);
    if (member.staffRole === "SUPER_ADMIN" && staffRole !== "SUPER_ADMIN") await this.assertAnotherSuperAdmin(userId);
    await this.prisma.user.update({ where: { id: userId }, data: { staffRole } });
    return this.overview();
  }

  /** Takes away admin access; the account remains as an ordinary client login and is signed out. */
  async remove(actorId: string, userId: string) {
    if (actorId === userId) throw new BadRequestException("You can't remove yourself.");
    const member = await this.member(userId);
    if (member.staffRole === "SUPER_ADMIN") await this.assertAnotherSuperAdmin(userId);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { role: "USER", staffRole: null, sessionsRevokedAt: new Date() },
      }),
      this.prisma.userSession.updateMany({ where: { userId, isRevoked: false }, data: { isRevoked: true } }),
    ]);
    return this.overview();
  }

  async signOutEveryoneElse(actorId: string) {
    const where = { role: { in: ["ADMIN", "ASTROLOGER"] as Role[] }, id: { not: actorId } };
    const people = await this.prisma.user.findMany({ where, select: { id: true } });
    const ids = people.map((p) => p.id);
    await this.prisma.$transaction([
      this.prisma.user.updateMany({ where: { id: { in: ids } }, data: { sessionsRevokedAt: new Date() } }),
      this.prisma.userSession.updateMany({ where: { userId: { in: ids }, isRevoked: false }, data: { isRevoked: true } }),
    ]);
    return { signedOut: ids.length };
  }

  private async member(userId: string) {
    const m = await this.prisma.user.findFirst({ where: { id: userId, role: "ADMIN" }, select: { id: true, staffRole: true } });
    if (!m) throw new NotFoundException("Team member not found.");
    return m;
  }

  private async assertAnotherSuperAdmin(userId: string) {
    const others = await this.prisma.user.count({ where: { role: "ADMIN", staffRole: "SUPER_ADMIN", id: { not: userId } } });
    if (!others) throw new BadRequestException("There must always be at least one Super Admin.");
  }

  // ── Accepting (public, by token) ─────────────────────────────────────────

  async peek(token: string) {
    const invite = await this.findUsable(token);
    return { email: invite.email, name: invite.name, roleLabel: STAFF_ROLE_LABEL[invite.staffRole] };
  }

  async accept(token: string, name: string, password: string) {
    const invite = await this.findUsable(token);
    const existing = await this.prisma.user.findUnique({ where: { email: invite.email } });
    if (existing?.role === "ASTROLOGER") {
      throw new BadRequestException("This email is an astrologer login and can't join the admin team.");
    }
    const passwordHash = await PasswordHelper.hash(password);

    const joined = await this.prisma.$transaction(async (tx) => {
      let userId: string;
      if (existing) {
        // The invitee proved they own the email; their client account becomes a staff login.
        await tx.user.update({
          where: { id: existing.id },
          data: { role: "ADMIN", staffRole: invite.staffRole, name: name.trim(), passwordHash, sessionsRevokedAt: new Date() },
        });
        await tx.userSession.updateMany({ where: { userId: existing.id, isRevoked: false }, data: { isRevoked: true } });
        userId = existing.id;
      } else {
        const user = await tx.user.create({
          data: {
            email: invite.email,
            name: name.trim(),
            passwordHash,
            role: "ADMIN",
            staffRole: invite.staffRole,
            authProvider: "EMAIL",
          },
        });
        await tx.wallet.create({ data: { userId: user.id, balance: 0 } });
        userId = user.id;
      }
      await tx.staffInvite.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } });
      return userId;
    });
    void this.audit.record({
      actor: { id: joined, name: name.trim(), email: invite.email, role: "ADMIN", staffRole: invite.staffRole },
      action: "team.join",
      area: "people",
      summary: `Accepted the invite and joined the team as ${STAFF_ROLE_LABEL[invite.staffRole]}`,
      targetType: "StaffInvite",
      targetId: invite.id,
    });
    return { email: invite.email, roleLabel: STAFF_ROLE_LABEL[invite.staffRole] };
  }

  private async findUsable(token: string) {
    if (!token || !/^[a-f0-9]{64}$/.test(token)) throw new NotFoundException("This invitation link isn't valid.");
    const invite = await this.prisma.staffInvite.findUnique({ where: { tokenHash: hashToken(token) } });
    if (!invite || invite.revokedAt) throw new NotFoundException("This invitation link isn't valid.");
    if (invite.acceptedAt) throw new GoneException("This invitation has already been used. Sign in instead.");
    if (invite.expiresAt < new Date()) throw new GoneException("This invitation has expired. Ask for a new one.");
    return invite;
  }
}
