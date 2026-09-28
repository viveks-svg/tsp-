import { Global, Module } from "@nestjs/common";
import { WalletModule } from "../wallet/wallet.module";
import { RazorpayService } from "../payments/razorpay.service";
import { FinanceSettingsService } from "./finance-settings.service";
import { EarningsService } from "./earnings.service";
import { MoneyActionsService } from "./money-actions.service";
import { FinanceSettingsController, MoneyActionsController } from "./finance.controller";

/**
 * Money settings, the Razorpay client, astrologer earnings and money actions.
 * Global because payments, bookings, shop, consultations and the queue use it.
 */
@Global()
@Module({
  imports: [WalletModule],
  controllers: [FinanceSettingsController, MoneyActionsController],
  providers: [FinanceSettingsService, RazorpayService, EarningsService, MoneyActionsService],
  exports: [FinanceSettingsService, RazorpayService, EarningsService, MoneyActionsService],
})
export class FinanceModule {}
