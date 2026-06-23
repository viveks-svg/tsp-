import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { SendOtpDto, VerifyOtpDto } from "./dto/otp.dto";

@Injectable()
export class OtpService {
  constructor(private readonly prisma: PrismaService) {}

  async sendOtp(dto: SendOtpDto) {
    const { identifier, purpose } = dto;

    // Check if there is an OTP requested in the last 60 seconds (resend rate limit)
    const oneMinuteAgo = new Date(Date.now() - 60000);
    const recentOtp = await this.prisma.oTPVerification.findFirst({
      where: {
        identifier,
        purpose,
        createdAt: { gte: oneMinuteAgo },
      },
    });

    if (recentOtp) {
      throw new BadRequestException("Please wait 60 seconds before requesting another OTP");
    }

    // Generate 6 digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

    // Save to DB
    await this.prisma.oTPVerification.create({
      data: {
        identifier,
        code, // Stored plain text for development simplicity and direct visibility
        purpose,
        expiresAt,
      },
    });

    // In dev, we log to console
    console.log(`[OTP Verification] Code for ${identifier} (${purpose}): ${code}`);

    return {
      success: true,
      message: "OTP sent successfully (Logged to console in development)",
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const { identifier, code, purpose } = dto;

    const otpRecord = await this.prisma.oTPVerification.findFirst({
      where: {
        identifier,
        purpose,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!otpRecord) {
      throw new BadRequestException("No active OTP found for this identifier/purpose or code expired");
    }

    if (otpRecord.attempts >= 5) {
      throw new BadRequestException("This OTP has been locked due to too many failed attempts");
    }

    if (otpRecord.code !== code) {
      const updatedAttempts = otpRecord.attempts + 1;
      await this.prisma.oTPVerification.update({
        where: { id: otpRecord.id },
        data: { attempts: updatedAttempts },
      });

      if (updatedAttempts >= 5) {
        throw new BadRequestException("Too many failed attempts. This OTP is now locked");
      }

      throw new UnauthorizedException(
        `Invalid verification code. ${5 - updatedAttempts} attempts remaining`,
      );
    }

    // Mark as used
    await this.prisma.oTPVerification.update({
      where: { id: otpRecord.id },
      data: { isUsed: true },
    });

    return {
      success: true,
      message: "OTP verified successfully",
    };
  }
}
