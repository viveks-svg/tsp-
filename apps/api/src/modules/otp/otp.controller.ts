import { Controller, Post, Body, HttpCode, HttpStatus } from "@nestjs/common";
import { OtpService } from "./otp.service";
import { SendOtpDto, VerifyOtpDto } from "./dto/otp.dto";
import { Public } from "../../common/decorators/public.decorator";

@Controller("otp")
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  @Public()
  @Post("send")
  @HttpCode(HttpStatus.OK)
  async sendOtp(@Body() dto: SendOtpDto) {
    return this.otpService.sendOtp(dto);
  }

  @Public()
  @Post("verify")
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.otpService.verifyOtp(dto);
  }
}
