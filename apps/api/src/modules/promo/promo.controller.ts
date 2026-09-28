import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Role } from '@prisma/client';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { TIER_ADMIN_INTERNAL } from '../../common/config/rate-limit.config';
import { PromoService } from './promo.service';
import { PromoDto, UpdatePromoDto } from './promo.dto';

/** The website asks which promo popups are live. */
@Controller('promo')
export class PromoController {
  constructor(private readonly promoService: PromoService) {}

  @Public()
  @Get('active')
  async getActivePromos() {
    return this.promoService.getActivePromos();
  }
}

/** Admins create and manage promo popups (used to be a public endpoint). */
@Controller('admin/promos')
@Roles(Role.ADMIN)
@RequirePermission('content.manage')
@Throttle(TIER_ADMIN_INTERNAL)
export class AdminPromoController {
  constructor(private readonly promoService: PromoService) {}

  @Get()
  list() {
    return this.promoService.listAll();
  }

  @Post()
  create(@Body() dto: PromoDto) {
    return this.promoService.createPromo(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePromoDto) {
    return this.promoService.updatePromo(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.promoService.deletePromo(id);
  }
}
