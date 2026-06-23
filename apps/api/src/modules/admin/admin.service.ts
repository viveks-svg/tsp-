import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { ReviewAstrologerDto } from "./dto/admin.dto";

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) { }

  async reviewAstrologer(adminId: string, astrologerId: string, dto: ReviewAstrologerDto) {
    console.log(adminId, astrologerId, dto);
    const astrologer = await this.prisma.astrologer.findUnique({
      where: { id: astrologerId },
    });

    console.log("Hello World");
    if (!astrologer) {
      throw new NotFoundException("Astrologer profile not found");
    }

    if (dto.status === "PENDING") {
      throw new BadRequestException("Cannot set astrologer status back to PENDING");
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedAstrologer = await tx.astrologer.update({
        where: { id: astrologerId },
        data: {
          status: dto.status,
          approvedById: adminId,
          approvedAt: dto.status === "APPROVED" ? new Date() : null,
          rejectionReason: dto.status === "REJECTED" ? dto.rejectionReason : null,
        },
      });

      if (dto.status === "APPROVED") {
        await tx.user.update({
          where: { id: astrologer.userId },
          data: { role: "ASTROLOGER" },
        });
      }

      return updatedAstrologer;
    });
  }
}
