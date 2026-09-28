import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator';
import { TIER_CHECKOUT_HOLD, TIER_FINANCIAL } from '../../common/config/rate-limit.config';

@ApiTags('Bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly service: BookingsService) {}

  @Public()
  @Throttle(TIER_CHECKOUT_HOLD)
  @Post('initiate')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Create booking + Razorpay order' })
  initiateBooking(@Body() dto: CreateBookingDto, @Req() req: any) {
    // Guests can book; a signed-in client's booking is linked to their account.
    return this.service.initiateBooking(dto, req.user?.id ?? null);
  }

  @Public()
  @Throttle(TIER_FINANCIAL)
  @Post('verify-payment')
  @ApiOperation({ summary: 'Verify Razorpay payment signature and confirm booking' })
  verifyPayment(@Body() dto: VerifyPaymentDto) {
    return this.service.verifyPayment(dto);
  }
}