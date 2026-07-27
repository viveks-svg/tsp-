import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PromoGateway } from './promo.gateway';

@Injectable()
export class PromoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly promoGateway: PromoGateway
  ) {}

  async getActivePromos() {
    return this.prisma.promoEvent.findMany({
      where: {
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async broadcastActivePromos() {
    const promos = await this.getActivePromos();
    this.promoGateway.broadcastPromos(promos);
  }

  async createPromo(data: any) {
    return this.prisma.promoEvent.create({
      data: {
        title: data.title,
        description: data.description,
        actionText: data.actionText,
        actionUrl: data.actionUrl,
        imageUrl: data.imageUrl,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      }
    });
  }
}
