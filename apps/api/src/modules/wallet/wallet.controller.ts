import { Controller, Get, Post, Body } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { WalletService } from "./wallet.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AddFundsDto } from "./dto/wallet.dto";
import { TIER_FINANCIAL_CREATE } from "../../common/config/rate-limit.config";

@Controller("wallet")
export class WalletController {
  constructor(private readonly walletService: WalletService) { }

  @Get()
  async getWallet(@CurrentUser() user: any) {
    return this.walletService.getWallet(user.id);
  }

  @Throttle(TIER_FINANCIAL_CREATE)
  @Post("add-funds")
  async addFunds(
    @CurrentUser() user: any,
    @Body() dto: AddFundsDto,
  ) {
    return this.walletService.addFunds(user.id, dto.amount);
  }
}

