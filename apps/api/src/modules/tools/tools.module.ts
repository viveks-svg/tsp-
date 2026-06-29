import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { ToolsService } from "./tools.service";
import { ToolsController } from "./tools.controller";
import { EphemerisService } from "./ephemeris.service";
import { EphemerisController } from "./ephemeris.controller";
import { GeocodingService } from "../../integrations/geocoding/geocoding.service";
import { GeocodingController } from "../../integrations/geocoding/geocoding.controller";
import { RedisService } from "../../integrations/redis/redis.service";

@Module({
  imports: [HttpModule],
  controllers: [ToolsController, EphemerisController, GeocodingController],
  providers: [ToolsService, EphemerisService, GeocodingService, RedisService],
  exports: [ToolsService, EphemerisService],
})
export class ToolsModule {}
