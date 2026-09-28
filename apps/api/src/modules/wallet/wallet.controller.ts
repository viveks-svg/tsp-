import { Controller, Get } from "@nestjs/common";
import { WalletService } from "./wallet.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

/**
 * A client's wallet. Money only enters through Razorpay (POST /payments/orders
 * + /payments/verify) or an approved money action in the admin panel.
 */
@Controller("wallet")
export class WalletController {
  constructor(private readonly walletService: WalletService) { }

  @Get()
  async getWallet(@CurrentUser() user: any) {
    return this.walletService.getWallet(user.id);
  }
}
