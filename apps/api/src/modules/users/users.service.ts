import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { UpdateProfileDto } from "./dto/update-profile.dto";

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    let profile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      profile = await this.prisma.userProfile.create({
        data: { userId },
      });
    }

    return profile;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.prisma.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        timezone: dto.timezone,
        preferredLanguage: dto.preferredLanguage,
        dob: dto.dob ? new Date(dto.dob) : undefined,
        tob: dto.tob,
        pob: dto.pob,
        gender: dto.gender,
      },
      update: {
        timezone: dto.timezone,
        preferredLanguage: dto.preferredLanguage,
        dob: dto.dob ? new Date(dto.dob) : undefined,
        tob: dto.tob,
        pob: dto.pob,
        gender: dto.gender,
      },
    });
  }

  async registerFcmToken(userId: string, token: string) {
    if (!token || typeof token !== "string") {
      this.logger.warn(`Invalid FCM token registration attempt for user ${userId}`);
      return { success: false, message: "Invalid FCM token" };
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { fcmTokens: true },
    });

    if (!user) {
      this.logger.warn(`FCM token registration failed: User ${userId} not found`);
      return { success: false, message: "User not found" };
    }

    this.logger.log(`[Token Wipe] Found ${user.fcmTokens.length} existing tokens for user ${userId}. Wiping them and saving ONLY the new one.`);

    // Overwrite the array completely with ONLY the new token per the user's explicit request
    const updatedTokens = [token];

    await this.prisma.user.update({
      where: { id: userId },
      data: { fcmTokens: updatedTokens },
    });

    this.logger.log(`Successfully registered new FCM token for user ${userId} (Total tokens: ${updatedTokens.length})`);
    return { success: true, message: "FCM token registered", tokenCount: updatedTokens.length };
  }
}

