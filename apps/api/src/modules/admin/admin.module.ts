import { Module } from "@nestjs/common";
import { AdminService } from "./admin.service";
import { AdminController } from "./admin.controller";
import { AdminAvailabilityService } from "./availability/admin-availability.service";
import {
  AdminAvailabilityController,
  PublicAvailabilityController,
} from "./availability/admin-availability.controller";

@Module({
  controllers: [AdminController, AdminAvailabilityController, PublicAvailabilityController],
  providers: [AdminService, AdminAvailabilityService],
  exports: [AdminService, AdminAvailabilityService],
})
export class AdminModule {}
