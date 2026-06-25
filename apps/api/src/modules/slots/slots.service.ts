import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

const DEFAULT_SLOTS = [
  '10:00 – 11:00 AM',
  '11:30 AM – 12:30 PM',
  '02:00 – 03:00 PM',
  '04:00 – 05:00 PM',
];

@Injectable()
export class SlotsService {
  constructor(private prisma: PrismaService) {}

  async getAvailableSlots(dateStr: string) {
    const date = new Date(dateStr);
    const config = await this.prisma.slotConfig.findUnique({ where: { date } });

    if (config?.isBlocked) return { available: false, slots: [] };

    const slots: string[] = config?.slots
      ? (config.slots as string[])
      : DEFAULT_SLOTS;

    // Subtract already-booked slots for that date
    const booked = await this.prisma.booking.findMany({
      where: {
        scheduledDate: date,
        status: { in: ['CONFIRMED', 'PENDING_PAYMENT'] },
      },
      select: { scheduledSlot: true },
    });

    const bookedSlots = new Set(booked.map((b: { scheduledSlot: string | null }) => b.scheduledSlot));
    const available = slots.filter((s) => !bookedSlots.has(s as string));

    return {
      available: available.length > 0,
      slots: available,
      sameDayEnabled: config?.sameDayEnabled ?? false,
    };
  }
}
