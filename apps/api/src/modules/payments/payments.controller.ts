import { Controller, Get, Post, Body, Headers, Req, HttpCode, HttpStatus } from "@nestjs/common";
import { Throttle, SkipThrottle } from "@nestjs/throttler";
import { PaymentsService } from "./payments.service";
import { CreatePaymentOrderDto, VerifyPaymentDto, RefundOrderDto } from "./dto/payments.dto";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { TIER_FINANCIAL, TIER_FINANCIAL_CREATE, TIER_ADMIN_INTERNAL } from "../../common/config/rate-limit.config";
import { Role } from "@prisma/client";
import { Request } from "express";

@Controller("payments")
@Throttle(TIER_FINANCIAL)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get("orders")
  async getOrders(@CurrentUser() user: any) {
    return this.paymentsService.getOrders(user.id);
  }

  @Throttle(TIER_FINANCIAL_CREATE)
  @Post("orders")
  async createOrder(
    @CurrentUser() user: any,
    @Body() dto: CreatePaymentOrderDto,
  ) {
    return this.paymentsService.createOrder(user.id, dto);
  }

  @Post("verify")
  @HttpCode(HttpStatus.OK)
  async verifyPayment(
    @CurrentUser() user: any,
    @Body() dto: VerifyPaymentDto,
  ) {
    return this.paymentsService.verifyPayment(
      user.id,
      dto.orderId,
      dto.gatewayTransactionId,
      dto.signature,
    );
  }

  // Razorpay webhook — excluded from throttling.
  // Authenticated via x-razorpay-signature header verification, not rate limiting.
  // Razorpay retries failed webhooks — blocking retries would cause payment state
  // desync. This route must always be accessible.
  @SkipThrottle()
  @Public()
  @Post("webhook")
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Headers("x-razorpay-signature") signature: string,
    @Req() req: Request,
  ) {
    // If body is already parsed by body-parser middleware, stringify it
    const rawBody = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    return this.paymentsService.handleWebhook(rawBody, signature);
  }

  @Throttle(TIER_ADMIN_INTERNAL)
  @Post("refunds")
  @Roles(Role.ADMIN)
  async processRefund(@Body() dto: RefundOrderDto) {
    return this.paymentsService.processRefund(dto);
  }
}
