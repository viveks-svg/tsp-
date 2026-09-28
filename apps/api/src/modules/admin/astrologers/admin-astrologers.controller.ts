import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { Role } from "@prisma/client";
import { Roles } from "../../../common/decorators/roles.decorator";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { TIER_ADMIN_INTERNAL } from "../../../common/config/rate-limit.config";
import { AdminAstrologersService } from "./admin-astrologers.service";
import { CreateAstrologerDto, ResetAstrologerPasswordDto, UpdateAstrologerDto } from "./admin-astrologers.dto";

/** Admins add astrologers, edit their profiles and reset their passwords. */
@Controller("admin/astrologers")
@Roles(Role.ADMIN)
@RequirePermission("astrologers.manage")
@Throttle(TIER_ADMIN_INTERNAL)
export class AdminAstrologersController {
  constructor(private readonly astrologers: AdminAstrologersService) {}

  @Get()
  async list() {
    return this.astrologers.list();
  }

  @Post()
  async create(@CurrentUser() admin: any, @Body() dto: CreateAstrologerDto) {
    return this.astrologers.create(admin.id, dto);
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() dto: UpdateAstrologerDto) {
    return this.astrologers.update(id, dto);
  }

  @Post(":id/deactivate")
  @HttpCode(HttpStatus.OK)
  async deactivate(@Param("id") id: string) {
    return this.astrologers.deactivate(id);
  }

  @Post(":id/reactivate")
  @HttpCode(HttpStatus.OK)
  async reactivate(@Param("id") id: string) {
    return this.astrologers.reactivate(id);
  }

  @Post(":id/reset-password")
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Param("id") id: string, @Body() dto: ResetAstrologerPasswordDto) {
    return this.astrologers.resetPassword(id, dto.mode);
  }
}
