import { Controller, Get, Post, Body } from "@nestjs/common";
import { WalletService } from "./wallet.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AddFundsDto } from "./dto/wallet.dto";

@Controller("wallet")
export class WalletController {
  constructor(private readonly walletService: WalletService) { }

  @Get()
  async getWallet(@CurrentUser() user: any) {
    return this.walletService.getWallet(user.id);
  }

  @Post("add-funds")
  async addFunds(
    @CurrentUser() user: any,
    @Body() dto: AddFundsDto,
  ) {
    return this.walletService.addFunds(user.id, dto.amount);
  }
}
