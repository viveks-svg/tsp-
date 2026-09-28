import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { Role } from "@prisma/client";
import { Public } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { TIER_ADMIN_INTERNAL, TIER_PUBLIC_TOOLS } from "../../common/config/rate-limit.config";
import { BlogsService } from "./blogs.service";
import { BlogDto } from "./blogs.dto";

/** The public blog: published articles only. */
@Controller("blogs")
@Public()
@Throttle(TIER_PUBLIC_TOOLS)
export class BlogsController {
  constructor(private readonly blogsService: BlogsService) {}

  @Get()
  list() {
    return this.blogsService.listPublished();
  }

  @Get(":slug")
  get(@Param("slug") slug: string) {
    return this.blogsService.getPublished(slug);
  }
}

/** Writing and publishing articles (content.manage). */
@Controller("admin/blogs")
@Roles(Role.ADMIN)
@RequirePermission("content.manage")
@Throttle(TIER_ADMIN_INTERNAL)
export class AdminBlogsController {
  constructor(private readonly blogsService: BlogsService) {}

  @Get()
  list() {
    return this.blogsService.listAll();
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.blogsService.get(id);
  }

  @Post()
  create(@CurrentUser() user: any, @Body() dto: BlogDto) {
    return this.blogsService.create(user.id, dto);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: BlogDto) {
    return this.blogsService.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.blogsService.remove(id);
  }
}
