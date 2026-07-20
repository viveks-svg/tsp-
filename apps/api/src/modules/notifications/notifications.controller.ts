import { Controller, Get, Patch, Post, Body, Query, Param, ForbiddenException, NotFoundException } from "@nestjs/common";
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
    // Explicitly parse limit as integer to avoid Prisma validation errors
    const limit = query.limit ? parseInt(query.limit as any, 10) : 20;
    const unreadOnly = query.unreadOnly === true || query.unreadOnly === 'true' as any;
    
    return this.notificationsService.getUserNotifications(
      user.id,
      unreadOnly,
      isNaN(limit) ? 20 : limit,
    );
  }

  @Post("test-push")
  async sendTestPush(
    @CurrentUser() user: User,
    @Body("title") title?: string,
    @Body("body") body?: string,
  ) {
    return this.notificationsService.sendTestPushNotification(user.id, title, body);
  }

  @Post("force-admin")
  async forceAdmin(@CurrentUser() user: any) {
    // A helpful debug endpoint to ensure the user is an ADMIN
    await this.notificationsService.makeUserAdmin(user.id);
    return { success: true, message: "You are now an ADMIN! You will now receive push notifications." };
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
