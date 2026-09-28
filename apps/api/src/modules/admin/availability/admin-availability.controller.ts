import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import { Body, Controller, Delete, Get, Param, Post, Put, Query } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { Role } from "@prisma/client";
import { ScheduleService } from "../../schedule/schedule.service";
import { DayOffDto, SaveScheduleDto } from "./admin-availability.dto";
import { Roles } from "../../../common/decorators/roles.decorator";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { Public } from "../../../common/decorators/public.decorator";
import { TIER_ADMIN_INTERNAL, TIER_PUBLIC_TOOLS } from "../../../common/config/rate-limit.config";

/**
 * Admin endpoints for Dr. Pradeep's schedule: weekly hours (several blocks per
 * day), session settings, days off, and a preview of the slots clients will see.
 */
@Controller("admin/availability")
@Roles(Role.ADMIN)
@RequirePermission("schedule.manage")
@Throttle(TIER_ADMIN_INTERNAL)
export class AdminAvailabilityController {
  constructor(private readonly schedule: ScheduleService) {}

  @Get()
  async getSchedule() {
    return this.schedule.getSchedule();
  }

  @Put()
  async saveSchedule(@CurrentUser() user: any, @Body() dto: SaveScheduleDto) {
    return this.schedule.saveSchedule(user.id, dto);
  }

  @Get("preview")
  async preview(@Query("date") date: string) {
    return this.schedule.getBookableSlots(date);
  }

  @Post("days-off")
  async addDayOff(@Body() dto: DayOffDto) {
    return this.schedule.addDayOff(dto.date, dto.note);
  }

  @Delete("days-off/:date")
  async removeDayOff(@Param("date") date: string) {
    return this.schedule.removeDayOff(date);
  }
}

/**
 * Public endpoint for the campaign banner / booking flow
 * to check Dr. Pradeep's current availability status.
 */
@Controller("availability")
export class PublicAvailabilityController {
  constructor(private readonly schedule: ScheduleService) {}

  @Public()
  @Throttle(TIER_PUBLIC_TOOLS)
  @Get("dr-pradeep")
  async getDrPradeepStatus() {
    return this.schedule.getLiveStatus();
  }
}
