import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RazorpayService } from '../payments/razorpay.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { ServiceCategory, UrgencyTier, BookingStatus } from '@prisma/client';
import { SERVICE_PRICES } from '../../common/constants/service-prices';

@Injectable()
export class BookingsService {
  constructor(
    private prisma: PrismaService,
    private razorpay: RazorpayService,
    private notifications: NotificationsService,
  ) {}

  // ── Compute pricing with urgency surcharge ──────────────────────────────────
  computePricing(serviceSlug: string, urgencyTier: UrgencyTier) {
    const basePaise = SERVICE_PRICES[serviceSlug];
    if (!basePaise) throw new BadRequestException(`Unknown service: ${serviceSlug}`);

    let surcharge = 0;
    if (urgencyTier === UrgencyTier.NEXT_DAY) surcharge = Math.round(basePaise * 0.25);
    if (urgencyTier === UrgencyTier.SAME_DAY) surcharge = Math.round(basePaise * 0.5);

    return {
      baseAmountPaise: basePaise,
      surchargeAmountPaise: surcharge,
      totalAmountPaise: basePaise + surcharge,
    };
  }

  // ── Create booking + Razorpay order ────────────────────────────────────────
  async initiateBooking(dto: CreateBookingDto) {
    // Validate scheduled date is not in the past or today (unless SAME_DAY enabled)
    if (dto.scheduledDate) {
      const scheduled = new Date(dto.scheduledDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (dto.urgencyTier === UrgencyTier.STANDARD) {
        const minDate = new Date(today);
        minDate.setDate(today.getDate() + 2);
        if (scheduled < minDate) {
          throw new BadRequestException('Standard bookings require at least 2 days advance notice.');
        }
      }

      if (dto.urgencyTier === UrgencyTier.NEXT_DAY) {
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const dayAfter = new Date(today);
        dayAfter.setDate(today.getDate() + 2);
        if (scheduled < tomorrow || scheduled >= dayAfter) {
          throw new BadRequestException('Next-day bookings must be scheduled for tomorrow.');
        }
      }

      if (dto.urgencyTier === UrgencyTier.SAME_DAY) {
        // Check if same-day is enabled in SlotConfig
        const config = await this.prisma.slotConfig.findUnique({
          where: { date: scheduled },
        });
        if (!config?.sameDayEnabled) {
          throw new BadRequestException('Same-day bookings are not available for this date.');
        }
      }
    }

    const pricing = this.computePricing(dto.serviceSlug, dto.urgencyTier);

    // Create booking record in PENDING_PAYMENT state
    const booking = await this.prisma.booking.create({
      data: {
        serviceCategory: dto.serviceCategory,
        serviceSlug: dto.serviceSlug,
        serviceName: dto.serviceName,
        fullName: dto.fullName,
        email: dto.email,
        phone: dto.phone,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        timeOfBirth: dto.timeOfBirth,
        placeOfBirth: dto.placeOfBirth,
        businessName: dto.businessName,
        businessAddress: dto.businessAddress,
        spaceType: dto.spaceType,
        scheduledDate: dto.scheduledDate ? new Date(dto.scheduledDate) : undefined,
        scheduledSlot: dto.scheduledSlot,
        urgencyTier: dto.urgencyTier,
        notes: dto.notes,
        ...pricing,
        status: BookingStatus.PENDING_PAYMENT,
      },
    });

    // Create Razorpay order
    const rzpOrder = await this.razorpay.createOrder(
      pricing.totalAmountPaise,
      'INR',
      booking.id,
    );

    // Save order ID back to booking
    const updatedBooking = await this.prisma.booking.update({
      where: { id: booking.id },
      data: { razorpayOrderId: rzpOrder.id },
    });

    // Append to payment ledger
    await this.prisma.paymentEvent.create({
      data: {
        bookingId: booking.id,
        eventType: 'ORDER_CREATED',
        amountPaise: pricing.totalAmountPaise,
        rawPayload: rzpOrder as any,
      },
    });

    return {
      bookingId: booking.id,
      razorpayOrderId: rzpOrder.id,
      amount: pricing.totalAmountPaise,
      currency: 'INR',
      pricing,
    };
  }

  // ── Verify payment after Razorpay modal closes ──────────────────────────────
  async verifyPayment(dto: VerifyPaymentDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.status === BookingStatus.CONFIRMED) {
      return { success: true, bookingId: booking.id }; // idempotent
    }

    const isValid = this.razorpay.verifySignature(
      dto.razorpayOrderId,
      dto.razorpayPaymentId,
      dto.razorpaySignature,
    );

    if (!isValid) {
      await this.prisma.paymentEvent.create({
        data: {
          bookingId: booking.id,
          eventType: 'PAYMENT_FAILED',
          razorpayEventId: dto.razorpayPaymentId,
          amountPaise: booking.totalAmountPaise,
        },
      });
      throw new BadRequestException('Payment signature verification failed');
    }

    await this.prisma.$transaction([
      this.prisma.booking.update({
        where: { id: booking.id },
        data: {
          status: BookingStatus.CONFIRMED,
          razorpayPaymentId: dto.razorpayPaymentId,
          razorpaySignature: dto.razorpaySignature,
          confirmedAt: new Date(),
        },
      }),
      this.prisma.paymentEvent.create({
        data: {
          bookingId: booking.id,
          eventType: 'PAYMENT_CAPTURED',
          razorpayEventId: dto.razorpayPaymentId,
          amountPaise: booking.totalAmountPaise,
        },
      }),
    ]);

    // Send notifications
    this.notifications.sendOrderConfirmationEmail(
      booking.email,
      booking.fullName,
      booking.id,
      booking.totalAmountPaise / 100
    );

    this.notifications.sendOrderConfirmationSMS(
      booking.phone,
      booking.fullName,
      booking.id
    );

    return { success: true, bookingId: booking.id };
  }

  async getBookingById(id: string) {
    return this.prisma.booking.findUnique({ where: { id } });
  }
}
