import { Controller, Get, Post, Body } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { AdminAvailabilityService } from "./admin-availability.service";
import { SetAvailabilityRulesDto } from "./admin-availability.dto";
import { Roles } from "../../../common/decorators/roles.decorator";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { Public } from "../../../common/decorators/public.decorator";
import { TIER_ADMIN_INTERNAL, TIER_PUBLIC_TOOLS } from "../../../common/config/rate-limit.config";
import { Role } from "@prisma/client";

/**
 * Admin-only endpoints for managing Dr. Pradeep's availability rules.
 */
@Controller("admin/availability")
@Roles(Role.ADMIN)
@Throttle(TIER_ADMIN_INTERNAL)
export class AdminAvailabilityController {
  constructor(private readonly service: AdminAvailabilityService) {}

  @Get()
  async getRules(@CurrentUser() user: any) {
    return this.service.getRules(user.id);
  }

  @Post()
  async setRules(
    @CurrentUser() user: any,
    @Body() dto: SetAvailabilityRulesDto,
  ) {
    return this.service.setRules(user.id, dto);
  }
}

/**
 * Public endpoint for the campaign banner / booking flow
 * to check Dr. Pradeep's current availability status.
 */
@Controller("availability")
export class PublicAvailabilityController {
  constructor(private readonly service: AdminAvailabilityService) {}

  @Public()
  @Throttle(TIER_PUBLIC_TOOLS)
  @Get("dr-pradeep")
  async getDrPradeepStatus() {
    return this.service.getCurrentStatus();
  }
}
