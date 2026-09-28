import { CallHandler, ExecutionContext, HttpException, Injectable, NestInterceptor } from "@nestjs/common";
import { from, Observable, switchMap, tap } from "rxjs";
import { PrismaService } from "../../database/prisma.service";
import { ScheduleService } from "../schedule/schedule.service";
import { FinanceSettingsService } from "../finance/finance-settings.service";
import { AUDIT_ROUTES, AuditDeps, AuditRoute, genericRoute } from "./audit-actions";
import { AuditService, diffFields } from "./audit.service";

const CHANGES = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const PANEL_ROLES = new Set(["ADMIN", "ASTROLOGER"]);
const PREFIX = /^\/api\/v1/;

/**
 * Writes an activity-log entry for every change a staff member or astrologer
 * makes: after it succeeds, or when it fails for a reason other than a form
 * mistake. Edits load the record first so the entry can show old → new values.
 * (Blocked attempts are logged by PermissionsGuard, which runs before this.)
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly deps: AuditDeps;

  constructor(
    private readonly audit: AuditService,
    prisma: PrismaService,
    schedule: ScheduleService,
    finance: FinanceSettingsService,
  ) {
    this.deps = { prisma, schedule, finance };
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== "http") return next.handle();
    const req = context.switchToHttp().getRequest();
    const user = req.user;
    if (!CHANGES.has(req.method) || !user || !PANEL_ROLES.has(user.role)) return next.handle();

    const path = String(req.route?.path ?? "").replace(PREFIX, "");
    const route: AuditRoute | undefined =
      AUDIT_ROUTES[`${req.method} ${path}`] ?? (path.startsWith("/admin/") ? genericRoute(req.method, path) : undefined);
    if (!route) return next.handle();

    const params = { ...(req.params ?? {}) };
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const loadBefore = route.load ? route.load(this.deps, params, body).catch(() => null) : Promise.resolve(null);

    const base = {
      actor: user,
      action: route.action,
      area: route.area,
      targetType: route.targetType ?? null,
      ipAddress: req.ip ?? null,
      userAgent: req.headers?.["user-agent"] ?? null,
    };

    return from(loadBefore).pipe(
      switchMap((before) =>
        next.handle().pipe(
          tap({
            next: (result) => {
              const c = { body, params, before, result };
              let summary = route.title;
              try {
                summary = route.summary ? route.summary(c) : route.title;
              } catch {
                /* keep the plain title */
              }
              const changes = route.diff ? safe(() => route.diff!(c)) : route.track ? diffFields(before, body, route.track) : [];
              void this.audit.record({
                ...base,
                outcome: route.failed && safe(() => route.failed!(c)) ? "FAILED" : "SUCCESS",
                summary,
                targetId: (route.targetId ? safe(() => route.targetId!(c)) : null) ?? params.id ?? null,
                changes: changes ?? [],
                // Creations and anything without a field-by-field comparison keep what was sent.
                details: route.track || route.diff ? null : body,
              });
            },
            error: (err) => {
              const status = err instanceof HttpException ? err.getStatus() : 500;
              // Form mistakes (400/422) and missing records (404) aren't worth a line.
              if (status === 400 || status === 404 || status === 422) return;
              const message = err instanceof HttpException ? messageOf(err) : "Server error";
              void this.audit.record({
                ...base,
                outcome: "FAILED",
                summary: `Could not ${lowerFirst(route.title)}: ${message}`,
                targetId: params.id ?? null,
                details: { request: body, status },
              });
            },
          }),
        ),
      ),
    );
  }
}

const safe = <T>(fn: () => T): T | null => {
  try {
    return fn();
  } catch {
    return null;
  }
};

const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

const messageOf = (err: HttpException) => {
  const r = err.getResponse() as any;
  const m = typeof r === "string" ? r : r?.message;
  return Array.isArray(m) ? m.join("; ") : String(m ?? err.message);
};
