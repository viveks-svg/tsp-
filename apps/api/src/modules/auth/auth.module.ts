import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AuthService } from "./auth.service";
import { AccountSecurityService } from "./account-security.service";
import { AccountSecurityController, AdminAccountSecurityController } from "./account-security.controller";
import { AuthController } from "./auth.controller";
import { JwtStrategy } from "./jwt.strategy";
import { FirebaseModule } from "../firebase/firebase.module";
import { MailModule } from "../mail/mail.module";

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>("jwt.secret"),
        signOptions: {
          expiresIn: (configService.get<string>("jwt.expiration") || "7d") as any,
        },
      }),
    }),
    FirebaseModule,
    MailModule,
  ],
  controllers: [AuthController, AccountSecurityController, AdminAccountSecurityController],
  providers: [AuthService, AccountSecurityService, JwtStrategy],
  exports: [AuthService, AccountSecurityService, PassportModule, JwtModule],
})
export class AuthModule {}

