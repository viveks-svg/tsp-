import { Controller, Get, Post, Body } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { PromoService } from './promo.service';

@Controller('promo')
export class PromoController {
  constructor(private readonly promoService: PromoService) {}

  @Public()
  @Get('active')
  async getActivePromos() {
    console.log('Fetching active promos...');
    return this.promoService.getActivePromos();
  }

  @Public()
  @Post('create')
  async createPromo(@Body() data: any) {
    const promo = await this.promoService.createPromo(data);
    await this.promoService.broadcastActivePromos();
    return promo;
  }
}
