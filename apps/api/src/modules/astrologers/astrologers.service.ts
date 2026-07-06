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
    const astrologers = await this.prisma.astrologer.findMany({
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
        availabilityRules: true,
        exceptions: {
          where: {
            date: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
              lt: new Date(new Date().setHours(23, 59, 59, 999)),
            }
          }
        }
      },
    });

    const now = new Date();
    // Use IST timezone since users usually operate in India for Vedic astrology.
    // However, if we do server local time, it might be UTC.
    // It's better to just do server time for now.
    const currentDay = now.getDay();
    const currentHourMin = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    return astrologers.map(astro => {
      let isAvailable = astro.isAvailable; // Base manual toggle
      
      // If manual toggle is ON, but they have scheduled rules, we enforce the rules
      if (isAvailable && astro.availabilityRules.length > 0) {
        const todayException = astro.exceptions[0];
        if (todayException) {
          isAvailable = todayException.isAvailable;
        } else {
          const ruleForToday = astro.availabilityRules.find(r => r.dayOfWeek === currentDay);
          if (ruleForToday) {
            if (currentHourMin < ruleForToday.startTime || currentHourMin > ruleForToday.endTime) {
              isAvailable = false;
            }
          } else {
            isAvailable = false; // No rule for today = not available today
          }
        }
      }
      
      // We explicitly exclude availabilityRules and exceptions from the final response payload 
      // if we want to keep it identical, or just return them since the DTO mapper can ignore them.
      return {
        ...astro,
        isAvailable
      };
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
        availabilityRules: true,
        exceptions: {
          where: {
            date: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
              lt: new Date(new Date().setHours(23, 59, 59, 999)),
            }
          }
        }
      },
    });

    if (!astrologer) {
      throw new NotFoundException("Astrologer profile not found");
    }

    let isAvailable = astrologer.isAvailable;
    const now = new Date();
    const currentDay = now.getDay();
    const currentHourMin = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    if (isAvailable && astrologer.availabilityRules.length > 0) {
      const todayException = astrologer.exceptions[0];
      if (todayException) {
        isAvailable = todayException.isAvailable;
      } else {
        const ruleForToday = astrologer.availabilityRules.find(r => r.dayOfWeek === currentDay);
        if (ruleForToday) {
          if (currentHourMin < ruleForToday.startTime || currentHourMin > ruleForToday.endTime) {
            isAvailable = false;
          }
        } else {
          isAvailable = false;
        }
      }
    }

    return {
      ...astrologer,
      isAvailable
    };
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

  async getMyAvailabilityRules(userId: string) {
    const profile = await this.prisma.astrologer.findUnique({
      where: { userId },
    });
    if (!profile) throw new NotFoundException("Astrologer profile not found");
    return this.getAvailabilityRules(profile.id);
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

