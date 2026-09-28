import { PermissionsGuard } from "./common/guards/permissions.guard";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { BullModule } from '@nestjs/bullmq';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { ConsultationScheduleModule } from "./modules/schedule/schedule.module";
import { AstrologerPanelModule } from "./modules/astrologer-panel/astrologer-panel.module";
import { FinanceModule } from "./modules/finance/finance.module";
import { APP_GUARD } from "@nestjs/core";
import { AuditModule } from "./modules/audit/audit.module";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { OtpModule } from "./modules/otp/otp.module";
import { AstrologersModule } from "./modules/astrologers/astrologers.module";
import { ConsultationsModule } from "./modules/consultations/consultations.module";
import { WalletModule } from "./modules/wallet/wallet.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { HoroscopeModule } from "./modules/horoscope/horoscope.module";
import { KundliModule } from "./modules/kundli/kundli.module";
import { ToolsModule } from "./modules/tools/tools.module";
import { BlogsModule } from "./modules/blogs/blogs.module";
import { AdminModule } from "./modules/admin/admin.module";
import { DatabaseModule } from "./database/database.module";
import { RealtimeModule } from "./realtime/realtime.module";
import { JobsModule } from "./jobs/jobs.module";
import { BookingsModule } from "./modules/bookings/booking.module";
import { SlotsModule } from "./modules/slots/slots.module";
import { ShopModule } from "./modules/shop/shop.module";
import { OrdersModule } from "./modules/orders/orders.module";
import { LeadsModule } from "./modules/leads/leads.module";
import { CampaignModule } from "./modules/campaign/campaign.module";
import { QueueModule } from "./modules/queue/queue.module";
import { PromoModule } from "./modules/promo/promo.module";
import { MailModule } from "./modules/mail/mail.module";
import { GoogleCalendarModule } from "./integrations/google-calendar/google-calendar.module";
import { RedisModule } from "./integrations/redis/redis.module";
import { RedisService } from "./integrations/redis/redis.service";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { RolesGuard } from "./common/guards/roles.guard";
import { CustomThrottlerGuard } from "./common/guards/custom-throttler.guard";
import { ThrottlerStorageRedis } from "./common/throttler/throttler-storage-redis";
import { TIER_AUTHENTICATED_DEFAULT } from "./common/config/rate-limit.config";
import { validateEnv } from "./config/env.validation";
import configuration from "./config/configuration";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnv,
    }),
    ScheduleModule.forRoot(),
    ConsultationScheduleModule,
    AstrologerPanelModule,
    FinanceModule,
    AuditModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const url = configService.get<string>('redis.url');
        const connectionConfig = url 
          ? { url }
          : {
              host: configService.get<string>('redis.host', 'localhost'),
              port: configService.get<number>('redis.port', 6379),
              password: configService.get<string>('redis.password'),
            };

        return {
          connection: connectionConfig,
        };
      },
      inject: [ConfigService],
    }),

    // Global rate limiting — Tier 3 (authenticated default) as the global fallback.
    // Any endpoint without an explicit @Throttle() override gets these limits.
    // Redis-backed storage ensures correctness across multiple instances.
    // We inject RedisService (globally available from RedisModule) and instantiate
    // the storage adapter in the factory, since forRootAsync runs in ThrottlerModule's
    // own DI context where AppModule-level providers aren't visible.
    ThrottlerModule.forRootAsync({
      inject: [RedisService],
      useFactory: (redisService: RedisService) => ({
        throttlers: [
          { name: 'default', ...TIER_AUTHENTICATED_DEFAULT.default },
          { name: 'long', ...TIER_AUTHENTICATED_DEFAULT.long },
        ],
        storage: new ThrottlerStorageRedis(redisService),
      }),
    }),

    DatabaseModule,
    RedisModule,
    AuthModule,
    UsersModule,
    OtpModule,
    AstrologersModule,
    ConsultationsModule,
    WalletModule,
    PaymentsModule,
    NotificationsModule,
    HoroscopeModule,
    KundliModule,
    ToolsModule,
    BlogsModule,
    AdminModule,
    JobsModule,
    RealtimeModule,
    BookingsModule,
    SlotsModule,
    ShopModule,
    OrdersModule,
    LeadsModule,
    CampaignModule,
    QueueModule,
    PromoModule,
    MailModule,
    GoogleCalendarModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
    // CustomThrottlerGuard runs AFTER JwtAuthGuard (registration order matters),
    // so req.user is already populated for per-user rate limiting keying.
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
  ],
})
export class AppModule {}
