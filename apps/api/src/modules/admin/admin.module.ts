import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { MailModule } from "../mail/mail.module";
import { StaffInviteController, TeamController } from "./team/team.controller";
import { TeamService } from "./team/team.service";
import { AdminAstrologersController } from "./astrologers/admin-astrologers.controller";
import { AdminAstrologersService } from "./astrologers/admin-astrologers.service";
import { AdminRecordsController } from "./records/admin-records.controller";
import { AdminRecordsService } from "./records/admin-records.service";
import { AdminService } from "./admin.service";
import { AdminReportsController } from "./reports/admin-reports.controller";
import { AdminReportsService } from "./reports/admin-reports.service";
import { AdminController } from "./admin.controller";
import { AdminOverviewService } from "./overview/admin-overview.service";
import {
  AdminAvailabilityController,
  PublicAvailabilityController,
} from "./availability/admin-availability.controller";

@Module({
  imports: [AuthModule, MailModule],
  controllers: [AdminController, TeamController, StaffInviteController, AdminAstrologersController, AdminRecordsController, AdminAvailabilityController, PublicAvailabilityController, AdminReportsController],
  providers: [TeamService, AdminService, AdminOverviewService, AdminAstrologersService, AdminRecordsService, AdminReportsService],
  exports: [AdminService],
})
export class AdminModule {}
