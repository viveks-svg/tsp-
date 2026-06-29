import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { GeocodingService } from './geocoding.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('geocoding')
@Controller('geocoding')
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
