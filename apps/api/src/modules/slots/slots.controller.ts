import { Controller, Get, Query } from '@nestjs/common';
import { SlotsService } from './slots.service';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Slots')
@Controller('slots')
export class SlotsController {
  constructor(private readonly slotsService: SlotsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get available slots for a given date' })
  @ApiQuery({ name: 'date', required: true, type: String })
  async getAvailableSlots(@Query('date') dateStr: string) {
    if (!dateStr) {
      return { available: false, slots: [], sameDayEnabled: false };
    }
    return this.slotsService.getAvailableSlots(dateStr);
  }
}
