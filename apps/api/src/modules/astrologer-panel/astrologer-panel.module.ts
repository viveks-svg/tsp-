import { Module } from "@nestjs/common";
import { AstrologerPanelController } from "./astrologer-panel.controller";
import { AstrologerPanelService } from "./astrologer-panel.service";

@Module({
  controllers: [AstrologerPanelController],
  providers: [AstrologerPanelService],
})
export class AstrologerPanelModule {}
