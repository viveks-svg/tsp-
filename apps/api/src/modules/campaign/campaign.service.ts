import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { CreateCampaignDto, UpdateCampaignDto } from "./campaign.dto";

@Injectable()
export class CampaignService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCampaignDto) {
    if (dto.startTime >= dto.endTime) {
      throw new BadRequestException("Start time must be before end time");
    }
    return this.prisma.campaign.create({
      data: {
        title: dto.title,
        bannerText: dto.bannerText,
        ratePerMinute: dto.ratePerMinute,
        dayOfWeek: dto.dayOfWeek,
        startTime: dto.startTime,
        endTime: dto.endTime,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(id: string, dto: UpdateCampaignDto) {
    const existing = await this.prisma.campaign.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException("Campaign not found");
    }

    const startTime = dto.startTime !== undefined ? dto.startTime : existing.startTime;
    const endTime = dto.endTime !== undefined ? dto.endTime : existing.endTime;

    if (startTime >= endTime) {
      throw new BadRequestException("Start time must be before end time");
    }

    return this.prisma.campaign.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.bannerText !== undefined && { bannerText: dto.bannerText }),
        ...(dto.ratePerMinute !== undefined && { ratePerMinute: dto.ratePerMinute }),
        ...(dto.dayOfWeek !== undefined && { dayOfWeek: dto.dayOfWeek }),
        ...(dto.startTime !== undefined && { startTime: dto.startTime }),
        ...(dto.endTime !== undefined && { endTime: dto.endTime }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async findAll() {
    return this.prisma.campaign.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: string) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id } });
    if (!campaign) {
      throw new NotFoundException("Campaign not found");
    }
    return campaign;
  }

  async getActiveCampaign() {
    const campaign = await this.prisma.campaign.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    if (!campaign) {
      return null;
    }

    const IST_OFFSET = 5.5 * 60 * 60 * 1000; // 5.5 hours in ms
    const now = new Date();
    const nowIST = new Date(now.getTime() + IST_OFFSET);

    const currentDay = nowIST.getUTCDay();
    const currentHHMM = `${nowIST.getUTCHours().toString().padStart(2, "0")}:${nowIST.getUTCMinutes().toString().padStart(2, "0")}`;

    const isWithinWindow =
      campaign.dayOfWeek === currentDay &&
      currentHHMM >= campaign.startTime &&
      currentHHMM < campaign.endTime;

    // Compute next window date
    let nextWindowDate: Date | null = null;
    if (!isWithinWindow) {
      let daysUntil = 0;
      if (campaign.dayOfWeek === currentDay) {
        if (currentHHMM >= campaign.endTime) {
          daysUntil = 7; // Passed today, next week
        } else {
          daysUntil = 0; // Today but before start time
        }
      } else {
        daysUntil = (campaign.dayOfWeek - currentDay + 7) % 7;
      }

      const [h, m] = campaign.startTime.split(":").map(Number);
      const nextIST = new Date(nowIST);
      nextIST.setUTCDate(nextIST.getUTCDate() + daysUntil);
      nextIST.setUTCHours(h, m, 0, 0);

      // Convert back to standard UTC timestamp
      nextWindowDate = new Date(nextIST.getTime() - IST_OFFSET);
    }

    return {
      ...campaign,
      isLiveNow: isWithinWindow,
      nextWindowDate,
    };
  }

  /**
   * Check if a campaign is currently within its active window (server-side validation).
   */
  isWithinWindow(campaign: { dayOfWeek: number; startTime: string; endTime: string }): boolean {
    const IST_OFFSET = 5.5 * 60 * 60 * 1000;
    const nowIST = new Date(Date.now() + IST_OFFSET);
    const currentDay = nowIST.getUTCDay();
    const currentHHMM = `${nowIST.getUTCHours().toString().padStart(2, "0")}:${nowIST.getUTCMinutes().toString().padStart(2, "0")}`;

    const isWithin = (
      campaign.dayOfWeek === currentDay &&
      currentHHMM >= campaign.startTime &&
      currentHHMM < campaign.endTime
    );

    console.log("[CAMPAIGN WINDOW CHECK]", {
      nowIST,
      currentDay,
      currentHHMM,
      campaignDay: campaign.dayOfWeek,
      campaignStartTime: campaign.startTime,
      campaignEndTime: campaign.endTime,
      isWithin,
    });

    return isWithin;
  }
}
