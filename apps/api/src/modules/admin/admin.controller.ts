import { RequirePermission } from "../../common/decorators/require-permission.decorator";
import { Controller, Get, Post, Param, Body } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { AdminService } from "./admin.service";
import { AdminOverviewService } from "./overview/admin-overview.service";
import { ReviewAstrologerDto } from "./dto/admin.dto";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { TIER_ADMIN_INTERNAL } from "../../common/config/rate-limit.config";
import { Role } from "@prisma/client";

@Controller("admin")
@Roles(Role.ADMIN)
// Safe default: any endpoint added here without its own permission is super-admin only.
@RequirePermission("team.manage")
@Throttle(TIER_ADMIN_INTERNAL)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly overviewService: AdminOverviewService,
  ) {}

  @RequirePermission("overview.view")
  @Get("overview")
  async overview() {
    return this.overviewService.getOverview();
  }

  @RequirePermission("astrologers.manage")
  @Post("astrologers/:id/review")
  async reviewAstrologer(
    @CurrentUser() admin: any,
    @Param("id") id: string,
    @Body() dto: ReviewAstrologerDto,
  ) {
    return this.adminService.reviewAstrologer(admin.id, id, dto);
  }
}
