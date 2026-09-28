import { Module } from "@nestjs/common";
import { PaymentsService } from "./payments.service";
import { PaymentsController } from "./payments.controller";
import { WalletModule } from "../wallet/wallet.module";
import { LeadsModule } from "../leads/leads.module";

@Module({
  imports: [WalletModule, LeadsModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
