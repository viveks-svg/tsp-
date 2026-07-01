import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { BullModule } from '@nestjs/bullmq';
import { APP_GUARD } from "@nestjs/core";
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
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { RolesGuard } from "./common/guards/roles.guard";
import configuration from "./config/configuration";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('redis.host', 'localhost'),
          port: configService.get<number>('redis.port', 6379),
        },
      }),
      inject: [ConfigService],
    }),
    DatabaseModule,
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
  ],
})
export class AppModule {}
