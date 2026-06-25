import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ShopService, CreateShopOrderDto } from './shop.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Request } from 'express';

@Controller('shop')
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @Post('orders')
  async createOrder(@Body() data: CreateShopOrderDto, @Req() req: Request) {
    // Note: Since shop is public, users might not be authenticated.
    // If they are, we attach their ID.
    // In a real implementation, you'd extract from an optional JWT guard.
    return this.shopService.createOrder(data);
  }

  @Post('orders/verify')
  async verifyPayment(
    @Body('razorpayOrderId') razorpayOrderId: string,
    @Body('paymentId') paymentId: string,
    @Body('signature') signature: string,
  ) {
    return this.shopService.verifyPayment(razorpayOrderId, paymentId, signature);
  }
}
