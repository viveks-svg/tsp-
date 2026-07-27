import { Controller, Get, Post, Patch, Param, Body } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { CampaignService } from "./campaign.service";
import { CreateCampaignDto, UpdateCampaignDto } from "./campaign.dto";
import { Roles } from "../../common/decorators/roles.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { TIER_ADMIN_INTERNAL, TIER_PUBLIC_TOOLS } from "../../common/config/rate-limit.config";
import { Role } from "@prisma/client";

/**
 * Admin-only campaign management endpoints.
 */
@Controller("admin/campaigns")
@Roles(Role.ADMIN)
@Throttle(TIER_ADMIN_INTERNAL)
export class AdminCampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @Post()
  async create(@Body() dto: CreateCampaignDto) {
    return this.campaignService.create(dto);
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() dto: UpdateCampaignDto) {
    return this.campaignService.update(id, dto);
  }

  @Get()
  async findAll() {
    return this.campaignService.findAll();
  }

  @Get(":id")
  async findById(@Param("id") id: string) {
    return this.campaignService.findById(id);
  }
}

/**
 * Public endpoint for the campaign banner — returns the active campaign
 * with live status and countdown info.
 */
@Controller("campaigns")
export class PublicCampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @Public()
  @Throttle(TIER_PUBLIC_TOOLS)
  @Get("active")
  async getActiveCampaign() {
    return this.campaignService.getActiveCampaign();
  }
}
