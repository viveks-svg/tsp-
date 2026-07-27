import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { CampaignService } from "../campaign/campaign.service";
import { GoogleCalendarService } from "../../integrations/google-calendar/google-calendar.service";
import { Prisma } from "@prisma/client";
import { TrtcService } from "../../integrations/trtc/trtc.service";
import { WalletService } from "../wallet/wallet.service";
import { Cron, CronExpression } from "@nestjs/schedule";
import { Inject, forwardRef } from "@nestjs/common";
import { QueueGateway } from "./queue.gateway";

/** Minimum wallet balance required to join the queue (₹100 = ~5 min at ₹19/min) */
const MIN_WALLET_BALANCE = 100;

/** Assumed average call duration in minutes for wait time estimates */
const AVG_CALL_DURATION_MIN = 15;

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly campaignService: CampaignService,
    private readonly googleCalendarService: GoogleCalendarService,
    private readonly trtcService: TrtcService,
    private readonly walletService: WalletService,
    @Inject(forwardRef(() => QueueGateway))
    private readonly queueGateway: QueueGateway,
  ) {}

  /**
   * User joins the queue for a campaign.
   * Validates: campaign active + within window, no existing active entry,
   * wallet balance >= ₹100.
   */
  async join(userId: string, campaignId: string) {
    // 1. Validate campaign exists and is active
    const campaign = await this.campaignService.findById(campaignId);
    if (!campaign.isActive) {
      throw new BadRequestException("This campaign is not currently active.");
    }

    // 2. Server-side window check (never trust client clock)
    const isWithinWindow = this.campaignService.isWithinWindow(campaign);
    console.log("[QUEUE JOIN] Window Check:", {
      campaignId: campaign.id,
      dayOfWeek: campaign.dayOfWeek,
      startTime: campaign.startTime,
      endTime: campaign.endTime,
      isWithinWindow,
    });
    
    if (!isWithinWindow) {
      throw new BadRequestException(
        "The consultation window is not currently open. Please try again during the scheduled time.",
      );
    }

    // 3. Check wallet balance >= ₹100
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      throw new BadRequestException(
        "You need a wallet to join the queue. Please set up your wallet first.",
      );
    }
    if (wallet.balance.lt(new Prisma.Decimal(MIN_WALLET_BALANCE))) {
      throw new BadRequestException(
        `Insufficient wallet balance. You need at least ₹${MIN_WALLET_BALANCE} (approximately 5 minutes at the campaign rate) to join the queue. Please top up your wallet.`,
      );
    }

    // 4. Check no existing WAITING/CALLING/IN_CALL entry for this campaign
    const existingEntry = await this.prisma.queueEntry.findFirst({
      where: {
        userId,
        campaignId,
        status: { in: ["WAITING", "CALLING", "IN_CALL"] },
      },
    });
    if (existingEntry) {
      throw new BadRequestException(
        "You already have an active queue entry for this campaign.",
      );
    }

    // 5. Assign position (max + 1)
    const maxPosition = await this.prisma.queueEntry.aggregate({
      where: {
        campaignId,
        status: { in: ["WAITING", "CALLING", "IN_CALL"] },
      },
      _max: { position: true },
    });
    const nextPosition = (maxPosition._max.position ?? 0) + 1;

    // 6. Create queue entry
    const entry = await this.prisma.queueEntry.create({
      data: {
        campaignId,
        userId,
        status: "WAITING",
        position: nextPosition,
      },
      include: {
        campaign: true,
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    this.logger.log(
      `[QUEUE] User ${userId} joined queue for campaign ${campaignId} at position ${nextPosition}`,
    );

    this.queueGateway.broadcastQueueJoined(campaignId, entry);
    this.queueGateway.broadcastPositionUpdate(campaignId);

    return {
      ...entry,
      estimatedWaitMin: (nextPosition - 1) * AVG_CALL_DURATION_MIN,
    };
  }

  /**
   * User voluntarily leaves the queue.
   */
  async leave(userId: string, campaignId: string) {
    const entry = await this.prisma.queueEntry.findFirst({
      where: {
        userId,
        campaignId,
        status: { in: ["WAITING", "CALLING"] },
      },
    });

    if (!entry) {
      throw new NotFoundException("No active queue entry found.");
    }

    // Mark as ABANDONED
    await this.prisma.queueEntry.update({
      where: { id: entry.id },
      data: { status: "ABANDONED" },
    });

    // Reorder remaining positions
    await this.reorderPositions(campaignId);

    this.logger.log(
      `[QUEUE] User ${userId} left queue for campaign ${campaignId}`,
    );

    this.queueGateway.broadcastPositionUpdate(campaignId);

    return { success: true, message: "You have left the queue." };
  }

  /**
   * Get the full queue state for admin monitoring.
   */
  async getQueueState(campaignId: string) {
    const entries = await this.prisma.queueEntry.findMany({
      where: {
        campaignId,
        status: { in: ["WAITING", "CALLING", "IN_CALL"] },
      },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
      orderBy: { position: "asc" },
    });

    const currentCall = entries.find((e: any) => e.status === "IN_CALL");
    const calling = entries.find((e: any) => e.status === "CALLING");
    const waiting = entries.filter((e: any) => e.status === "WAITING");

    return {
      entries,
      waitingCount: waiting.length,
      currentCall: currentCall || null,
      calling: calling || null,
    };
  }

  /**
   * Get all active queue entries across campaigns (for admin overview).
   */
  async getAdminQueueOverview() {
    const campaigns = await this.prisma.campaign.findMany({
      where: { isActive: true },
    });

    const results = [];
    for (const campaign of campaigns) {
      const state = await this.getQueueState(campaign.id);
      results.push({ campaign, ...state });
    }

    return results;
  }

  /**
   * Get a specific user's position in the queue.
   */
  async getUserPosition(userId: string, campaignId: string) {
    const entry = await this.prisma.queueEntry.findFirst({
      where: {
        userId,
        campaignId,
        status: { in: ["WAITING", "CALLING", "IN_CALL"] },
      },
    });

    if (!entry) {
      return null;
    }

    let trtc = undefined;
    if (entry.status === "IN_CALL" && entry.consultationId) {
      const consultation = await this.prisma.consultation.findUnique({
        where: { id: entry.consultationId },
        include: { callSession: true },
      });
      
      if (consultation?.callSession) {
        const callSession = consultation.callSession;
        const userSig = this.trtcService.generateUserSig(callSession.trtcUserIdCaller, 7200);
        trtc = {
          consultationId: entry.consultationId,
          channelName: callSession.channelName,
          sdkAppId: this.trtcService.getSdkAppId(),
          user: {
            userId,
            userSig,
            trtcUserId: callSession.trtcUserIdCaller,
          }
        };
      }
    }

    return {
      ...entry,
      estimatedWaitMin: entry.status === "WAITING"
        ? (entry.position - 1) * AVG_CALL_DURATION_MIN
        : 0,
      trtc,
    };
  }

  /**
   * Dequeue the next WAITING user.
   * Called when Dr. Pradeep finishes a call or manually triggers next.
   *
   * Flow:
   * 1. Verify no existing IN_CALL consultation for admin
   * 2. Pop oldest WAITING entry → CALLING
   * 3. Re-check wallet balance (user may have spent money since joining)
   * 4. Create Consultation with campaign rate
   * 5. Update QueueEntry with consultationId, status → IN_CALL
   */
  async dequeueNext(campaignId: string): Promise<any> {
    const campaign = await this.campaignService.findById(campaignId);

    // Get admin user (Dr. Pradeep)
    const admin = await this.prisma.user.findFirst({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    if (!admin) {
      this.logger.error("[QUEUE] No ADMIN user found for dequeue");
      return null;
    }

    // Check existing IN_CALL consultation for admin
    const existingInCall = await this.prisma.queueEntry.findFirst({
      where: {
        campaignId,
        status: "IN_CALL",
      },
    });

    if (existingInCall && existingInCall.consultationId) {
      this.logger.log(`[QUEUE] Ending existing IN_CALL consultation ${existingInCall.consultationId}`);
      
      const consultation = await this.prisma.consultation.findUnique({
        where: { id: existingInCall.consultationId },
        include: { callSession: true },
      });

      const durationSeconds = Math.max(1, Math.floor((Date.now() - existingInCall.calledAt!.getTime()) / 1000));
      const durationMin = Math.max(1, Math.ceil(durationSeconds / 60));
      const cost = consultation ? consultation.lockedPricingPerMin.mul(durationMin) : new Prisma.Decimal(0);

      await this.prisma.$transaction(async (tx) => {
        if (consultation) {
          // Debit user
          await this.walletService.debitWallet(
            tx, existingInCall.userId, cost, "CONSULTATION", "Queue Consultation Fee", existingInCall.consultationId!, true
          );
          // Credit admin
          await this.walletService.creditWallet(
            tx, admin.id, cost, "CONSULTATION", "Queue Consultation Payout", existingInCall.consultationId!
          );
          // Update consultation
          await tx.consultation.update({
            where: { id: existingInCall.consultationId! },
            data: { status: "COMPLETED", durationMin, cost },
          });
          // If TRTC callSession exists, complete it too
          if (consultation.callSession) {
            await tx.callSession.updateMany({
              where: { id: consultation.callSession.id },
              data: { status: "COMPLETED", durationSeconds, endReason: "ADMIN_ENDED_QUEUE", endedAt: new Date() }
            });
          }
        }
        // Update queue entry
        await tx.queueEntry.update({
          where: { id: existingInCall.id },
          data: { status: "COMPLETED" },
        });
      });
    }

    // Pop oldest WAITING entry
    const nextEntry = await this.prisma.queueEntry.findFirst({
      where: {
        campaignId,
        status: "WAITING",
      },
      orderBy: { position: "asc" },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    if (!nextEntry) {
      this.logger.log("[QUEUE] No WAITING entries to dequeue.");
      return { success: true, message: "Call ended, no more users in queue." };
    }

    // Re-check wallet balance before promoting
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId: nextEntry.userId },
    });

    if (!wallet || wallet.balance.lt(new Prisma.Decimal(MIN_WALLET_BALANCE))) {
      // Insufficient balance — skip this user and try next
      this.logger.warn(
        `[QUEUE] User ${nextEntry.userId} has insufficient balance (₹${wallet?.balance ?? 0}). Skipping.`,
      );

      await this.prisma.queueEntry.update({
        where: { id: nextEntry.id },
        data: { status: "ABANDONED" },
      });

      await this.reorderPositions(campaignId);

      // Recursively try the next user
      return this.dequeueNext(campaignId);
    }

    // Create consultation with campaign rate
    const consultation = await this.prisma.consultation.create({
      data: {
        userId: nextEntry.userId,
        adminProviderId: admin.id,
        campaignId: campaign.id,
        lockedPricingPerMin: campaign.ratePerMinute,
        status: "ACTIVE",
        type: "CALL",
        scheduledAt: new Date(),
      },
    });

    const channelName = `tsp_q_${consultation.id.replace(/-/g, "").substring(0, 16)}`;
    const trtcUserIdCaller = `u_${nextEntry.userId.replace(/-/g, "").substring(0, 16)}`;
    const trtcUserIdAstro = `a_${admin.id.replace(/-/g, "").substring(0, 16)}`;

    const callSession = await this.prisma.callSession.create({
      data: {
        consultationId: consultation.id,
        channelName,
        trtcUserIdCaller,
        trtcUserIdAstro,
        status: "ACTIVE",
        startedAt: new Date(),
      },
    });

    // Update queue entry
    const updatedEntry = await this.prisma.queueEntry.update({
      where: { id: nextEntry.id },
      data: {
        status: "IN_CALL",
        calledAt: new Date(),
        consultationId: consultation.id,
      },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        campaign: true,
      },
    });

    // Reorder remaining positions
    await this.reorderPositions(campaignId);

    const tokenExpireSeconds = 7200;
    const astrologerSig = this.trtcService.generateUserSig(trtcUserIdAstro, tokenExpireSeconds);
    const callerSig = this.trtcService.generateUserSig(trtcUserIdCaller, tokenExpireSeconds);

    const trtcPayload = {
      consultationId: consultation.id,
      channelName,
      sdkAppId: this.trtcService.getSdkAppId(),
      user: {
        userId: nextEntry.userId,
        userSig: callerSig,
        trtcUserId: trtcUserIdCaller,
      }
    };

    this.logger.log(
      `[QUEUE] Dequeued user ${nextEntry.userId} → consultation ${consultation.id}`,
    );

    this.queueGateway.emitPromotedToInCall(campaignId, updatedEntry.userId, consultation.id, trtcPayload);
    this.queueGateway.emitCallingToUser(campaignId, updatedEntry.userId, consultation.id, trtcPayload);
    this.queueGateway.broadcastPositionUpdate(campaignId);

    return { 
      entry: updatedEntry, 
      consultation, 
      trtc: {
        consultationId: consultation.id,
        channelName,
        sdkAppId: this.trtcService.getSdkAppId(),
        astrologer: {
          userId: admin.id,
          userSig: astrologerSig,
          trtcUserId: trtcUserIdAstro,
        }
      }
    };
  }

  /**
   * Admin manually skips a queue entry (e.g., no-show).
   */
  async skipEntry(entryId: string) {
    const entry = await this.prisma.queueEntry.findUnique({
      where: { id: entryId },
    });

    if (!entry) {
      throw new NotFoundException("Queue entry not found.");
    }

    if (entry.status !== "WAITING" && entry.status !== "CALLING") {
      throw new BadRequestException("Can only skip WAITING or CALLING entries.");
    }

    await this.prisma.queueEntry.update({
      where: { id: entryId },
      data: { status: "ABANDONED" },
    });

    await this.reorderPositions(entry.campaignId);
    this.queueGateway.broadcastPositionUpdate(entry.campaignId);

    return { success: true };
  }

  /**
   * Admin removes a queue entry.
   */
  async removeEntry(entryId: string) {
    return this.skipEntry(entryId); // Same logic for now
  }

  /**
   * Mark a queue entry as COMPLETED (called when the consultation ends).
   */
  async markCompleted(consultationId: string) {
    const entry = await this.prisma.queueEntry.findFirst({
      where: { consultationId, status: "IN_CALL" },
    });

    if (entry) {
      await this.prisma.queueEntry.update({
        where: { id: entry.id },
        data: { status: "COMPLETED" },
      });

      this.logger.log(
        `[QUEUE] Entry ${entry.id} marked COMPLETED for consultation ${consultationId}`,
      );

      return entry;
    }

    return null;
  }

  /**
   * Reorder positions for remaining WAITING entries so they're sequential from 1.
   */
  private async reorderPositions(campaignId: string) {
    const waitingEntries = await this.prisma.queueEntry.findMany({
      where: {
        campaignId,
        status: "WAITING",
      },
      orderBy: { position: "asc" },
    });

    for (let i = 0; i < waitingEntries.length; i++) {
      const newPosition = i + 1;
      if (waitingEntries[i].position !== newPosition) {
        await this.prisma.queueEntry.update({
          where: { id: waitingEntries[i].id },
          data: { position: newPosition },
        });
      }
    }
  }

  /**
   * Admin force-closes a stuck consultation.
   */
  async forceCloseStuckConsultation(consultationId: string) {
    const consultation = await this.prisma.consultation.findUnique({
      where: { id: consultationId },
      include: { callSession: true },
    });

    if (!consultation) {
      throw new NotFoundException("Consultation not found.");
    }
    if (consultation.status !== "ACTIVE") {
      throw new BadRequestException("Consultation is not ACTIVE.");
    }

    await this.prisma.$transaction(async (tx) => {
      // 1. Close consultation
      await tx.consultation.update({
        where: { id: consultationId },
        data: { status: "COMPLETED" },
      });

      // 2. Close call session if exists
      if (consultation.callSession) {
        await tx.callSession.updateMany({
          where: { id: consultation.callSession.id },
          data: { status: "COMPLETED", endReason: "ADMIN_FORCE_CLOSE", endedAt: new Date() }
        });
      }

      // 3. Mark queue entry as COMPLETED
      await tx.queueEntry.updateMany({
        where: { consultationId, status: "IN_CALL" },
        data: { status: "COMPLETED" },
      });
    });

    if (consultation.campaignId) {
      this.queueGateway.broadcastPositionUpdate(consultation.campaignId);
    }

    this.logger.log(`[QUEUE] Admin force-closed consultation ${consultationId}`);
    return { success: true, message: "Consultation force-closed successfully." };
  }

  /**
   * Cron job to clean up stale ACTIVE consultations older than 2 hours.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleStaleConsultationCleanup() {
    this.logger.log("[QUEUE] Running stale consultation cleanup cron...");
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    const staleConsultations = await this.prisma.consultation.findMany({
      where: {
        status: "ACTIVE",
        createdAt: { lt: twoHoursAgo },
      },
    });

    for (const c of staleConsultations) {
      this.logger.warn(`[QUEUE] Cleaning up stale consultation ${c.id}`);
      await this.prisma.$transaction(async (tx) => {
        await tx.consultation.update({
          where: { id: c.id },
          data: { status: "COMPLETED" },
        });
        await tx.callSession.updateMany({
          where: { consultationId: c.id },
          data: { status: "COMPLETED", endReason: "TIMEOUT_AUTO_CLEANUP", endedAt: new Date() }
        });
        await tx.queueEntry.updateMany({
          where: { consultationId: c.id, status: "IN_CALL" },
          data: { status: "COMPLETED" },
        });
      });
      if (c.campaignId) {
        this.queueGateway.broadcastPositionUpdate(c.campaignId);
      }
    }
  }
}
