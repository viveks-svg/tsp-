import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { Role, StaffRole } from "@prisma/client";
import { IsEmail, IsEnum, IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";
import { Roles } from "../../../common/decorators/roles.decorator";
import { Public } from "../../../common/decorators/public.decorator";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import { TIER_ADMIN_INTERNAL, TIER_AUTH_STRICT } from "../../../common/config/rate-limit.config";
import { TeamService } from "./team.service";

class InviteDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  name?: string;

  @IsEnum(StaffRole)
  staffRole!: StaffRole;
}

class ChangeRoleDto {
  @IsEnum(StaffRole)
  staffRole!: StaffRole;
}

class AcceptInviteDto {
  @IsString()
  token!: string;

  @IsString()
  @MinLength(2, { message: "Name must be at least 2 characters" })
  @MaxLength(80)
  name!: string;

  // Same rules as sign-up.
  @IsString()
  @MinLength(8, { message: "Password must be at least 8 characters" })
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/~`';])/, {
    message: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
  })
  password!: string;
}

/** Super admins manage who is on the admin team and with which role. */
@Controller("admin/team")
@Roles(Role.ADMIN)
@RequirePermission("team.manage")
@Throttle(TIER_ADMIN_INTERNAL)
export class TeamController {
  constructor(private readonly team: TeamService) {}

  @Get()
  overview() {
    return this.team.overview();
  }

  @Post("invites")
  invite(@CurrentUser() actor: any, @Body() dto: InviteDto) {
    return this.team.invite(actor.id, dto);
  }

  @Post("invites/:id/resend")
  @HttpCode(HttpStatus.OK)
  resend(@Param("id") id: string) {
    return this.team.resend(id);
  }

  @Delete("invites/:id")
  revoke(@Param("id") id: string) {
    return this.team.revoke(id);
  }

  /** After a lost laptop or a leaked password: every other staff and astrologer login must sign in again. */
  @Post("sign-out-all")
  @HttpCode(HttpStatus.OK)
  signOutAll(@CurrentUser() actor: any) {
    return this.team.signOutEveryoneElse(actor.id);
  }

  @Patch(":userId")
  changeRole(@CurrentUser() actor: any, @Param("userId") userId: string, @Body() dto: ChangeRoleDto) {
    return this.team.changeRole(actor.id, userId, dto.staffRole);
  }

  @Delete(":userId")
  remove(@CurrentUser() actor: any, @Param("userId") userId: string) {
    return this.team.remove(actor.id, userId);
  }
}

/** The invitee's side: look at the invitation, then set a name and password. */
@Controller("auth/invite")
@Public()
@Throttle(TIER_AUTH_STRICT)
export class StaffInviteController {
  constructor(private readonly team: TeamService) {}

  @Get()
  peek(@Query("token") token: string) {
    return this.team.peek(token);
  }

  @Post("accept")
  @HttpCode(HttpStatus.OK)
  accept(@Body() dto: AcceptInviteDto) {
    return this.team.accept(dto.token, dto.name, dto.password);
  }
}
