import { Module } from '@nestjs/common';
import { PromoService } from './promo.service';
import { PromoController } from './promo.controller';
import { PromoGateway } from './promo.gateway';

@Module({
  controllers: [PromoController],
  providers: [PromoService, PromoGateway],
  exports: [PromoService, PromoGateway],
})
export class PromoModule {}
