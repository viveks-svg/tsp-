import { Controller, Get, Post, Body, Headers, Req, HttpCode, HttpStatus } from "@nestjs/common";
import { PaymentsService } from "./payments.service";
import { CreatePaymentOrderDto, VerifyPaymentDto, RefundOrderDto } from "./dto/payments.dto";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "@prisma/client";
import { Request } from "express";

@Controller("payments")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get("orders")
  async getOrders(@CurrentUser() user: any) {
    return this.paymentsService.getOrders(user.id);
  }

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

  @Post("refunds")
  @Roles(Role.ADMIN)
  async processRefund(@Body() dto: RefundOrderDto) {
    return this.paymentsService.processRefund(dto);
  }
}
