import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly service: BookingsService) {}

  @Public()
  @Post('initiate')
  @ApiOperation({ summary: 'Create booking + Razorpay order' })
  initiateBooking(@Body() dto: CreateBookingDto) {
    return this.service.initiateBooking(dto);
  }

  @Public()
  @Post('verify-payment')
  @ApiOperation({ summary: 'Verify Razorpay payment signature and confirm booking' })
  verifyPayment(@Body() dto: VerifyPaymentDto) {
    return this.service.verifyPayment(dto);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get booking details by ID' })
  getBooking(@Param('id') id: string) {
    return this.service.getBookingById(id);
  }
}