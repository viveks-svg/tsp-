import { Controller, Post, Param, Body } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { AdminService } from "./admin.service";
import { ReviewAstrologerDto } from "./dto/admin.dto";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { TIER_ADMIN_INTERNAL } from "../../common/config/rate-limit.config";
import { Role } from "@prisma/client";

@Controller("admin")
@Roles(Role.ADMIN)
@Throttle(TIER_ADMIN_INTERNAL)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post("astrologers/:id/review")
  async reviewAstrologer(
    @CurrentUser() admin: any,
    @Param("id") id: string,
    @Body() dto: ReviewAstrologerDto,
  ) {
    return this.adminService.reviewAstrologer(admin.id, id, dto);
  }
}
