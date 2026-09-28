import { NotFoundException } from '@nestjs/common';
import { PromoDto, UpdatePromoDto } from './promo.dto';
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

  async listAll() {
    return this.prisma.promoEvent.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async createPromo(data: PromoDto) {
    const promo = await this.prisma.promoEvent.create({
      data: {
        title: data.title.trim(),
        description: data.description.trim(),
        actionText: data.actionText?.trim() || null,
        actionUrl: data.actionUrl || null,
        imageUrl: data.imageUrl || null,
        isActive: data.isActive ?? true,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
    });
    await this.broadcastActivePromos();
    return promo;
  }

  async updatePromo(id: string, data: UpdatePromoDto) {
    await this.find(id);
    const promo = await this.prisma.promoEvent.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title.trim() }),
        ...(data.description !== undefined && { description: data.description.trim() }),
        ...(data.actionText !== undefined && { actionText: data.actionText.trim() || null }),
        ...(data.actionUrl !== undefined && { actionUrl: data.actionUrl || null }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl || null }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.expiresAt !== undefined && { expiresAt: data.expiresAt ? new Date(data.expiresAt) : null }),
      },
    });
    await this.broadcastActivePromos();
    return promo;
  }

  async deletePromo(id: string) {
    await this.find(id);
    await this.prisma.promoEvent.delete({ where: { id } });
    await this.broadcastActivePromos();
    return { success: true };
  }

  private async find(id: string) {
    const promo = await this.prisma.promoEvent.findUnique({ where: { id } });
    if (!promo) throw new NotFoundException('Promo not found.');
    return promo;
  }
}
