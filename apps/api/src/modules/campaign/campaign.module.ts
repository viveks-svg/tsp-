import { Module } from "@nestjs/common";
import { CampaignService } from "./campaign.service";
import { AdminCampaignController, PublicCampaignController } from "./campaign.controller";

@Module({
  controllers: [AdminCampaignController, PublicCampaignController],
  providers: [CampaignService],
  exports: [CampaignService],
})
export class CampaignModule {}
