import { Controller, Post, Body, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ShopService } from './shop.service';
import { CreateShopOrderDto } from './dto/create-shop-order.dto';
import { Public } from '../../common/decorators/public.decorator';
import { TIER_FINANCIAL } from '../../common/config/rate-limit.config';
import { Request } from 'express';

@Public()
@Controller('shop')
@Throttle(TIER_FINANCIAL)
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
