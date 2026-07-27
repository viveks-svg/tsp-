import { Module } from '@nestjs/common';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { PaymentsModule } from '../payments/payments.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { LeadsModule } from '../leads/leads.module';
import { GoogleCalendarModule } from '../../integrations/google-calendar/google-calendar.module';

@Module({
  imports: [PaymentsModule, NotificationsModule, LeadsModule, GoogleCalendarModule],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
