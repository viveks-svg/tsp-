import { Module } from "@nestjs/common";
import { KundliService } from "./kundli.service";
import { KundliController } from "./kundli.controller";

@Module({
  controllers: [KundliController],
  providers: [KundliService],
  exports: [KundliService],
})
export class KundliModule {}
