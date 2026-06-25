import { Module } from "@nestjs/common";
import { PaymentsService } from "./payments.service";
import { PaymentsController } from "./payments.controller";
import { WalletModule } from "../wallet/wallet.module";
import { RazorpayService } from "./razorpay.service";
import { RazorpayWebhookHandler } from "./webhooks/razorpay-webhook.handler";

@Module({
  imports: [WalletModule],
  controllers: [PaymentsController, RazorpayWebhookHandler],
  providers: [PaymentsService, RazorpayService],
  exports: [PaymentsService, RazorpayService],
})
export class PaymentsModule {}
