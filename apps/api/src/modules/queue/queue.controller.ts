import { Controller, Post, Get, Param, Body, HttpCode, HttpStatus, Query } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { QueueService } from "./queue.service";
import { JoinQueueDto, LeaveQueueDto } from "./queue.dto";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { TIER_ADMIN_INTERNAL, TIER_AUTHENTICATED_DEFAULT } from "../../common/config/rate-limit.config";
import { Role } from "@prisma/client";

/**
 * User-facing queue endpoints (join / leave).
 */
@Controller("queue")
@Throttle(TIER_AUTHENTICATED_DEFAULT)
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Post("join")
  async join(@CurrentUser() user: any, @Body() dto: JoinQueueDto) {
    console.log("[QUEUE JOIN] Payload received:", { userId: user.id, dto });
    try {
      const result = await this.queueService.join(user.id, dto.campaignId);
      console.log("[QUEUE JOIN] Success:", result);
      return result;
    } catch (e: any) {
      console.error("[QUEUE JOIN] Failed. Error:", {
        message: e.message,
        status: e.status,
        response: e.getResponse?.()
      });
      throw e;
    }
  }

  @Post("leave")
  @HttpCode(HttpStatus.OK)
  async leave(@CurrentUser() user: any, @Body() dto: LeaveQueueDto) {
    return this.queueService.leave(user.id, dto.campaignId);
  }

  @Get("position")
  async getPosition(@CurrentUser() user: any, @Query("campaignId") campaignId: string) {
    if (!campaignId) {
      throw new Error("campaignId query parameter is required");
    }
    return this.queueService.getUserPosition(user.id, campaignId);
  }
}

/**
 * Admin queue management endpoints.
 */
@Controller("admin/queue")
@Roles(Role.ADMIN)
@Throttle(TIER_ADMIN_INTERNAL)
export class AdminQueueController {
  constructor(private readonly queueService: QueueService) {}

  @Get()
  async getOverview() {
    return this.queueService.getAdminQueueOverview();
  }

  @Post(":entryId/skip")
  @HttpCode(HttpStatus.OK)
  async skip(@Param("entryId") entryId: string) {
    return this.queueService.skipEntry(entryId);
  }

  @Post(":entryId/remove")
  @HttpCode(HttpStatus.OK)
  async remove(@Param("entryId") entryId: string) {
    return this.queueService.removeEntry(entryId);
  }

  @Post("dequeue/:campaignId")
  @HttpCode(HttpStatus.OK)
  async manualDequeue(@Param("campaignId") campaignId: string) {
    return this.queueService.dequeueNext(campaignId);
  }

  @Post("force-close/:consultationId")
  @HttpCode(HttpStatus.OK)
  async forceClose(@Param("consultationId") consultationId: string) {
    return this.queueService.forceCloseStuckConsultation(consultationId);
  }
}
