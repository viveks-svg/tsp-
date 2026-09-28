import { Controller, Get, Header, Query } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { Role } from "@prisma/client";
import { Roles } from "../../../common/decorators/roles.decorator";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import { TIER_ADMIN_EXPORT, TIER_ADMIN_INTERNAL } from "../../../common/config/rate-limit.config";
import { AdminReportsService, type ReportRange } from "./admin-reports.service";

@Controller("admin/reports")
@Roles(Role.ADMIN)
@RequirePermission("reports.view")
@Throttle(TIER_ADMIN_INTERNAL)
export class AdminReportsController {
  constructor(private readonly reports: AdminReportsService) {}

  @Get()
  report(@Query() r: ReportRange) {
    return this.reports.report(r);
  }

  @Get("export")
  @Throttle(TIER_ADMIN_EXPORT)
  @Header("Content-Type", "text/csv; charset=utf-8")
  @Header("Content-Disposition", 'attachment; filename="tsp-monthly-report.csv"')
  export(@Query() r: ReportRange) {
    return this.reports.exportCsv(r);
  }
}
