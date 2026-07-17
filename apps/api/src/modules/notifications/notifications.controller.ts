import { Controller, Get, Patch, Query, Param, ForbiddenException, NotFoundException } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";
import { GetNotificationsDto } from "./dto/get-notifications.dto";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { User } from "@prisma/client";

@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(
    @CurrentUser() user: User,
    @Query() query: GetNotificationsDto,
  ) {
    return this.notificationsService.getUserNotifications(
      user.id,
      query.unreadOnly || false,
      query.limit || 20,
    );
  }

  @Patch("read-all")
  async markAllAsRead(@CurrentUser() user: User) {
    await this.notificationsService.markAllAsRead(user.id);
    return { success: true };
  }

  @Patch(":id/read")
  async markAsRead(@Param("id") id: string, @CurrentUser() user: User) {
    const result = await this.notificationsService.markAsRead(id, user.id);
    if (!result) {
      throw new NotFoundException("Notification not found or access denied");
    }
    return { success: true };
  }
}
