import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { TrtcService } from "../../integrations/trtc/trtc.service";
import { WalletService } from "../wallet/wallet.service";

@Injectable()
export class CallService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly trtcService: TrtcService,
    private readonly walletService: WalletService,
  ) {}

  /**
   * Initiate a call — creates a CALL consultation + CallSession in RINGING state.
   * Returns everything needed to start signaling.
   */
  async initiateCall(userId: string, astrologerId: string) {
    // 1. Validate wallet balance
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      throw new NotFoundException("User wallet not found");
    }

    // 2. Validate astrologer
    const astrologer = await this.prisma.astrologer.findUnique({
      where: { id: astrologerId },
      include: { user: true },
    });

    if (!astrologer || astrologer.status !== "APPROVED") {
      throw new BadRequestException("Astrologer is not approved or active");
    }

    if (astrologer.userId === userId) {
      throw new BadRequestException("You cannot call yourself");
    }

    // 3. Check minimum balance (at least 5 mins worth)
    const minRequiredBalance = astrologer.pricingPerMin.mul(5);
    if (wallet.balance.lt(minRequiredBalance)) {
      throw new BadRequestException(
        `Insufficient wallet balance. You need at least ₹${minRequiredBalance.toString()} (5 mins) to start a call.`,
      );
    }

    // 4. Clean up any stale ringing/active calls for this user
    const existingUserCalls = await this.prisma.callSession.findMany({
      where: {
        status: { in: ["RINGING", "ACTIVE"] },
        consultation: { userId },
      },
    });

    for (const session of existingUserCalls) {
      if (session.status === "RINGING") {
        await this.prisma.callSession.update({
          where: { id: session.id },
          data: { status: "MISSED", endReason: "SUPERSEDED" },
        });
        await this.prisma.consultation.update({
          where: { id: session.consultationId },
          data: { status: "CANCELLED" },
        });
      } else if (session.status === "ACTIVE") {
        try {
          await this.endCall(userId, session.consultationId, "SUPERSEDED");
        } catch (e) {
          // Fallback force cleanup if standard endCall fails
          await this.prisma.callSession.update({
            where: { id: session.id },
            data: { status: "FAILED", endReason: "SUPERSEDED_FORCE" },
          });
          await this.prisma.consultation.update({
            where: { id: session.consultationId },
            data: { status: "CANCELLED" },
          });
        }
      }
    }

    // 5. Check if astrologer is on another call
    const existingAstrologerCall = await this.prisma.callSession.findFirst({
      where: {
        status: { in: ["RINGING", "ACTIVE"] },
        consultation: { astrologerId },
      },
    });
    if (existingAstrologerCall) {
      throw new BadRequestException("ASTROLOGER_BUSY");
    }

    // 6. Create consultation + call session in a transaction
    return this.prisma.$transaction(async (tx) => {
      const consultation = await tx.consultation.create({
        data: {
          userId,
          astrologerId,
          type: "CALL",
          lockedPricingPerMin: astrologer.pricingPerMin,
          scheduledAt: new Date(),
          status: "PENDING",
        },
      });

      const channelName = `tsp_call_${consultation.id.replace(/-/g, "").substring(0, 16)}`;

      // TRTC uses string user IDs — we use prefixed UUIDs for uniqueness
      const trtcUserIdCaller = `u_${userId.replace(/-/g, "").substring(0, 16)}`;
      const trtcUserIdAstro = `a_${astrologer.userId.replace(/-/g, "").substring(0, 16)}`;

      const callSession = await tx.callSession.create({
        data: {
          consultationId: consultation.id,
          channelName,
          trtcUserIdCaller,
          trtcUserIdAstro,
          status: "RINGING",
        },
      });

      return {
        consultationId: consultation.id,
        callSessionId: callSession.id,
        channelName: callSession.channelName,
        astrologerUserId: astrologer.userId,
        astrologerName: astrologer.user.name || "Astrologer",
        lockedPricingPerMin: astrologer.pricingPerMin,
        callerName: "", // Will be populated by the gateway from the user record
      };
    });
  }

  /**
   * Astrologer accepts the incoming call.
   * Transitions CallSession to ACTIVE, generates TRTC userSig for both parties.
   */
  async acceptCall(astrologerUserId: string, consultationId: string) {
    const consultation = await this.prisma.consultation.findUnique({
      where: { id: consultationId },
      include: {
        callSession: true,
        astrologer: true,
        user: { select: { id: true, name: true, wallet: { select: { balance: true } } } },
      },
    });

    if (!consultation) {
      throw new NotFoundException("Consultation not found");
    }

    if (consultation.astrologer.userId !== astrologerUserId) {
      throw new ForbiddenException("You are not the astrologer for this consultation");
    }

    if (!consultation.callSession || consultation.callSession.status !== "RINGING") {
      throw new BadRequestException(
        `Call cannot be accepted. Current status: ${consultation.callSession?.status ?? "NO_SESSION"}`,
      );
    }

    const callSession = consultation.callSession;

    // Calculate max duration from user's wallet balance
    const rate = Number(consultation.lockedPricingPerMin);
    const balance = Number(consultation.user.wallet?.balance ?? 0);
    const maxDurationSeconds = Math.max(60, Math.floor((balance / rate) * 60));

    // Generate TRTC userSig for both participants
    const tokenExpireSeconds = Math.min(maxDurationSeconds + 300, 7200);
    const userSig = this.trtcService.generateUserSig(
      callSession.trtcUserIdCaller,
      tokenExpireSeconds,
    );
    const astrologerSig = this.trtcService.generateUserSig(
      callSession.trtcUserIdAstro,
      tokenExpireSeconds,
    );

    // Transition to ACTIVE
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.callSession.update({
        where: { id: callSession.id },
        data: { status: "ACTIVE", startedAt: now },
      }),
      this.prisma.consultation.update({
        where: { id: consultationId },
        data: { status: "ACTIVE" },
      }),
    ]);

    return {
      consultationId,
      channelName: callSession.channelName,
      sdkAppId: this.trtcService.getSdkAppId(),
      maxDurationSeconds,
      user: {
        userId: consultation.userId,
        userSig,
        trtcUserId: callSession.trtcUserIdCaller,
      },
      astrologer: {
        userId: consultation.astrologer.userId,
        userSig: astrologerSig,
        trtcUserId: callSession.trtcUserIdAstro,
      },
    };
  }

  /**
   * Astrologer rejects the call.
   */
  async rejectCall(astrologerUserId: string, consultationId: string) {
    const consultation = await this.prisma.consultation.findUnique({
      where: { id: consultationId },
      include: { callSession: true, astrologer: true },
    });

    if (!consultation) {
      throw new NotFoundException("Consultation not found");
    }

    if (consultation.astrologer.userId !== astrologerUserId) {
      throw new ForbiddenException("You are not the astrologer for this consultation");
    }

    if (!consultation.callSession || consultation.callSession.status !== "RINGING") {
      throw new BadRequestException("Call is not in ringing state");
    }

    await this.prisma.$transaction([
      this.prisma.callSession.update({
        where: { id: consultation.callSession.id },
        data: { status: "REJECTED", endReason: "ASTROLOGER_REJECTED" },
      }),
      this.prisma.consultation.update({
        where: { id: consultationId },
        data: { status: "CANCELLED" },
      }),
    ]);

    return { consultationId, status: "REJECTED" };
  }

  /**
   * End an active call. Calculates duration, handles billing, marks as COMPLETED.
   */
  async endCall(userId: string, consultationId: string, endReason = "USER_ENDED") {
    const consultation = await this.prisma.consultation.findUnique({
      where: { id: consultationId },
      include: {
        callSession: true,
        astrologer: { include: { user: true } },
        user: { include: { wallet: true } },
      },
    });

    if (!consultation) {
      throw new NotFoundException("Consultation not found");
    }

    const isClient = consultation.userId === userId;
    const isAstrologer = consultation.astrologer.userId === userId;
    if (!isClient && !isAstrologer) {
      throw new ForbiddenException("You are not a participant in this call");
    }

    if (!consultation.callSession) {
      throw new BadRequestException("No call session found");
    }

    // If already completed, return current state (handles double-end race condition)
    if (consultation.callSession.status === "COMPLETED") {
      return {
        consultationId,
        status: "COMPLETED",
        durationSeconds: consultation.callSession.durationSeconds,
      };
    }

    if (consultation.callSession.status !== "ACTIVE") {
      throw new BadRequestException(
        `Call cannot be ended. Current status: ${consultation.callSession.status}`,
      );
    }

    // Calculate duration
    const startedAt = consultation.callSession.startedAt!;
    const now = new Date();
    const durationSeconds = Math.max(1, Math.floor((now.getTime() - startedAt.getTime()) / 1000));
    const durationMin = Math.max(1, Math.ceil(durationSeconds / 60));
    const cost = consultation.lockedPricingPerMin.mul(durationMin);

    const resolvedEndReason = isAstrologer ? "ASTROLOGER_ENDED" : endReason;

    return this.prisma.$transaction(async (tx) => {
      // 1. Debit user wallet
      await this.walletService.debitWallet(
        tx,
        consultation.userId,
        cost,
        "CONSULTATION",
        `Call consultation fee with astrologer ${consultation.astrologer.user.name}`,
        consultation.id,
      );

      // 2. Credit astrologer wallet
      await this.walletService.creditWallet(
        tx,
        consultation.astrologer.userId,
        cost,
        "CONSULTATION",
        `Call consultation payout from user ${consultation.user.name}`,
        consultation.id,
      );

      // 3. Update call session
      await tx.callSession.update({
        where: { id: consultation.callSession!.id },
        data: {
          status: "COMPLETED",
          endedAt: now,
          durationSeconds,
          endReason: resolvedEndReason,
        },
      });

      // 4. Update consultation
      await tx.consultation.update({
        where: { id: consultationId },
        data: {
          status: "COMPLETED",
          durationMin,
          cost,
        },
      });

      return {
        consultationId,
        status: "COMPLETED",
        durationSeconds,
        durationMin,
        cost: cost.toString(),
        endReason: resolvedEndReason,
      };
    });
  }

  /**
   * Mark a ringing call as missed (30s timeout).
   */
  async markMissed(consultationId: string) {
    const callSession = await this.prisma.callSession.findUnique({
      where: { consultationId },
    });

    if (!callSession || callSession.status !== "RINGING") {
      return; // Already transitioned
    }

    await this.prisma.$transaction([
      this.prisma.callSession.update({
        where: { id: callSession.id },
        data: { status: "MISSED", endReason: "TIMEOUT" },
      }),
      this.prisma.consultation.update({
        where: { id: consultationId },
        data: { status: "CANCELLED" },
      }),
    ]);
  }

  /**
   * Refresh TRTC userSig for reconnection.
   */
  async refreshToken(userId: string, consultationId: string) {
    const consultation = await this.prisma.consultation.findUnique({
      where: { id: consultationId },
      include: { callSession: true, astrologer: true },
    });

    if (!consultation || !consultation.callSession) {
      throw new NotFoundException("Call session not found");
    }

    if (consultation.callSession.status !== "ACTIVE") {
      throw new BadRequestException("Call is not active");
    }

    const isClient = consultation.userId === userId;
    const isAstrologer = consultation.astrologer.userId === userId;
    if (!isClient && !isAstrologer) {
      throw new ForbiddenException("You are not a participant in this call");
    }

    const trtcUserId = isClient
      ? consultation.callSession.trtcUserIdCaller
      : consultation.callSession.trtcUserIdAstro;

    const userSig = this.trtcService.generateUserSig(trtcUserId, 3600);

    return {
      userSig,
      channelName: consultation.callSession.channelName,
      trtcUserId,
      sdkAppId: this.trtcService.getSdkAppId(),
    };
  }

  /**
   * Get the current call session for a consultation.
   */
  async getCallSession(userId: string, consultationId: string) {
    const consultation = await this.prisma.consultation.findUnique({
      where: { id: consultationId },
      include: {
        callSession: true,
        astrologer: { include: { user: { select: { id: true, name: true } } } },
        user: { select: { id: true, name: true } },
      },
    });

    if (!consultation) {
      throw new NotFoundException("Consultation not found");
    }

    const isClient = consultation.userId === userId;
    const isAstrologer = consultation.astrologer.userId === userId;
    if (!isClient && !isAstrologer) {
      throw new ForbiddenException("You are not a participant in this consultation");
    }

    return {
      consultation: {
        id: consultation.id,
        status: consultation.status,
        lockedPricingPerMin: consultation.lockedPricingPerMin,
        user: consultation.user,
        astrologer: {
          id: consultation.astrologerId,
          name: consultation.astrologer.user.name,
          userId: consultation.astrologer.userId,
        },
      },
      callSession: consultation.callSession,
    };
  }

  /**
   * Get call history for a user (both as caller and astrologer).
   */
  async getCallHistory(userId: string) {
    return this.prisma.consultation.findMany({
      where: {
        type: "CALL",
        OR: [{ userId }, { astrologer: { userId } }],
      },
      include: {
        callSession: true,
        user: { select: { id: true, name: true } },
        astrologer: {
          include: { user: { select: { id: true, name: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  /**
   * Check if an astrologer currently has an active/ringing call.
   */
  async isAstrologerOnCall(astrologerId: string): Promise<boolean> {
    const activeCall = await this.prisma.callSession.findFirst({
      where: {
        status: { in: ["RINGING", "ACTIVE"] },
        consultation: { astrologerId },
      },
    });
    return !!activeCall;
  }

  /**
   * Find any active or ringing call session involving the given user.
   */
  async findActiveSessionForUser(userId: string) {
    return this.prisma.callSession.findFirst({
      where: {
        status: { in: ["RINGING", "ACTIVE"] },
        OR: [
          { consultation: { userId } },
          { consultation: { astrologer: { userId } } },
        ],
      },
    });
  }
}
