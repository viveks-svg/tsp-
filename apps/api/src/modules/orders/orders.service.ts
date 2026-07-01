import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserOrders(user: { id: string, email?: string, phone?: string }) {
    if (!user.id && !user.email && !user.phone) {
      return { shopOrders: [], bookings: [] };
    }

    // Match Shop Orders by userId, customerEmail, or customerPhone
    const shopConds: any[] = [];
    if (user.id) shopConds.push({ userId: user.id });
    if (user.email) shopConds.push({ customerEmail: user.email });
    if (user.phone) shopConds.push({ customerPhone: user.phone });

    const shopOrders = await this.prisma.shopOrder.findMany({
      where: shopConds.length > 0 ? { OR: shopConds } : { id: 'impossible' },
      include: { items: true },
      orderBy: { createdAt: 'desc' }
    });

    // Match Bookings by email or phone (Booking model doesn't have userId yet)
    const bookingConds: any[] = [];
    if (user.email) bookingConds.push({ email: user.email });
    if (user.phone) bookingConds.push({ phone: user.phone });

    const bookings = await this.prisma.booking.findMany({
      where: bookingConds.length > 0 ? { OR: bookingConds } : { id: 'impossible' },
      orderBy: { createdAt: 'desc' }
    });

    return { shopOrders, bookings };
  }
}
