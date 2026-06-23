import { Module } from "@nestjs/common";
import { HoroscopeService } from "./horoscope.service";
import { HoroscopeController } from "./horoscope.controller";

@Module({
  controllers: [HoroscopeController],
  providers: [HoroscopeService],
  exports: [HoroscopeService],
})
export class HoroscopeModule {}
