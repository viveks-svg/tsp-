import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { LeadStatus } from '@prisma/client';
import { SERVICE_PRICES } from '../../common/constants/service-prices';
import { CaptureContactDto } from './dto/capture-contact.dto';
import { SaveDetailsDto } from './dto/save-details.dto';

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── Capture Contact ─────────────────────────────────────────────────────────
  // Upserts by sessionId — never creates a duplicate for the same session.
  // Rejects if consentToContact !== true.
  async captureContact(dto: CaptureContactDto) {
    if (dto.consentToContact !== true) {
      throw new BadRequestException(
        'Consent to contact is required before saving lead information.',
      );
    }

    const lead = await this.prisma.bookingLead.upsert({
      where: { sessionId: dto.sessionId },
      create: {
        sessionId: dto.sessionId,
        solutionSlug: dto.solutionSlug,
        solutionName: dto.solutionName,
        name: dto.name,
        phone: dto.phone,
        email: dto.email || null,
        consentToContact: true,
        status: LeadStatus.CONTACT_CAPTURED,
      },
      update: {
        name: dto.name,
        phone: dto.phone,
        email: dto.email || undefined,
        consentToContact: true,
        status: LeadStatus.CONTACT_CAPTURED,
        solutionSlug: dto.solutionSlug,
        solutionName: dto.solutionName,
      },
    });

    // Log event
    await this.prisma.bookingLeadEvent.create({
      data: {
        leadId: lead.id,
        eventType: 'contact_captured',
        metadata: {
          name: dto.name,
          phone: dto.phone,
          email: dto.email || null,
        },
      },
    });

    this.logger.log(
      `Lead contact captured: sessionId=${dto.sessionId}, phone=${dto.phone}`,
    );

    return { success: true, sessionId: lead.sessionId };
  }

  // ── Save Details ────────────────────────────────────────────────────────────
  // Merges formData JSON — earlier fields aren't lost if a later step saves first.
  // Idempotent and cheap — called repeatedly via debounced client autosave.
  async saveDetails(sessionId: string, dto: SaveDetailsDto) {
    const lead = await this.prisma.bookingLead.findUnique({
      where: { sessionId },
    });

    if (!lead) {
      throw new NotFoundException(
        'Lead not found. Please complete the contact step first.',
      );
    }

    // Deep merge: existing formData + new formData (new values win on conflict)
    const existingFormData =
      (lead.formData as Record<string, any>) || {};
    const mergedFormData = { ...existingFormData, ...dto.formData };

    // Only advance status if currently at CONTACT_CAPTURED
    // Don't regress from DETAILS_COMPLETED or later statuses
    const shouldAdvanceStatus =
      lead.status === LeadStatus.CONTACT_CAPTURED ||
      lead.status === LeadStatus.STARTED;

    await this.prisma.bookingLead.update({
      where: { sessionId },
      data: {
        formData: mergedFormData,
        ...(shouldAdvanceStatus
          ? { status: LeadStatus.DETAILS_COMPLETED }
          : {}),
      },
    });

    // Log event
    await this.prisma.bookingLeadEvent.create({
      data: {
        leadId: lead.id,
        eventType: 'details_saved',
        metadata: { fieldCount: Object.keys(dto.formData).length },
      },
    });

    return { success: true, sessionId };
  }

  // ── Reveal Price ────────────────────────────────────────────────────────────
  // Returns the solution's fixed price. This is the ONLY place the price is
  // served for the booking flow. Status → PRICE_REVEALED.
  async revealPrice(sessionId: string) {
    const lead = await this.prisma.bookingLead.findUnique({
      where: { sessionId },
    });

    if (!lead) {
      throw new NotFoundException('Lead not found.');
    }

    const basePaise = SERVICE_PRICES[lead.solutionSlug];
    if (!basePaise) {
      throw new BadRequestException(
        `Unknown solution slug: ${lead.solutionSlug}`,
      );
    }

    // Advance status to PRICE_REVEALED (don't regress from PAYMENT_INITIATED or later)
    if (
      lead.status !== LeadStatus.PAYMENT_INITIATED &&
      lead.status !== LeadStatus.CONVERTED
    ) {
      await this.prisma.bookingLead.update({
        where: { sessionId },
        data: { status: LeadStatus.PRICE_REVEALED },
      });
    }

    // Log event
    await this.prisma.bookingLeadEvent.create({
      data: {
        leadId: lead.id,
        eventType: 'price_revealed',
        metadata: { solutionSlug: lead.solutionSlug, basePaise },
      },
    });

    this.logger.log(
      `Price revealed: sessionId=${sessionId}, slug=${lead.solutionSlug}, price=${basePaise}`,
    );

    return {
      sessionId,
      solutionSlug: lead.solutionSlug,
      solutionName: lead.solutionName,
      basePaise,
      priceINR: basePaise / 100,
      priceLabel: `₹${(basePaise / 100).toLocaleString('en-IN')}`,
    };
  }

  // ── Mark Payment Initiated ──────────────────────────────────────────────────
  // Called when the user initiates payment (before Razorpay checkout opens).
  async markPaymentInitiated(sessionId: string) {
    const lead = await this.prisma.bookingLead.findUnique({
      where: { sessionId },
    });

    if (!lead) return; // Silently skip if no lead (e.g. old booking flow)

    if (lead.status !== LeadStatus.CONVERTED) {
      await this.prisma.bookingLead.update({
        where: { sessionId },
        data: { status: LeadStatus.PAYMENT_INITIATED },
      });

      await this.prisma.bookingLeadEvent.create({
        data: {
          leadId: lead.id,
          eventType: 'payment_initiated',
        },
      });
    }
  }

  // ── Mark Converted (INTERNAL ONLY — no public endpoint) ─────────────────────
  // Called from the verified payment success path only.
  // Sets convertedBookingId, status → CONVERTED, logs event.
  async markConverted(params: { sessionId: string; bookingId: string }) {
    const { sessionId, bookingId } = params;

    const lead = await this.prisma.bookingLead.findUnique({
      where: { sessionId },
    });

    if (!lead) {
      this.logger.warn(
        `markConverted: no lead found for sessionId=${sessionId}`,
      );
      return;
    }

    if (lead.status === LeadStatus.CONVERTED) {
      this.logger.log(
        `markConverted: lead already converted, sessionId=${sessionId}`,
      );
      return; // Idempotent
    }

    await this.prisma.bookingLead.update({
      where: { sessionId },
      data: {
        status: LeadStatus.CONVERTED,
        convertedBookingId: bookingId,
      },
    });

    await this.prisma.bookingLeadEvent.create({
      data: {
        leadId: lead.id,
        eventType: 'converted',
        metadata: { bookingId },
      },
    });

    this.logger.log(
      `Lead converted: sessionId=${sessionId}, bookingId=${bookingId}`,
    );
  }

  // ── Admin: List Leads ───────────────────────────────────────────────────────
  async listLeads(options: { staleOnly?: boolean } = {}) {
    const where = options.staleOnly
      ? { status: { not: LeadStatus.CONVERTED } }
      : {};

    return this.prisma.bookingLead.findMany({
      where,
      orderBy: { lastActivityAt: 'asc' },
      select: {
        id: true,
        sessionId: true,
        solutionSlug: true,
        solutionName: true,
        name: true,
        phone: true,
        email: true,
        status: true,
        lastActivityAt: true,
        createdAt: true,
        convertedBookingId: true,
      },
    });
  }
}
