import { Module } from "@nestjs/common";
import { QueueService } from "./queue.service";
import { QueueController, AdminQueueController, AstrologerQueueController } from "./queue.controller";
import { QueueGateway } from "./queue.gateway";
import { CampaignModule } from "../campaign/campaign.module";
import { WalletModule } from "../wallet/wallet.module";
import { TrtcModule } from "../../integrations/trtc/trtc.module";
import { ConsultationsModule } from "../consultations/consultations.module";

@Module({
  imports: [CampaignModule, WalletModule, TrtcModule, ConsultationsModule],
  controllers: [QueueController, AdminQueueController, AstrologerQueueController],
  providers: [QueueService, QueueGateway],
  exports: [QueueService, QueueGateway],
})
export class QueueModule {}
