import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { GeocodingService } from './geocoding.service';
import { Public } from '../../common/decorators/public.decorator';
import { TIER_PUBLIC_TOOLS } from '../../common/config/rate-limit.config';

@ApiTags('geocoding')
@Controller('geocoding')
@Throttle(TIER_PUBLIC_TOOLS)
export class GeocodingController {
  constructor(private readonly geocodingService: GeocodingService) {}

  @Public()
  @Get('search')
  @ApiOperation({ summary: 'Search places for autocomplete' })
  @ApiQuery({ name: 'q', required: true, type: String })
  async searchPlaces(@Query('q') query: string) {
    if (!query || query.length < 2) return [];
    return this.geocodingService.searchPlaces(query);
  }
}
