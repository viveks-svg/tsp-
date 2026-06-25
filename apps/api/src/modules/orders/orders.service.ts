import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserOrders(email: string) {
    // Fetch Shop Orders
    const shopOrders = await this.prisma.shopOrder.findMany({
      where: { customerEmail: email },
      include: { items: true },
      orderBy: { createdAt: 'desc' }
    });

    // Fetch Service Bookings
    const bookings = await this.prisma.booking.findMany({
      where: { email },
      orderBy: { createdAt: 'desc' }
    });

    return { shopOrders, bookings };
  }
}
