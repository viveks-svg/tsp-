import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ShopService } from './shop.service';
import { CreateShopOrderDto } from './dto/create-shop-order.dto';
import { Public } from '../../common/decorators/public.decorator';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { TIER_CHECKOUT_HOLD, TIER_FINANCIAL } from '../../common/config/rate-limit.config';
import { Request } from 'express';

class VerifyShopPaymentDto {
  @IsString() @IsNotEmpty() @MaxLength(64) razorpayOrderId!: string;
  @IsString() @IsNotEmpty() @MaxLength(64) paymentId!: string;
  @IsString() @IsNotEmpty() @MaxLength(256) signature!: string;
}

@Public()
@Controller('shop')
@Throttle(TIER_FINANCIAL)
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  /** Guests can check out; a signed-in client's order is linked to their account. */
  @Post('orders')
  @Throttle(TIER_CHECKOUT_HOLD)
  @UseGuards(OptionalJwtAuthGuard)
  async createOrder(@Body() data: CreateShopOrderDto, @Req() req: Request) {
    const user = (req as any).user as { id: string } | null | undefined;
    return this.shopService.createOrder(data, user?.id ?? null);
  }

  @Post('orders/verify')
  async verifyPayment(@Body() dto: VerifyShopPaymentDto) {
    return this.shopService.verifyPayment(dto.razorpayOrderId, dto.paymentId, dto.signature);
  }
}
