import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator';
import { TIER_FINANCIAL, TIER_PUBLIC_TOOLS } from '../../common/config/rate-limit.config';

@ApiTags('Bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly service: BookingsService) {}

  @Public()
  @Throttle(TIER_FINANCIAL)
  @Post('initiate')
  @ApiOperation({ summary: 'Create booking + Razorpay order' })
  initiateBooking(@Body() dto: CreateBookingDto) {
    return this.service.initiateBooking(dto);
  }

  @Public()
  @Throttle(TIER_FINANCIAL)
  @Post('verify-payment')
  @ApiOperation({ summary: 'Verify Razorpay payment signature and confirm booking' })
  verifyPayment(@Body() dto: VerifyPaymentDto) {
    return this.service.verifyPayment(dto);
  }

  @Public()
  @Throttle(TIER_PUBLIC_TOOLS)
  @Get(':id')
  @ApiOperation({ summary: 'Get booking details by ID' })
  getBooking(@Param('id') id: string) {
    return this.service.getBookingById(id);
  }
}