import { Controller, Post, Body, Get, Patch, Param } from "@nestjs/common";
import { AstrologersService } from "./astrologers.service";
import { OnboardAstrologerDto, UpdateAvailabilityDto, SubmitKycDto, ReviewKycDto } from "./dto/astrologer.dto";
import { SetAvailabilityRulesDto, AddAvailabilityExceptionDto } from "./dto/availability.dto";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "@prisma/client";

@Controller("astrologers")
export class AstrologersController {
  constructor(private readonly astrologersService: AstrologersService) {}

  @Post("onboard")
  async onboard(
    @CurrentUser() user: any,
    @Body() dto: OnboardAstrologerDto,
  ) {
    return this.astrologersService.onboard(user.id, dto);
  }

  @Patch("me/availability")
  async updateAvailability(
    @CurrentUser() user: any,
    @Body() dto: UpdateAvailabilityDto,
  ) {
    return this.astrologersService.updateAvailability(user.id, dto.isAvailable);
  }

  @Post("kyc/submit")
  async submitKyc(
    @CurrentUser() user: any,
    @Body() dto: SubmitKycDto,
  ) {
    return this.astrologersService.submitKyc(user.id, dto);
  }

  @Patch(":id/kyc/review")
  @Roles(Role.ADMIN)
  async reviewKyc(
    @CurrentUser() user: any,
    @Param("id") id: string,
    @Body() dto: ReviewKycDto,
  ) {
    return this.astrologersService.reviewKyc(id, user.id, dto);
  }

  @Post("me/availability/rules")
  async setAvailabilityRules(
    @CurrentUser() user: any,
    @Body() dto: SetAvailabilityRulesDto,
  ) {
    return this.astrologersService.setAvailabilityRules(user.id, dto);
  }

  @Public()
  @Get(":id/availability/rules")
  async getAvailabilityRules(@Param("id") id: string) {
    return this.astrologersService.getAvailabilityRules(id);
  }

  @Post("me/availability/exceptions")
  async addAvailabilityException(
    @CurrentUser() user: any,
    @Body() dto: AddAvailabilityExceptionDto,
  ) {
    return this.astrologersService.addAvailabilityException(user.id, dto);
  }

  @Public()
  @Get(":id/availability/exceptions")
  async getAvailabilityExceptions(@Param("id") id: string) {
    return this.astrologersService.getAvailabilityExceptions(id);
  }

  @Public()
  @Get()
  async getApprovedAstrologers() {
    return this.astrologersService.findAllApproved();
  }

  @Public()
  @Get(":id")
  async getAstrologerById(@Param("id") id: string) {
    return this.astrologersService.findById(id);
  }
}

