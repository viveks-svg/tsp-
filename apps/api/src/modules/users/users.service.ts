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
}

