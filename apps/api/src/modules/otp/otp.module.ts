import { Module } from "@nestjs/common";
import { OtpService } from "./otp.service";

/** Not exposed over HTTP: the website signs in by phone through Firebase. */
@Module({
  providers: [OtpService],
  exports: [OtpService],
})
export class OtpModule {}
