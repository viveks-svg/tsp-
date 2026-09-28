import { EarningsService } from "../finance/earnings.service";
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { CreateConsultationDto, CompleteConsultationDto } from "./dto/consultation.dto";
import { WalletService } from "../wallet/wallet.service";
import { GoogleCalendarService } from "../../integrations/google-calendar/google-calendar.service";
import { Prisma } from "@prisma/client";

@Injectable()
export class ConsultationsService {
  constructor(
    private readonly earnings: EarningsService,
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
    private readonly googleCalendarService: GoogleCalendarService,
  ) {}

  async create(userId: string, dto: CreateConsultationDto) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new NotFoundException("User wallet not found");
    }

    const astrologer = await this.prisma.astrologer.findUnique({
      where: { id: dto.astrologerId },
      include: { 
        user: true,
        availabilityRules: true,
        exceptions: {
          where: {
            date: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
              lt: new Date(new Date().setHours(23, 59, 59, 999)),
            }
          }
        }
      },
    });

    if (!astrologer || astrologer.status !== "APPROVED") {
      throw new BadRequestException("Astrologer is not approved or active");
    }

    let isAvailable = astrologer.isAvailable;
    const now = new Date();
    const currentDay = now.getDay();
    const currentHourMin = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    if (isAvailable && astrologer.availabilityRules.length > 0) {
      const todayException = astrologer.exceptions[0];
      if (todayException) {
        isAvailable = todayException.isAvailable;
      } else {
        const ruleForToday = astrologer.availabilityRules.find(r => r.dayOfWeek === currentDay);
        if (ruleForToday) {
          if (currentHourMin < ruleForToday.startTime || currentHourMin > ruleForToday.endTime) {
            isAvailable = false;
          }
        } else {
          isAvailable = false;
        }
      }
    }

    if (!isAvailable) {
      throw new BadRequestException("This astrologer is currently offline or not scheduled for today.");
    }

    if (astrologer.userId === userId) {
      throw new BadRequestException("You cannot book a consultation with yourself");
    }

    const minRequiredBalance = astrologer.pricingPerMin.mul(15);
    if (wallet.balance.lt(minRequiredBalance)) {
      throw new BadRequestException(
        `Insufficient wallet balance. You need at least ${minRequiredBalance.toString()} (15 mins) to book a consultation.`,
      );
    }

    const scheduledDate = new Date(dto.scheduledAt);
    if (scheduledDate <= new Date()) {
      throw new BadRequestException("Scheduled time must be in the future");
    }
    
    const clientUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true }
    });

    // Create Calendar Event & Meet Link
    const meetDetails = await this.googleCalendarService.createEventWithMeetLink(
      `TSP Consultation: ${clientUser?.name || "Client"} & ${astrologer.user.name}`,
      `Consultation on TSP.`,
      scheduledDate,
      new Date(scheduledDate.getTime() + 15 * 60 * 1000), // Assuming 15 min duration
      [clientUser?.email, astrologer.user.email].filter(Boolean) as string[],
    );

    return this.prisma.consultation.create({
      data: {
        userId,
        astrologerId: dto.astrologerId,
        lockedPricingPerMin: astrologer.pricingPerMin,
        scheduledAt: scheduledDate,
        status: "PENDING",
        calendarEventId: meetDetails?.eventId,
        meetLink: meetDetails?.meetLink,
      },
    });
  }

  async start(userId: string, id: string) {
    const consultation = await this.prisma.consultation.findUnique({
      where: { id },
      include: {
        astrologer: true,
      },
    });

    if (!consultation) {
      throw new NotFoundException("Consultation not found");
    }

    if (consultation.status !== "PENDING" && consultation.status !== "ACTIVE") {
      throw new BadRequestException(
        `Consultation cannot be started. Current status: ${consultation.status}`,
      );
    }

    // Check ownership
    const isClient = consultation.userId === userId;
    const isAstrologer = consultation.astrologer?.userId === userId;

    if (!isClient && !isAstrologer) {
      throw new ForbiddenException("You do not have access to start this consultation");
    }

    return this.prisma.$transaction(async (tx) => {
      // The paid clock starts when the astrologer joins — not while the client waits.
      if (isAstrologer) {
        await tx.consultation.updateMany({ where: { id, startedAt: null }, data: { startedAt: new Date() } });
      }
      const updated = await tx.consultation.update({
        where: { id },
        data: { status: "ACTIVE" },
        include: {
          chatThread: true,
          astrologer: {
            include: {
              user: true,
            },
          },
        },
      });

      if (!updated.chatThread) {
        const thread = await tx.chatThread.create({
          data: {
            consultationId: id,
            status: "ACTIVE",
          },
        });
        (updated as any).chatThread = thread;
      }

      return updated;
    });
  }

  async complete(userId: string, id: string, dto: CompleteConsultationDto) {
    const consultation = await this.prisma.consultation.findUnique({
      where: { id },
      include: {
        astrologer: {
          include: { user: true },
        },
        user: {
          include: { wallet: true },
        },
      },
    });

    if (!consultation) {
      throw new NotFoundException("Consultation not found");
    }

    if (consultation.status !== "ACTIVE") {
      throw new BadRequestException(
        `Consultation cannot be completed. Current status: ${consultation.status}`,
      );
    }

    // Check ownership
    const isClient = consultation.userId === userId;
    const isAstrologer = consultation.astrologer?.userId === userId;

    if (!isClient && !isAstrologer) {
      throw new ForbiddenException("You do not have access to complete this consultation");
    }

    return this.completeChat(id, new Date());
  }

  /**
   * Ends a live chat and bills it — once. The length is measured by the server
   * (start → end, whole minutes, at least one); the client pays at most what is
   * in their wallet, and the astrologer is credited on what was actually paid.
   * Used when either side ends the chat, and by the hourly clean-up for chats
   * left open (billed up to the last message).
   */
  async completeChat(id: string, endAt: Date) {
    return this.prisma.$transaction(async (tx) => {
      const claimed = await tx.consultation.updateMany({ where: { id, status: "ACTIVE" }, data: { status: "COMPLETED" } });
      if (claimed.count === 0) throw new BadRequestException("This consultation has already ended.");

      const consultation = await tx.consultation.findUniqueOrThrow({
        where: { id },
        include: { astrologer: { include: { user: true } }, user: { include: { wallet: true } } },
      });
      // No astrologer ever joined: nothing to pay.
      const started = consultation.startedAt;
      const durationMin = started ? Math.max(1, Math.ceil((endAt.getTime() - started.getTime()) / 60_000)) : 0;
      const due = consultation.lockedPricingPerMin.mul(durationMin);
      const balance = consultation.user.wallet?.balance ?? new Prisma.Decimal(0);
      const cost = Prisma.Decimal.max(0, Prisma.Decimal.min(due, balance));

      if (cost.gt(0)) {
        // 1. Deduct cost from client wallet (with ledger entry & compatibility transaction)
        await this.walletService.debitWallet(
          tx,
          consultation.userId,
          cost,
          "CONSULTATION",
          `Chat with ${consultation.astrologer?.user.name || "TSP"} — ${durationMin} min`,
          consultation.id,
        );

        // 2. The astrologer's share (less commission)
        const providerUserId = consultation.astrologer?.userId;
        if (providerUserId) {
          await this.earnings.creditConsultation(tx, providerUserId, cost, consultation.id, `Chat with ${consultation.user.name || "a client"}`);
        }
      }

      // 3. Update ChatThread status if exists
      await tx.chatThread.updateMany({
        where: { consultationId: id },
        data: { status: "COMPLETED" },
      });

      // 4. Record what was billed
      return tx.consultation.update({
        where: { id },
        data: { durationMin, cost },
      });
    });
  }

  async cancel(userId: string, id: string) {
    const consultation = await this.prisma.consultation.findUnique({
      where: { id },
      include: {
        astrologer: true,
      },
    });

    if (!consultation) {
      throw new NotFoundException("Consultation not found");
    }

    if (consultation.status !== "PENDING") {
      throw new BadRequestException(
        `Consultation cannot be cancelled. Current status: ${consultation.status}`,
      );
    }

    // Check ownership
    const isClient = consultation.userId === userId;
    const isAstrologer = consultation.astrologer?.userId === userId;

    if (!isClient && !isAstrologer) {
      throw new ForbiddenException("You do not have access to cancel this consultation");
    }

    return this.prisma.consultation.update({
      where: { id },
      data: { status: "CANCELLED" },
    });
  }

  async findUserConsultations(userId: string) {
    const rows = await this.prisma.consultation.findMany({
      where: {
        OR: [
          { userId },
          { astrologer: { userId } },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            wallet: {
              select: {
                balance: true,
              },
            },
          },
        },
        astrologer: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        adminProvider: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        chatThread: true,
      },
      orderBy: { scheduledAt: "desc" },
    });
    // Each side sees only what it needs: the astrologer doesn't get the client's
    // email or wallet balance, and nobody gets the other party's email.
    return rows.map((c) => {
      const isClient = c.userId === userId;
      return {
        ...c,
        user: isClient ? c.user : { id: c.user.id, name: c.user.name },
        astrologer: c.astrologer ? { ...c.astrologer, user: { id: c.astrologer.user.id, name: c.astrologer.user.name } } : null,
        adminProvider: c.adminProvider ? { id: c.adminProvider.id, name: c.adminProvider.name } : null,
      };
    });
  }

  /**
   * The two people in a consultation: the client and the astrologer.
   * Admins are not participants — they never read or join a client's session.
   */
  async getParticipants(consultationId: string) {
    const c = await this.prisma.consultation.findUnique({
      where: { id: consultationId },
      select: { userId: true, astrologer: { select: { userId: true } } },
    });
    if (!c) return null;
    return { clientUserId: c.userId, astrologerUserId: c.astrologer?.userId ?? null };
  }

  async isParticipant(consultationId: string, userId: string) {
    const p = await this.getParticipants(consultationId);
    return !!p && (p.clientUserId === userId || p.astrologerUserId === userId);
  }

  /** Same check, starting from a chat thread id (socket events carry threadId). */
  async isThreadParticipant(threadId: string, userId: string) {
    const thread = await this.prisma.chatThread.findUnique({ where: { id: threadId }, select: { consultationId: true } });
    return !!thread && this.isParticipant(thread.consultationId, userId);
  }

  async findThread(consultationId: string) {
    return this.prisma.chatThread.findUnique({
      where: { consultationId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });
  }

  async saveMessage(threadId: string, senderId: string, content: string, type = "TEXT") {
    // The astrologer's first reply also starts the paid clock (if opening the chat didn't).
    const thread = await this.prisma.chatThread.findUnique({
      where: { id: threadId },
      select: { consultation: { select: { id: true, startedAt: true, astrologer: { select: { userId: true } } } } },
    });
    const c = thread?.consultation;
    if (c && !c.startedAt && c.astrologer?.userId === senderId) {
      await this.prisma.consultation.updateMany({ where: { id: c.id, startedAt: null }, data: { startedAt: new Date() } });
    }
    return this.prisma.chatMessage.create({
      data: {
        threadId,
        senderId,
        content,
        type,
      },
    });
  }

  async createReview(userId: string, consultationId: string, rating: number, reviewText?: string) {
    const consultation = await this.prisma.consultation.findUnique({
      where: { id: consultationId },
    });

    if (!consultation) {
      throw new NotFoundException("Consultation not found");
    }
    // Only the client, after the session, reviews it — and only their own review can change.
    if (consultation.userId !== userId) {
      throw new ForbiddenException("Only the client of this consultation can review it");
    }
    if (consultation.status !== "COMPLETED") {
      throw new BadRequestException("You can review a consultation once it has ended");
    }
    const existing = await this.prisma.consultationReview.findUnique({ where: { consultationId }, select: { userId: true } });
    if (existing && existing.userId !== userId) {
      throw new ForbiddenException("This consultation already has a review");
    }

    return this.prisma.consultationReview.upsert({
      where: { consultationId },
      update: {
        rating,
        review: reviewText,
      },
      create: {
        consultationId,
        userId,
        astrologerId: consultation.astrologerId ?? undefined,
        adminProviderId: consultation.adminProviderId ?? undefined,
        rating,
        review: reviewText,
      },
    });
  }
}
