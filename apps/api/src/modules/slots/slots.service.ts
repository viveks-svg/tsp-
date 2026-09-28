import { Injectable } from '@nestjs/common';
import { ScheduleService } from '../schedule/schedule.service';

/** Bookable session slots for a date, generated from Dr. Pradeep's schedule. */
@Injectable()
export class SlotsService {
  constructor(private readonly schedule: ScheduleService) {}

  async getAvailableSlots(dateStr: string) {
    const { available, slots, sameDayEnabled } = await this.schedule.getBookableSlots(dateStr);
    return { available, slots, sameDayEnabled };
  }
}
