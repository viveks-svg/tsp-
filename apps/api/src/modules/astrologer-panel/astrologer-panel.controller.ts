import { Controller, Get } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { Role } from "@prisma/client";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { TIER_ADMIN_INTERNAL } from "../../common/config/rate-limit.config";
import { AstrologerPanelService } from "./astrologer-panel.service";

/** The signed-in astrologer's own overview, hours and earnings. */
@Controller("astrologer")
@Roles(Role.ASTROLOGER)
@Throttle(TIER_ADMIN_INTERNAL)
export class AstrologerPanelController {
  constructor(private readonly panel: AstrologerPanelService) {}

  @Get("overview")
  async overview(@CurrentUser() user: any) {
    return this.panel.overview(user.id);
  }

  @Get("hours")
  async hours(@CurrentUser() user: any) {
    return this.panel.hours(user.id);
  }

  @Get("earnings")
  async earnings(@CurrentUser() user: any) {
    return this.panel.earnings(user.id);
  }
}
