import { Module } from "@nestjs/common";
import { BlogsService } from "./blogs.service";
import { AdminBlogsController, BlogsController } from "./blogs.controller";

@Module({
  controllers: [BlogsController, AdminBlogsController],
  providers: [BlogsService],
  exports: [BlogsService],
})
export class BlogsModule {}
