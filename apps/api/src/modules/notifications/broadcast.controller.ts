import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { Role } from "@prisma/client";
import { IsIn, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { Roles } from "../../common/decorators/roles.decorator";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { TIER_ADMIN_INTERNAL } from "../../common/config/rate-limit.config";
import { BroadcastService, type Audience } from "./broadcast.service";

class BroadcastDto {
  @IsString()
  @MinLength(2)
  @MaxLength(65)
  title!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(240)
  body!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  link?: string;

  @IsIn(["ALL_CLIENTS", "RECENT_CLIENTS", "ME"])
  audience!: Audience;
}

/** Announcements to clients (notifications.send). */
@Controller("admin/announcements")
@Roles(Role.ADMIN)
@RequirePermission("notifications.send")
@Throttle(TIER_ADMIN_INTERNAL)
export class BroadcastController {
  constructor(private readonly broadcasts: BroadcastService) {}

  @Get()
  history(@Query("page") page?: string) {
    return this.broadcasts.history(Number(page));
  }

  @Get("audience")
  audience(@CurrentUser() user: any) {
    return this.broadcasts.audienceSize(user.id);
  }

  @Post()
  send(@CurrentUser() user: any, @Body() dto: BroadcastDto) {
    return this.broadcasts.send(user.id, dto);
  }
}
