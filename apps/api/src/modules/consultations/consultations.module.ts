import { Module } from "@nestjs/common";
import { ConsultationsService } from "./consultations.service";
import { ConsultationsController } from "./consultations.controller";
import { CallService } from "./call.service";
import { WalletModule } from "../wallet/wallet.module";
import { TrtcModule } from "../../integrations/trtc/trtc.module";

@Module({
  imports: [WalletModule, TrtcModule],
  controllers: [ConsultationsController],
  providers: [ConsultationsService, CallService],
  exports: [ConsultationsService, CallService],
})
export class ConsultationsModule {}


