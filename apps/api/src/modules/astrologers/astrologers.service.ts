import { ConflictException, Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { OnboardAstrologerDto, SubmitKycDto, ReviewKycDto } from "./dto/astrologer.dto";
import { SetAvailabilityRulesDto, AddAvailabilityExceptionDto } from "./dto/availability.dto";

@Injectable()
export class AstrologersService {
  constructor(private readonly prisma: PrismaService) {}

  async onboard(userId: string, dto: OnboardAstrologerDto) {
    const existing = await this.prisma.astrologer.findUnique({
      where: { userId },
    });

    if (existing) {
      throw new ConflictException(
        `Onboarding profile already exists. Current status: ${existing.status}`,
      );
    }

    // Resolve or create expertise records
    const expertiseIds: string[] = [];
    for (const skillName of dto.skills) {
      const expertise = await this.prisma.expertise.upsert({
        where: { name: skillName },
        update: {},
        create: { name: skillName, description: `${skillName} expertise` },
      });
      expertiseIds.push(expertise.id);
    }

    // Resolve or create language records
    const languageIds: string[] = [];
    for (const langCode of dto.languages) {
      const language = await this.prisma.language.upsert({
        where: { code: langCode.toLowerCase() },
        update: {},
        create: {
          code: langCode.toLowerCase(),
          name: langCode.toUpperCase() === "EN" ? "English" : langCode.toUpperCase() === "HI" ? "Hindi" : langCode,
        },
      });
      languageIds.push(language.id);
    }

    // Create astrologer profile and link relations in a transaction
    return this.prisma.$transaction(async (tx) => {
      const astrologer = await tx.astrologer.create({
        data: {
          userId,
          bio: dto.bio,
          pricingPerMin: dto.pricingPerMin,
          status: "PENDING",
        },
      });

      // Insert join rows for expertise
      await tx.astrologerExpertise.createMany({
        data: expertiseIds.map((expertiseId, index) => ({
          astrologerId: astrologer.id,
          expertiseId,
          rank: index + 1, // Order based on input position
        })),
      });

      // Insert join rows for languages
      await tx.astrologerLanguage.createMany({
        data: languageIds.map((languageId) => ({
          astrologerId: astrologer.id,
          languageId,
          proficiency: "FLUENT", // Default proficiency
        })),
      });

      return tx.astrologer.findUnique({
        where: { id: astrologer.id },
        include: {
          expertises: { include: { expertise: true } },
          languages: { include: { language: true } },
        },
      });
    });
  }

  async updateAvailability(userId: string, isAvailable: boolean) {
    const profile = await this.prisma.astrologer.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException("Astrologer profile not found");
    }

    if (profile.status !== "APPROVED") {
      throw new ConflictException("Your astrologer profile must be approved to toggle availability");
    }

    return this.prisma.astrologer.update({
      where: { userId },
      data: { isAvailable },
    });
  }

  async submitKyc(userId: string, dto: SubmitKycDto) {
    const profile = await this.prisma.astrologer.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException("Astrologer profile not found");
    }

    return this.prisma.astrologerVerification.upsert({
      where: { astrologerId: profile.id },
      create: {
        astrologerId: profile.id,
        idType: dto.idType,
        idNumber: dto.idNumber,
        idDocUrl: dto.idDocUrl,
        status: "PENDING",
      },
      update: {
        idType: dto.idType,
        idNumber: dto.idNumber,
        idDocUrl: dto.idDocUrl,
        status: "PENDING",
        submittedAt: new Date(),
      },
    });
  }

  async reviewKyc(astrologerId: string, reviewerId: string, dto: ReviewKycDto) {
    const verification = await this.prisma.astrologerVerification.findUnique({
      where: { astrologerId },
    });

    if (!verification) {
      throw new NotFoundException("No KYC verification request found for this astrologer");
    }

    return this.prisma.$transaction(async (tx) => {
      // Update verification table
      const updatedVerification = await tx.astrologerVerification.update({
        where: { astrologerId },
        data: {
          status: dto.status,
          reviewedAt: new Date(),
          reviewedById: reviewerId,
        },
      });

      // Update core status on Astrologer profile
      await tx.astrologer.update({
        where: { id: astrologerId },
        data: {
          status: dto.status,
          approvedAt: dto.status === "APPROVED" ? new Date() : null,
          approvedById: dto.status === "APPROVED" ? reviewerId : null,
          rejectionReason: dto.status === "REJECTED" ? dto.rejectionReason || "KYC verification failed" : null,
        },
      });

      return updatedVerification;
    });
  }

  async findAllApproved() {
    return this.prisma.astrologer.findMany({
      where: { status: "APPROVED" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        expertises: {
          include: {
            expertise: true,
          },
        },
        languages: {
          include: {
            language: true,
          },
        },
      },
    });
  }

  async findById(id: string) {
    const astrologer = await this.prisma.astrologer.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        expertises: {
          include: {
            expertise: true,
          },
        },
        languages: {
          include: {
            language: true,
          },
        },
        verification: true,
      },
    });

    if (!astrologer) {
      throw new NotFoundException("Astrologer profile not found");
    }

    return astrologer;
  }

  async setAvailabilityRules(userId: string, dto: SetAvailabilityRulesDto) {
    const profile = await this.prisma.astrologer.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException("Astrologer profile not found");
    }

    return this.prisma.$transaction(async (tx) => {
      // Clear old rules
      await tx.astrologerAvailabilityRule.deleteMany({
        where: { astrologerId: profile.id },
      });

      // Insert new rules
      await tx.astrologerAvailabilityRule.createMany({
        data: dto.rules.map((rule) => ({
          astrologerId: profile.id,
          dayOfWeek: rule.dayOfWeek,
          startTime: rule.startTime,
          endTime: rule.endTime,
          timezone: rule.timezone || "UTC",
        })),
      });

      return tx.astrologerAvailabilityRule.findMany({
        where: { astrologerId: profile.id },
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      });
    });
  }

  async getAvailabilityRules(astrologerId: string) {
    return this.prisma.astrologerAvailabilityRule.findMany({
      where: { astrologerId },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });
  }

  async addAvailabilityException(userId: string, dto: AddAvailabilityExceptionDto) {
    const profile = await this.prisma.astrologer.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException("Astrologer profile not found");
    }

    const exceptionDate = new Date(dto.date);
    // Standardize date to midnight for consistent comparisons
    exceptionDate.setUTCHours(0, 0, 0, 0);

    return this.prisma.$transaction(async (tx) => {
      // Remove any existing exception for the same day
      await tx.astrologerAvailabilityException.deleteMany({
        where: {
          astrologerId: profile.id,
          date: exceptionDate,
        },
      });

      // Insert the new exception
      return tx.astrologerAvailabilityException.create({
        data: {
          astrologerId: profile.id,
          date: exceptionDate,
          isAvailable: dto.isAvailable,
          startTime: dto.startTime || null,
          endTime: dto.endTime || null,
          reason: dto.reason || null,
        },
      });
    });
  }

  async getAvailabilityExceptions(astrologerId: string) {
    return this.prisma.astrologerAvailabilityException.findMany({
      where: { astrologerId },
      orderBy: { date: "asc" },
    });
  }
}

