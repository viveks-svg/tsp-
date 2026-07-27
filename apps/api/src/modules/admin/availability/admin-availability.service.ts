import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../../database/prisma.service";
import { SetAvailabilityRulesDto } from "./admin-availability.dto";

@Injectable()
export class AdminAvailabilityService {
  private readonly logger = new Logger(AdminAvailabilityService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Bulk-replace all availability rules for an admin user.
   * Deletes existing rules then inserts the new set in a transaction.
   */
  async setRules(adminId: string, dto: SetAvailabilityRulesDto) {
    return this.prisma.$transaction(async (tx) => {
      // Delete all existing rules for this admin
      await tx.adminAvailability.deleteMany({ where: { adminId } });

      // Insert new rules
      if (dto.rules.length > 0) {
        await tx.adminAvailability.createMany({
          data: dto.rules.map((rule) => ({
            adminId,
            dayOfWeek: rule.dayOfWeek,
            startTime: rule.startTime,
            endTime: rule.endTime,
            isActive: rule.isActive ?? true,
          })),
        });
      }

      return tx.adminAvailability.findMany({
        where: { adminId },
        orderBy: { dayOfWeek: "asc" },
      });
    });
  }

  /**
   * Get all availability rules for an admin.
   */
  async getRules(adminId: string) {
    return this.prisma.adminAvailability.findMany({
      where: { adminId },
      orderBy: { dayOfWeek: "asc" },
    });
  }

  /**
   * Compute the current live status for Dr. Pradeep (or any admin).
   * Checks AdminAvailability against IST server time.
   *
   * Returns { isLive, nextWindow: Date | null }
   */
  async getCurrentStatus() {
    // Get the first admin user (Dr. Pradeep is the sole admin)
    const admin = await this.prisma.user.findFirst({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    if (!admin) {
      return { isLive: false, nextWindow: null };
    }

    const rules = await this.prisma.adminAvailability.findMany({
      where: { adminId: admin.id, isActive: true },
      orderBy: { dayOfWeek: "asc" },
    });

    if (rules.length === 0) {
      return { isLive: false, nextWindow: null };
    }

    // All times are IST
    const nowIST = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
    );
    const currentDay = nowIST.getDay(); // 0=Sun ... 6=Sat
    const currentHHMM = `${nowIST.getHours().toString().padStart(2, "0")}:${nowIST.getMinutes().toString().padStart(2, "0")}`;

    // Check if currently live
    const todayRule = rules.find((r: any) => r.dayOfWeek === currentDay);
    if (todayRule && currentHHMM >= todayRule.startTime && currentHHMM < todayRule.endTime) {
      return { isLive: true, nextWindow: null };
    }

    // Find next upcoming window
    // Look ahead up to 7 days
    for (let offset = 0; offset <= 7; offset++) {
      const targetDay = (currentDay + offset) % 7;
      const rule = rules.find((r: any) => r.dayOfWeek === targetDay);

      if (!rule) continue;

      // If same day but time hasn't come yet
      if (offset === 0 && currentHHMM < rule.startTime) {
        const [h, m] = rule.startTime.split(":").map(Number);
        const nextDate = new Date(nowIST);
        nextDate.setHours(h, m, 0, 0);
        return { isLive: false, nextWindow: nextDate };
      }

      // Future day
      if (offset > 0) {
        const [h, m] = rule.startTime.split(":").map(Number);
        const nextDate = new Date(nowIST);
        nextDate.setDate(nextDate.getDate() + offset);
        nextDate.setHours(h, m, 0, 0);
        return { isLive: false, nextWindow: nextDate };
      }
    }

    return { isLive: false, nextWindow: null };
  }
}
