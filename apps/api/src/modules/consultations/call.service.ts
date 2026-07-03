import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { TrtcService } from "../../integrations/trtc/trtc.service";
import { WalletService } from "../wallet/wallet.service";

/**
 * Terminal call session states — once a session enters one of these,
 * no further transitions are allowed.
 */
const TERMINAL_STATUSES = ["COMPLETED", "MISSED", "REJECTED", "FAILED", "CANCELLED"] as const;

/** Shared return type for endCall/cancelCall to break circular type inference. */
export interface CallResult {
  consultationId: string;
  status: string;
  durationSeconds?: number | null;
  durationMin?: number;
  cost?: string;
  endReason: string;
}

function isTerminal(status: string): boolean {
  return (TERMINAL_STATUSES as readonly string[]).includes(status);
}

@Injectable()
export class CallService {
  private readonly logger = new Logger("CallService");

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
        this.logger.log(`[CALL:${session.consultationId}] Superseding stale RINGING session ${session.id}`);
        await this.prisma.callSession.update({
          where: { id: session.id },
          data: { status: "CANCELLED", endReason: "SUPERSEDED" },
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
          this.logger.warn(`[CALL:${session.consultationId}] Force cleanup of stale ACTIVE session`);
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

      this.logger.log(
        `[CALL:${consultation.id}] Initiated — callSessionId=${callSession.id}, ` +
        `caller=${userId}, astrologer=${astrologer.userId}`,
      );

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
   * Transitions CallSession RINGING → ACTIVE, generates TRTC userSig for both parties.
   * Idempotent: if already ACTIVE, returns existing credentials.
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

    if (!consultation.callSession) {
      throw new BadRequestException("No call session found");
    }

    const callSession = consultation.callSession;

    // Idempotent: if already ACTIVE, regenerate credentials and return
    if (callSession.status === "ACTIVE") {
      this.logger.log(`[CALL:${consultationId}] Accept called but already ACTIVE — returning credentials`);
      return this.generateAcceptResult(consultation, callSession);
    }

    // If already in a terminal state, reject the accept
    if (isTerminal(callSession.status)) {
      this.logger.warn(
        `[CALL:${consultationId}] Accept rejected — session already in terminal state: ${callSession.status} (reason: ${callSession.endReason})`,
      );
      throw new BadRequestException(
        `Call cannot be accepted. Current status: ${callSession.status}`,
      );
    }

    if (callSession.status !== "RINGING") {
      throw new BadRequestException(
        `Call cannot be accepted. Current status: ${callSession.status}`,
      );
    }

    // Use conditional update to prevent race with timeout job
    const now = new Date();
    const updateResult = await this.prisma.callSession.updateMany({
      where: {
        id: callSession.id,
        status: "RINGING", // Only transition if still RINGING
      },
      data: { status: "ACTIVE", startedAt: now },
    });

    if (updateResult.count === 0) {
      // Another event (timeout) already transitioned this session
      const refreshed = await this.prisma.callSession.findUnique({ where: { id: callSession.id } });
      this.logger.warn(
        `[CALL:${consultationId}] Accept lost race — current status: ${refreshed?.status}`,
      );
      throw new BadRequestException(
        `Call cannot be accepted. Current status: ${refreshed?.status ?? "UNKNOWN"}`,
      );
    }

    await this.prisma.consultation.update({
      where: { id: consultationId },
      data: { status: "ACTIVE" },
    });

    this.logger.log(`[CALL:${consultationId}] Accepted — RINGING → ACTIVE by ${astrologerUserId}`);

    return this.generateAcceptResult(consultation, callSession);
  }

  /**
   * Generate the TRTC credentials response for an accepted call.
   */
  private generateAcceptResult(
    consultation: any,
    callSession: any,
  ) {
    const rate = Number(consultation.lockedPricingPerMin);
    const balance = Number(consultation.user.wallet?.balance ?? 0);
    const maxDurationSeconds = Math.max(60, Math.floor((balance / rate) * 60));

    const tokenExpireSeconds = Math.min(maxDurationSeconds + 300, 7200);
    const userSig = this.trtcService.generateUserSig(
      callSession.trtcUserIdCaller,
      tokenExpireSeconds,
    );
    const astrologerSig = this.trtcService.generateUserSig(
      callSession.trtcUserIdAstro,
      tokenExpireSeconds,
    );

    return {
      consultationId: consultation.id,
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
   * Idempotent: if already in a terminal state, no-op.
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

    if (!consultation.callSession) {
      throw new BadRequestException("No call session found");
    }

    // Idempotent: already terminal → no-op
    if (isTerminal(consultation.callSession.status)) {
      this.logger.log(
        `[CALL:${consultationId}] Reject no-op — already ${consultation.callSession.status}`,
      );
      return { consultationId, status: consultation.callSession.status };
    }

    if (consultation.callSession.status !== "RINGING") {
      throw new BadRequestException("Call is not in ringing state");
    }

    // Conditional update to prevent race
    const updateResult = await this.prisma.callSession.updateMany({
      where: { id: consultation.callSession.id, status: "RINGING" },
      data: { status: "REJECTED", endReason: "ASTROLOGER_REJECTED" },
    });

    if (updateResult.count > 0) {
      await this.prisma.consultation.update({
        where: { id: consultationId },
        data: { status: "CANCELLED" },
      });
      this.logger.log(`[CALL:${consultationId}] Rejected by ${astrologerUserId}`);
    }

    return { consultationId, status: "REJECTED" };
  }

  /**
   * Caller cancels a ringing call before the callee accepts.
   * Transitions RINGING → CANCELLED.
   * Idempotent: if already terminal, returns current state.
   */
  async cancelCall(userId: string, consultationId: string): Promise<CallResult> {
    const consultation = await this.prisma.consultation.findUnique({
      where: { id: consultationId },
      include: { callSession: true },
    });

    if (!consultation) {
      throw new NotFoundException("Consultation not found");
    }

    if (consultation.userId !== userId) {
      throw new ForbiddenException("You are not the caller for this consultation");
    }

    if (!consultation.callSession) {
      throw new BadRequestException("No call session found");
    }

    // Idempotent: already terminal → return current state
    if (isTerminal(consultation.callSession.status)) {
      this.logger.log(
        `[CALL:${consultationId}] Cancel no-op — already ${consultation.callSession.status} (reason: ${consultation.callSession.endReason})`,
      );
      return {
        consultationId,
        status: consultation.callSession.status,
        endReason: consultation.callSession.endReason || "ALREADY_ENDED",
      };
    }

    if (consultation.callSession.status !== "RINGING") {
      // If somehow ACTIVE, delegate to endCall
      if (consultation.callSession.status === "ACTIVE") {
        this.logger.log(
          `[CALL:${consultationId}] Cancel called but ACTIVE — delegating to endCall`,
        );
        return this.endCall(userId, consultationId, "CALLER_CANCELLED");
      }
      throw new BadRequestException(
        `Call cannot be cancelled. Current status: ${consultation.callSession.status}`,
      );
    }

    // Conditional update to prevent race with accept/timeout
    const updateResult = await this.prisma.callSession.updateMany({
      where: { id: consultation.callSession.id, status: "RINGING" },
      data: { status: "CANCELLED", endReason: "CALLER_CANCELLED" },
    });

    if (updateResult.count > 0) {
      await this.prisma.consultation.update({
        where: { id: consultationId },
        data: { status: "CANCELLED" },
      });
      this.logger.log(`[CALL:${consultationId}] Cancelled by caller ${userId} — RINGING → CANCELLED`);
    } else {
      // Lost race — re-read to find what happened
      const refreshed = await this.prisma.callSession.findUnique({
        where: { id: consultation.callSession.id },
      });
      this.logger.warn(
        `[CALL:${consultationId}] Cancel lost race — current status: ${refreshed?.status}`,
      );
    }

    return { consultationId, status: "CANCELLED", endReason: "CALLER_CANCELLED" };
  }

  /**
   * End an active call. Calculates duration, handles billing, marks as COMPLETED.
   * If called on a RINGING session, delegates to cancelCall.
   * Idempotent: if already terminal, returns current state.
   */
  async endCall(userId: string, consultationId: string, endReason = "USER_ENDED"): Promise<CallResult> {
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

    // Idempotent: if already in a terminal state, return current state (no-op)
    if (isTerminal(consultation.callSession.status)) {
      this.logger.log(
        `[CALL:${consultationId}] endCall no-op — already ${consultation.callSession.status} (reason: ${consultation.callSession.endReason})`,
      );
      return {
        consultationId,
        status: consultation.callSession.status,
        durationSeconds: consultation.callSession.durationSeconds,
        endReason: consultation.callSession.endReason || "ALREADY_ENDED",
      };
    }

    // If RINGING, delegate to cancelCall (caller can't "end" a call that hasn't started)
    if (consultation.callSession.status === "RINGING") {
      this.logger.log(
        `[CALL:${consultationId}] endCall on RINGING — delegating to cancelCall`,
      );
      return this.cancelCall(userId, consultationId);
    }

    if (consultation.callSession.status !== "ACTIVE") {
      this.logger.warn(
        `[CALL:${consultationId}] endCall rejected — unexpected status: ${consultation.callSession.status}`,
      );
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

    // Conditional update to prevent double-billing race condition
    const updateResult = await this.prisma.callSession.updateMany({
      where: {
        id: consultation.callSession.id,
        status: "ACTIVE", // Only end if still ACTIVE
      },
      data: {
        status: "COMPLETED",
        endedAt: now,
        durationSeconds,
        endReason: resolvedEndReason,
      },
    });

    if (updateResult.count === 0) {
      // Another event already ended this call — return safely
      const refreshed = await this.prisma.callSession.findUnique({
        where: { id: consultation.callSession.id },
      });
      this.logger.warn(
        `[CALL:${consultationId}] endCall lost race — current status: ${refreshed?.status}`,
      );
      return {
        consultationId,
        status: refreshed?.status ?? "UNKNOWN",
        durationSeconds: refreshed?.durationSeconds,
        endReason: refreshed?.endReason || "ALREADY_ENDED",
      };
    }

    // Billing + consultation update inside transaction
    return this.prisma.$transaction(async (tx) => {
      // 1. Debit user wallet (allow negative to avoid rolling back the call completion)
      await this.walletService.debitWallet(
        tx,
        consultation.userId,
        cost,
        "CONSULTATION",
        `Call consultation fee with astrologer ${consultation.astrologer.user.name}`,
        consultation.id,
        true // allowNegative
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

      // 3. Update consultation
      await tx.consultation.update({
        where: { id: consultationId },
        data: {
          status: "COMPLETED",
          durationMin,
          cost,
        },
      });

      this.logger.log(
        `[CALL:${consultationId}] Ended — ACTIVE → COMPLETED, duration=${durationSeconds}s, ` +
        `cost=${cost.toString()}, reason=${resolvedEndReason}`,
      );

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
   * Uses conditional update to prevent race with accept/cancel.
   */
  async markMissed(consultationId: string) {
    const callSession = await this.prisma.callSession.findUnique({
      where: { consultationId },
    });

    if (!callSession) {
      this.logger.warn(`[CALL:${consultationId}] markMissed — no call session found`);
      return;
    }

    if (callSession.status !== "RINGING") {
      this.logger.log(
        `[CALL:${consultationId}] markMissed no-op — already ${callSession.status}`,
      );
      return; // Already transitioned (accepted, cancelled, etc.)
    }

    // Conditional update: only mark missed if still RINGING
    const updateResult = await this.prisma.callSession.updateMany({
      where: { id: callSession.id, status: "RINGING" },
      data: { status: "MISSED", endReason: "TIMEOUT_NO_ANSWER" },
    });

    if (updateResult.count > 0) {
      await this.prisma.consultation.update({
        where: { id: consultationId },
        data: { status: "CANCELLED" },
      });
      this.logger.log(`[CALL:${consultationId}] Marked as MISSED — RINGING → MISSED (timeout)`);
    } else {
      this.logger.log(`[CALL:${consultationId}] markMissed lost race — session already transitioned`);
    }
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
