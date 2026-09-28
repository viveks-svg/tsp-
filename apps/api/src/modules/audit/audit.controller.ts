import { Controller, Get, Header, Query } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { Role } from "@prisma/client";
import { Roles } from "../../common/decorators/roles.decorator";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";
import { TIER_ADMIN_EXPORT, TIER_ADMIN_INTERNAL } from "../../common/config/rate-limit.config";
import { AuditService, type AuditFilters } from "./audit.service";

/** The activity log: read-only, for super admins. */
@Controller("admin/activity")
@Roles(Role.ADMIN)
@RequirePermission("audit.view")
@Throttle(TIER_ADMIN_INTERNAL)
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  list(@Query() f: AuditFilters) {
    return this.audit.list(f);
  }

  @Get("actors")
  actors() {
    return this.audit.actors();
  }

  @Get("export")
  @Throttle(TIER_ADMIN_EXPORT)
  @Header("Content-Type", "text/csv; charset=utf-8")
  @Header("Content-Disposition", 'attachment; filename="tsp-activity-log.csv"')
  export(@Query() f: AuditFilters) {
    return this.audit.exportCsv(f);
  }
}
