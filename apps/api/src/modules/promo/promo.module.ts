import { Module } from '@nestjs/common';
import { PromoService } from './promo.service';
import { AdminPromoController, PromoController } from './promo.controller';
import { PromoGateway } from './promo.gateway';

@Module({
  controllers: [PromoController, AdminPromoController],
  providers: [PromoService, PromoGateway],
  exports: [PromoService, PromoGateway],
})
export class PromoModule {}
