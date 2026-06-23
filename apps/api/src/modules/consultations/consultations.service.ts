import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { CreateConsultationDto, CompleteConsultationDto } from "./dto/consultation.dto";
import { WalletService } from "../wallet/wallet.service";
import { Prisma } from "@prisma/client";

@Injectable()
export class ConsultationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
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
      include: { user: true },
    });

    if (!astrologer || astrologer.status !== "APPROVED") {
      throw new BadRequestException("Astrologer is not approved or active");
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

    return this.prisma.consultation.create({
      data: {
        userId,
        astrologerId: dto.astrologerId,
        lockedPricingPerMin: astrologer.pricingPerMin,
        scheduledAt: scheduledDate,
        status: "PENDING",
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
    const isAstrologer = consultation.astrologer.userId === userId;

    if (!isClient && !isAstrologer) {
      throw new ForbiddenException("You do not have access to start this consultation");
    }

    return this.prisma.$transaction(async (tx) => {
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
    const isAstrologer = consultation.astrologer.userId === userId;

    if (!isClient && !isAstrologer) {
      throw new ForbiddenException("You do not have access to complete this consultation");
    }

    const cost = consultation.lockedPricingPerMin.mul(dto.durationMin);

    return this.prisma.$transaction(async (tx) => {
      // 1. Deduct cost from client wallet (with ledger entry & compatibility transaction)
      await this.walletService.debitWallet(
        tx,
        consultation.userId,
        cost,
        "CONSULTATION",
        `Consultation fee with astrologer ${consultation.astrologer.user.name}`,
        consultation.id,
      );

      // 2. Add/Credit cost to astrologer wallet (with ledger entry & compatibility transaction)
      await this.walletService.creditWallet(
        tx,
        consultation.astrologer.userId,
        cost,
        "CONSULTATION",
        `Consultation session payout from user ${consultation.user.name}`,
        consultation.id,
      );

      // 3. Update ChatThread status if exists
      await tx.chatThread.updateMany({
        where: { consultationId: id },
        data: { status: "COMPLETED" },
      });

      // 4. Update consultation status
      return tx.consultation.update({
        where: { id },
        data: {
          status: "COMPLETED",
          durationMin: dto.durationMin,
          cost,
        },
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
    const isAstrologer = consultation.astrologer.userId === userId;

    if (!isClient && !isAstrologer) {
      throw new ForbiddenException("You do not have access to cancel this consultation");
    }

    return this.prisma.consultation.update({
      where: { id },
      data: { status: "CANCELLED" },
    });
  }

  async findUserConsultations(userId: string) {
    return this.prisma.consultation.findMany({
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
        chatThread: true,
      },
      orderBy: { scheduledAt: "desc" },
    });
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

    return this.prisma.consultationReview.create({
      data: {
        consultationId,
        userId,
        astrologerId: consultation.astrologerId,
        rating,
        review: reviewText,
      },
    });
  }
}
