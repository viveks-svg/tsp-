import { EarningsService } from '../finance/earnings.service';
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RazorpayService } from '../payments/razorpay.service';
import { NotificationsService } from '../notifications/notifications.service';
import { LeadsService } from '../leads/leads.service';
import { GoogleCalendarService } from '../../integrations/google-calendar/google-calendar.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { ServiceCategory, UrgencyTier, BookingStatus } from '@prisma/client';
import { SERVICE_PRICES } from '../../common/constants/service-prices';
import { ScheduleService } from '../schedule/schedule.service';
import { istToUtc, parseSlotLabel } from '../schedule/slot-label';

@Injectable()
export class BookingsService {
  constructor(
    private earnings: EarningsService,
    private prisma: PrismaService,
    private razorpay: RazorpayService,
    private notifications: NotificationsService,
    private leads: LeadsService,
    private googleCalendar: GoogleCalendarService,
    private schedule: ScheduleService,
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
  async initiateBooking(dto: CreateBookingDto, userId: string | null = null) {
    // Closed the payment window and pressed Pay again? Carry on with the same
    // checkout (same slot, same Razorpay order) instead of refusing their own hold.
    const resumed = await this.resumeOpenCheckout(dto, userId);
    if (resumed) return resumed;

    // Unpaid checkouts hold a slot for a while: a person can have only a couple open at once.
    const openCheckouts = await this.prisma.booking.count({
      where: {
        status: BookingStatus.PENDING_PAYMENT,
        createdAt: { gte: new Date(Date.now() - 30 * 60 * 1000) },
        OR: [{ email: dto.email }, { phone: dto.phone }],
      },
    });
    if (openCheckouts >= 2) {
      throw new BadRequestException('You already have a checkout in progress. Please complete it or try again in a few minutes.');
    }

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

    // The slot must be one Dr. Pradeep's schedule offers and nobody else holds.
    if (dto.scheduledDate && dto.scheduledSlot) {
      const bookable = await this.schedule.isBookable(dto.scheduledDate.slice(0, 10), dto.scheduledSlot);
      if (!bookable) {
        throw new BadRequestException('That time is no longer available. Please choose another slot.');
      }
    }

    const pricing = this.computePricing(dto.serviceSlug, dto.urgencyTier);

    // Create booking record in PENDING_PAYMENT state
    const booking = await this.prisma.booking.create({
      data: {
        userId,
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
      // Checkout must open with the key of the account that created the order.
      key: await this.razorpay.getKeyId(),
      amount: pricing.totalAmountPaise,
      currency: 'INR',
      pricing,
      leadSessionId: dto.leadSessionId || null,
    };
  }

  /** The same person's unpaid checkout for exactly this service and time, still holding its slot. */
  private async resumeOpenCheckout(dto: CreateBookingDto, userId: string | null) {
    const pricing = this.computePricing(dto.serviceSlug, dto.urgencyTier);
    const open = await this.prisma.booking.findFirst({
      where: {
        status: BookingStatus.PENDING_PAYMENT,
        createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) },
        OR: [{ email: dto.email }, { phone: dto.phone }],
        serviceSlug: dto.serviceSlug,
        urgencyTier: dto.urgencyTier,
        scheduledDate: dto.scheduledDate ? new Date(dto.scheduledDate) : null,
        scheduledSlot: dto.scheduledSlot ?? null,
        totalAmountPaise: pricing.totalAmountPaise,
        razorpayOrderId: { not: null },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!open) return null;
    // Keep what they typed this time.
    await this.prisma.booking.update({
      where: { id: open.id },
      data: {
        userId: open.userId ?? userId,
        fullName: dto.fullName,
        email: dto.email,
        phone: dto.phone,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        timeOfBirth: dto.timeOfBirth,
        placeOfBirth: dto.placeOfBirth,
        businessName: dto.businessName,
        businessAddress: dto.businessAddress,
        spaceType: dto.spaceType,
        notes: dto.notes,
      },
    });
    return {
      bookingId: open.id,
      razorpayOrderId: open.razorpayOrderId!,
      key: await this.razorpay.getKeyId(),
      amount: pricing.totalAmountPaise,
      currency: 'INR',
      pricing,
      leadSessionId: dto.leadSessionId || null,
    };
  }

  // ── Verify payment after Razorpay modal closes ──────────────────────────────
  async verifyPayment(dto: VerifyPaymentDto) {
    const booking = await this.prisma.booking.findUnique({ where: { id: dto.bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');

    // The payment must be for THIS booking's Razorpay order (created by us, for its price).
    if (!booking.razorpayOrderId || dto.razorpayOrderId !== booking.razorpayOrderId) {
      throw new BadRequestException('This payment does not belong to this booking.');
    }
    const valid = await this.razorpay.verifySignature(booking.razorpayOrderId, dto.razorpayPaymentId, dto.razorpaySignature);
    if (!valid) {
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

    const outcome = await this.confirmPaid(booking.id, booking.razorpayOrderId, dto.razorpayPaymentId, {
      signature: dto.razorpaySignature,
    });
    if (outcome === 'NOT_PENDING') {
      throw new BadRequestException('This booking is no longer awaiting payment. Please contact the TSP office.');
    }
    if (outcome === 'CONFIRMED') this.tryMarkLeadConverted(dto.leadSessionId, booking.id);
    return { success: true, bookingId: booking.id };
  }

  /**
   * Marks a booking paid — once. Used by the checkout callback and the Razorpay
   * webhook, whichever arrives first; the other finds it already done.
   * Only a PENDING_PAYMENT booking for this exact order can be confirmed, so a
   * payment can't be reused for another booking or revive a cancelled one.
   */
  async confirmPaid(
    bookingId: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    extra: { signature?: string; rawPayload?: unknown } = {},
  ): Promise<'CONFIRMED' | 'ALREADY_CONFIRMED' | 'NOT_PENDING'> {
    let claimed: { count: number };
    try {
      claimed = await this.prisma.booking.updateMany({
        where: { id: bookingId, razorpayOrderId, status: BookingStatus.PENDING_PAYMENT },
        data: {
          status: BookingStatus.CONFIRMED,
          razorpayPaymentId,
          razorpaySignature: extra.signature ?? null,
          confirmedAt: new Date(),
        },
      });
    } catch (e) {
      // This payment already confirmed another booking.
      if ((e as { code?: string }).code === 'P2002') return 'NOT_PENDING';
      throw e;
    }
    const booking = await this.prisma.booking.findUniqueOrThrow({ where: { id: bookingId } });
    if (claimed.count === 0) {
      return booking.razorpayPaymentId === razorpayPaymentId ? 'ALREADY_CONFIRMED' : 'NOT_PENDING';
    }

    await this.prisma.paymentEvent.create({
      data: {
        bookingId: booking.id,
        eventType: 'PAYMENT_CAPTURED',
        razorpayEventId: razorpayPaymentId,
        amountPaise: booking.totalAmountPaise,
        ...(extra.rawPayload ? { rawPayload: extra.rawPayload as any } : {}),
      },
    });

    let meetLink: string | undefined;
    if (booking.scheduledDate) {
      try {
        // The invite covers the chosen session (IST); without a readable slot, fall back to a 1-hour block.
        const dateStr = booking.scheduledDate.toISOString().slice(0, 10);
        const slot = parseSlotLabel(booking.scheduledSlot);
        const scheduledStart = slot ? istToUtc(dateStr, slot.start) : new Date(booking.scheduledDate);
        const scheduledEnd = slot ? istToUtc(dateStr, slot.end) : new Date(scheduledStart.getTime() + 60 * 60 * 1000);
        const meetDetails = await this.googleCalendar.createEventWithMeetLink(
          `TSP Booking: ${booking.serviceName} for ${booking.fullName}`,
          `Booking ID: ${booking.id}\nService: ${booking.serviceName}`,
          scheduledStart,
          scheduledEnd,
          [booking.email],
        );
        if (meetDetails) {
          meetLink = meetDetails.meetLink;
          await this.prisma.booking.update({
            where: { id: booking.id },
            data: { meetLink: meetDetails.meetLink, calendarEventId: meetDetails.eventId },
          });
        }
      } catch (e) {
        console.error('Could not create the Meet invite', e);
      }
    }

    // The astrologer's share of this session (less commission), once.
    await this.earnings.creditBooking(booking.id);

    // The client's confirmation (email; WhatsApp once a sender is configured)
    void this.notifications.sendBookingConfirmation({ ...booking, meetLink: meetLink ?? booking.meetLink });

    // Send push notification to admin(s)
    this.notifications.sendAdminBookingNotification(
      booking.fullName,
      booking.serviceName,
      booking.id,
      booking.scheduledDate,
    );

    // Persist in-app notification for admin(s) and for Dr. Pradeep (the session is his)
    try {
      const [admins, provider] = await Promise.all([
        this.prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } }),
        this.schedule.getProvider(),
      ]);
      if (provider) admins.push({ id: provider.userId });
      const dateStr = booking.scheduledDate
        ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(booking.scheduledDate))
        : 'TBD';
      for (const admin of admins) {
        await this.notifications.createNotification(
          admin.id,
          'NEW_BOOKING',
          'New Booking Received',
          `${booking.fullName} booked ${booking.serviceName} for ${dateStr}`,
          { bookingId: booking.id, customerName: booking.fullName, serviceName: booking.serviceName, scheduledDate: dateStr },
        );
      }
    } catch (e) {
      console.error('Failed to persist admin notification', e);
    }

    return 'CONFIRMED';
  }

  // ── Mark lead as converted after successful payment ─────────────────────────
  // Called internally after verifyPayment succeeds. Fire-and-forget — booking
  // confirmation is not blocked by lead tracking.
  private async tryMarkLeadConverted(leadSessionId: string | undefined, bookingId: string) {
    if (!leadSessionId) return;
    try {
      await this.leads.markConverted({ sessionId: leadSessionId, bookingId });
    } catch (e) {
      // Non-critical — log but don't fail the booking confirmation
      console.error('Failed to mark lead as converted', e);
    }
  }

}
