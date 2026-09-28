import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { MoneyActionType, Role } from "@prisma/client";
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength } from "class-validator";
import { Roles } from "../../common/decorators/roles.decorator";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { TIER_ADMIN_INTERNAL } from "../../common/config/rate-limit.config";
import { FinanceSettingsService } from "./finance-settings.service";
import { MoneyActionsService } from "./money-actions.service";
import { can } from "../../common/permissions";

class FinanceSettingsDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  commissionPercent!: number;

  @IsNumber({ maxDecimalPlaces: 0 })
  @Min(0)
  @Max(10_000_000)
  managerApprovalLimit!: number;

  @IsBoolean()
  bookingEarnings!: boolean;
}

class RazorpaySettingsDto {
  @IsString()
  @MaxLength(64)
  keyId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  keySecret?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  webhookSecret?: string;
}

class MoneyRequestDto {
  @IsEnum(MoneyActionType)
  type!: MoneyActionType;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(10_000_000)
  amount!: number;

  @IsString()
  @MinLength(3)
  @MaxLength(300)
  reason!: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  targetId?: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  reference?: string;
}

class ReviewDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;
}

/** Money settings (super admins). */
@Controller("admin/settings")
@Roles(Role.ADMIN)
@RequirePermission("settings.manage")
@Throttle(TIER_ADMIN_INTERNAL)
export class FinanceSettingsController {
  constructor(private readonly settings: FinanceSettingsService) {}

  @Get("finance")
  finance() {
    return this.settings.getFinance();
  }

  @Put("finance")
  saveFinance(@CurrentUser() actor: any, @Body() dto: FinanceSettingsDto) {
    return this.settings.saveFinance(actor.id, dto);
  }

  @Get("razorpay")
  razorpay() {
    return this.settings.describeRazorpay();
  }

  @Put("razorpay")
  saveRazorpay(@CurrentUser() actor: any, @Body() dto: RazorpaySettingsDto) {
    return this.settings.saveRazorpay(actor.id, dto);
  }

  @Post("razorpay/test")
  @HttpCode(HttpStatus.OK)
  testRazorpay() {
    return this.settings.testCurrent();
  }

  @Delete("razorpay")
  clearRazorpay() {
    return this.settings.clearRazorpay();
  }
}

/** Refunds, wallet adjustments and payouts, with approvals above the manager limit. */
@Controller("admin/money")
@Roles(Role.ADMIN)
@Throttle(TIER_ADMIN_INTERNAL)
export class MoneyActionsController {
  constructor(
    private readonly money: MoneyActionsService,
    private readonly settings: FinanceSettingsService,
  ) {}

  /** The limits that apply to the signed-in admin (shown in money dialogs). */
  /**
   * The caller's limits. With targetId/userId, also what they have already moved
   * on their own authority for that client or order in the last 24 hours
   * (which counts toward the approval limit).
   */
  @Get("rules")
  async rules(@CurrentUser() actor: any, @Query("targetId") targetId?: string, @Query("userId") userId?: string) {
    const { managerApprovalLimit } = await this.settings.getFinance();
    const superAdmin = actor.staffRole === "SUPER_ADMIN";
    const usedToday =
      !superAdmin && (targetId || userId)
        ? await this.money.selfApprovedRecently(actor.id, { targetId: targetId ?? null, userId: userId ?? null })
        : 0;
    return {
      approvalLimit: managerApprovalLimit,
      actsWithoutApproval: superAdmin,
      canApprove: can(actor.role, actor.staffRole, "money.approve"),
      usedToday,
    };
  }

  /** The kind of action decides the permission needed (checked in the service). */
  @Post()
  request(@CurrentUser() actor: any, @Body() dto: MoneyRequestDto) {
    return this.money.request(actor, dto);
  }

  @Get()
  @RequirePermission("payments.view")
  async list(
    @Query("status") status?: string,
    @Query("type") type?: string,
    @Query("targetId") targetId?: string,
    @Query("userId") userId?: string,
    @Query("page") page?: string,
  ) {
    const [result, finance] = await Promise.all([
      this.money.list({ status, type, targetId, userId }, Number(page)),
      this.settings.getFinance(),
    ]);
    return { ...result, approvalLimit: finance.managerApprovalLimit };
  }

  @Post(":id/approve")
  @HttpCode(HttpStatus.OK)
  @RequirePermission("money.approve")
  approve(@CurrentUser() actor: any, @Param("id") id: string, @Body() dto: ReviewDto) {
    return this.money.approve(actor, id, dto.note);
  }

  @Post(":id/reject")
  @HttpCode(HttpStatus.OK)
  @RequirePermission("money.approve")
  reject(@CurrentUser() actor: any, @Param("id") id: string, @Body() dto: ReviewDto) {
    return this.money.reject(actor, id, dto.note);
  }

  @Get("payouts")
  @RequirePermission("payouts.manage")
  payouts() {
    return this.money.payoutBalances();
  }
}
