import { Module } from '@nestjs/common';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { RazorpayWebhookHandler } from './webhooks/razorpay-webhook.handler';
import { PaymentsModule } from '../payments/payments.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { LeadsModule } from '../leads/leads.module';
import { ShopModule } from '../shop/shop.module';
import { GoogleCalendarModule } from '../../integrations/google-calendar/google-calendar.module';

@Module({
  imports: [PaymentsModule, NotificationsModule, LeadsModule, GoogleCalendarModule, ShopModule],
  controllers: [BookingsController, RazorpayWebhookHandler],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
