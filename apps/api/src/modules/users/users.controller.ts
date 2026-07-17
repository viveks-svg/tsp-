import { Controller, Get, Patch, Post, Body } from "@nestjs/common";
import { UsersService } from "./users.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { UpdateProfileDto } from "./dto/update-profile.dto";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("profile")
  async getProfile(@CurrentUser() user: any) {
    return this.usersService.getProfile(user.id);
  }

  @Patch("profile")
  async updateProfile(
    @CurrentUser() user: any,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Post("fcm-token")
  async registerFcmToken(
    @CurrentUser() user: any,
    @Body("token") token: string,
  ) {
    return this.usersService.registerFcmToken(user.id, token);
  }
}

