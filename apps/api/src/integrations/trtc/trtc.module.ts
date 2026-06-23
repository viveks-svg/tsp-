import { Module } from "@nestjs/common";
import { TrtcService } from "./trtc.service";

@Module({
  providers: [TrtcService],
  exports: [TrtcService],
})
export class TrtcModule {}
