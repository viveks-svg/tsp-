import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

const plain = (phone: string) => phone.replace(/^\+91/, '').replace(/^\+/, '');

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * A client's bookings and shop orders. Anything placed while signed in is
   * theirs. Guest orders are matched by email or phone only when the account
   * has proved it owns them (a confirmed email, or a phone verified by SMS code) —
   * otherwise signing up with someone's email would reveal their bookings.
   */
  async getUserOrders(requester: { id: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: requester.id },
      select: { id: true, email: true, phone: true, emailVerifiedAt: true, phoneVerifiedAt: true },
    });
    if (!user) return { shopOrders: [], bookings: [] };

    const emailVerified = !!user.email && !!user.emailVerifiedAt;
    const phoneVerified = !!user.phone && !!user.phoneVerifiedAt;
    const phones = user.phone ? [user.phone, plain(user.phone)] : [];

    const shopOrders = await this.prisma.shopOrder.findMany({
      where: {
        OR: [
          { userId: user.id },
          ...(emailVerified ? [{ customerEmail: { equals: user.email!, mode: 'insensitive' as const } }] : []),
          ...(phoneVerified ? [{ customerPhone: { in: phones } }] : []),
        ],
      },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });

    const bookings = await this.prisma.booking.findMany({
      where: {
        OR: [
          { userId: user.id },
          ...(emailVerified ? [{ email: { equals: user.email!, mode: 'insensitive' as const } }] : []),
          ...(phoneVerified ? [{ phone: { in: phones } }] : []),
        ],
      },
      omit: { razorpaySignature: true },
      orderBy: { createdAt: 'desc' },
    });

    return { shopOrders, bookings };
  }
}
