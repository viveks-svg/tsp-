import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { UpdateProfileDto } from "./dto/update-profile.dto";

@Injectable()
export class UsersService {
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
      return { success: false, message: "Invalid FCM token" };
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { fcmTokens: true },
    });

    if (!user) {
      return { success: false, message: "User not found" };
    }

    // Skip if token already registered
    if (user.fcmTokens.includes(token)) {
      return { success: true, message: "Token already registered" };
    }

    // Keep only the 5 most recent tokens (drop oldest if at limit)
    const MAX_TOKENS = 5;
    const updatedTokens = [...user.fcmTokens, token].slice(-MAX_TOKENS);

    await this.prisma.user.update({
      where: { id: userId },
      data: { fcmTokens: updatedTokens },
    });

    return { success: true, message: "FCM token registered" };
  }
}

