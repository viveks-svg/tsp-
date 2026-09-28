import { RequirePermission } from "../../common/decorators/require-permission.decorator";
import { Controller, Post, Body, Get, Patch, Param } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { AstrologersService } from "./astrologers.service";
import { UpdateAvailabilityDto, ReviewKycDto } from "./dto/astrologer.dto";
import { SetAvailabilityRulesDto, AddAvailabilityExceptionDto } from "./dto/availability.dto";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { TIER_PUBLIC_TOOLS, TIER_ADMIN_INTERNAL } from "../../common/config/rate-limit.config";
import { Role } from "@prisma/client";

@Controller("astrologers")
export class AstrologersController {
  constructor(private readonly astrologersService: AstrologersService) {}

  // Astrologers are created by admins (Admin → Astrologers); there is no self sign-up.

  @Throttle(TIER_ADMIN_INTERNAL)
  @Roles(Role.ASTROLOGER)
  @Patch("me/availability")
  async updateAvailability(
    @CurrentUser() user: any,
    @Body() dto: UpdateAvailabilityDto,
  ) {
    return this.astrologersService.updateAvailability(user.id, dto.isAvailable);
  }

  @Throttle(TIER_ADMIN_INTERNAL)
  @Patch(":id/kyc/review")
  @Roles(Role.ADMIN)
  @RequirePermission("astrologers.manage")
  async reviewKyc(
    @CurrentUser() user: any,
    @Param("id") id: string,
    @Body() dto: ReviewKycDto,
  ) {
    return this.astrologersService.reviewKyc(id, user.id, dto);
  }

  @Throttle(TIER_ADMIN_INTERNAL)
  @Roles(Role.ASTROLOGER)
  @Post("me/availability/rules")
  async setAvailabilityRules(
    @CurrentUser() user: any,
    @Body() dto: SetAvailabilityRulesDto,
  ) {
    return this.astrologersService.setAvailabilityRules(user.id, dto);
  }

  @Throttle(TIER_ADMIN_INTERNAL)
  @Roles(Role.ASTROLOGER)
  @Get("me/availability/rules")
  async getMyAvailabilityRules(@CurrentUser() user: any) {
    return this.astrologersService.getMyAvailabilityRules(user.id);
  }

  @Public()
  @Throttle(TIER_PUBLIC_TOOLS)
  @Get(":id/availability/rules")
  async getAvailabilityRules(@Param("id") id: string) {
    return this.astrologersService.getAvailabilityRules(id);
  }

  @Throttle(TIER_ADMIN_INTERNAL)
  @Roles(Role.ASTROLOGER)
  @Post("me/availability/exceptions")
  async addAvailabilityException(
    @CurrentUser() user: any,
    @Body() dto: AddAvailabilityExceptionDto,
  ) {
    return this.astrologersService.addAvailabilityException(user.id, dto);
  }

  @Public()
  @Throttle(TIER_PUBLIC_TOOLS)
  @Get(":id/availability/exceptions")
  async getAvailabilityExceptions(@Param("id") id: string) {
    return this.astrologersService.getAvailabilityExceptions(id);
  }

  @Public()
  @Throttle(TIER_PUBLIC_TOOLS)
  @Get()
  async getApprovedAstrologers() {
    return this.astrologersService.findAllApproved();
  }

  @Public()
  @Throttle(TIER_PUBLIC_TOOLS)
  @Get(":id")
  async getAstrologerById(@Param("id") id: string) {
    return this.astrologersService.findById(id);
  }
}

