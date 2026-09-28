import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PERMISSION_KEY } from "../decorators/require-permission.decorator";
import { can, type Permission } from "../permissions";
import { AuditService } from "../../modules/audit/audit.service";

/** Enforces @RequirePermission: the caller must be an ADMIN whose staff role grants it. */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly audit: AuditService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Permission | undefined>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required) return true;

    const req = context.switchToHttp().getRequest();
    const { user } = req;
    if (!user || !can(user.role, user.staffRole, required)) {
      // A staff member reaching past their role is worth knowing about.
      if (user?.role === "ADMIN") {
        void this.audit.record({
          actor: user,
          action: "auth.denied",
          area: "security",
          summary: `Was blocked from ${req.method === "GET" ? "opening" : "changing"} ${String(req.route?.path ?? req.path).replace(/^\/api\/v1/, "")} (needs “${required}”)`,
          outcome: "DENIED",
          ipAddress: req.ip,
          userAgent: req.headers?.["user-agent"],
        });
      }
      throw new ForbiddenException("Your role doesn't include this part of the admin panel.");
    }
    return true;
  }
}
