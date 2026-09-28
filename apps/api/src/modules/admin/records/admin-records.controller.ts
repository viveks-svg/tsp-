import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import { Body, Controller, Get, Header, Param, Patch, Query } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { Role, ShopOrderStatus } from "@prisma/client";
import { IsEnum } from "class-validator";
import { Roles } from "../../../common/decorators/roles.decorator";
import { TIER_ADMIN_EXPORT, TIER_ADMIN_INTERNAL } from "../../../common/config/rate-limit.config";
import { AdminRecordsService, PaymentFilters } from "./admin-records.service";

class UpdateOrderStatusDto {
  @IsEnum(ShopOrderStatus)
  status!: ShopOrderStatus;
}

/** Phase 1 admin views: clients, payments, bookings, shop orders, consultations, reviews. */
@Controller("admin")
@Roles(Role.ADMIN)
// Safe default: any endpoint added here without its own permission is super-admin only.
@RequirePermission("team.manage")
@Throttle(TIER_ADMIN_INTERNAL)
export class AdminRecordsController {
  constructor(private readonly records: AdminRecordsService) {}

  @RequirePermission("clients.view")
  @Get("clients")
  clients(@Query("q") q?: string, @Query("page") page?: string) {
    return this.records.listClients(q, Number(page));
  }

  @RequirePermission("clients.view")
  @Get("clients/:id")
  client(@Param("id") id: string) {
    return this.records.getClient(id);
  }

  @RequirePermission("payments.view")
  @Get("payments")
  payments(@Query() f: PaymentFilters & { page?: string }) {
    return this.records.listPayments(f, Number(f.page));
  }

  @RequirePermission("payments.view")
  @Get("payments/export")
  @Throttle(TIER_ADMIN_EXPORT)
  @Header("Content-Type", "text/csv; charset=utf-8")
  @Header("Content-Disposition", 'attachment; filename="tsp-payments.csv"')
  exportPayments(@Query() f: PaymentFilters) {
    return this.records.exportPaymentsCsv(f);
  }

  @RequirePermission("bookings.view")
  @Get("bookings")
  bookings(@Query("view") view?: string, @Query("q") q?: string, @Query("page") page?: string) {
    return this.records.listBookings(view, q, Number(page));
  }

  @RequirePermission("bookings.view")
  @Get("bookings/:id")
  booking(@Param("id") id: string) {
    return this.records.getBooking(id);
  }

  @RequirePermission("orders.manage")
  @Get("orders")
  orders(@Query("status") status?: string, @Query("q") q?: string, @Query("page") page?: string) {
    return this.records.listOrders(status, q, Number(page));
  }

  @RequirePermission("orders.manage")
  @Get("orders/:id")
  order(@Param("id") id: string) {
    return this.records.getOrder(id);
  }

  @RequirePermission("orders.manage")
  @Patch("orders/:id/status")
  updateOrder(@Param("id") id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.records.updateOrderStatus(id, dto.status);
  }

  @RequirePermission("consultations.view")
  @Get("consultations")
  consultations(@Query("status") status?: string, @Query("type") type?: string, @Query("page") page?: string) {
    return this.records.listConsultations(status, type, Number(page));
  }

  @RequirePermission("consultations.view")
  @Get("reviews")
  reviews(@Query("page") page?: string) {
    return this.records.listReviews(Number(page));
  }
}
