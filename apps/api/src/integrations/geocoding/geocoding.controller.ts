import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { GeocodingService } from './geocoding.service';
import { Public } from '../../common/decorators/public.decorator';
import { TIER_GEOCODING } from '../../common/config/rate-limit.config';

@ApiTags('geocoding')
@Controller('geocoding')
@Throttle(TIER_GEOCODING)
export class GeocodingController {
  constructor(private readonly geocodingService: GeocodingService) {}

  @Public()
  @Get('search')
  @ApiOperation({ summary: 'Search places for autocomplete' })
  @ApiQuery({ name: 'q', required: true, type: String })
  async searchPlaces(@Query('q') query: string) {
    // Each new query is a paid lookup: short, sensible place names only.
    if (!query || query.trim().length < 2 || query.length > 100) return [];
    return this.geocodingService.searchPlaces(query);
  }
}
