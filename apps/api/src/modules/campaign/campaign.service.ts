import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { CreateCampaignDto, UpdateCampaignDto } from "./campaign.dto";

@Injectable()
export class CampaignService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCampaignDto) {
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

  /**
   * Returns the currently active campaign along with live/countdown info.
   * Used by the public banner endpoint.
   */
  async getActiveCampaign() {
    const campaign = await this.prisma.campaign.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    if (!campaign) {
      return null;
    }

    const nowIST = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
    );
    const currentDay = nowIST.getDay();
    const currentHHMM = `${nowIST.getHours().toString().padStart(2, "0")}:${nowIST.getMinutes().toString().padStart(2, "0")}`;

    const isWithinWindow =
      campaign.dayOfWeek === currentDay &&
      currentHHMM >= campaign.startTime &&
      currentHHMM < campaign.endTime;

    // Compute next window date
    let nextWindowDate: Date | null = null;
    if (!isWithinWindow) {
      const daysUntil =
        campaign.dayOfWeek === currentDay && currentHHMM >= campaign.endTime
          ? 7 // Already passed today, next week
          : ((campaign.dayOfWeek - currentDay + 7) % 7) || 7;

      // If same day but before start time, daysUntil should be 0
      const actualDays =
        campaign.dayOfWeek === currentDay && currentHHMM < campaign.startTime
          ? 0
          : daysUntil;

      const [h, m] = campaign.startTime.split(":").map(Number);
      nextWindowDate = new Date(nowIST);
      nextWindowDate.setDate(nextWindowDate.getDate() + actualDays);
      nextWindowDate.setHours(h, m, 0, 0);
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
    const nowIST = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
    );
    const currentDay = nowIST.getDay();
    const currentHHMM = `${nowIST.getHours().toString().padStart(2, "0")}:${nowIST.getMinutes().toString().padStart(2, "0")}`;

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
