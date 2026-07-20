import {
  Controller,
  Post,
  Patch,
  Get,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { TIER_FINANCIAL, TIER_PUBLIC_TOOLS, TIER_ADMIN_INTERNAL } from '../../common/config/rate-limit.config';
import { LeadsService } from './leads.service';
import { CaptureContactDto, SaveDetailsDto } from './dto';

@ApiTags('Leads')
@Controller('leads')
export class LeadsController {
  constructor(private readonly service: LeadsService) {}

  // ── Public Endpoints (no auth required) ─────────────────────────────────────

  @Public()
  @Throttle(TIER_FINANCIAL)
  @Post('contact')
  @ApiOperation({ summary: 'Capture lead contact information (upsert by sessionId)' })
  captureContact(@Body() dto: CaptureContactDto) {
    return this.service.captureContact(dto);
  }

  @Public()
  @Throttle(TIER_PUBLIC_TOOLS)
  @Patch(':sessionId/details')
  @ApiOperation({ summary: 'Save/merge form details for a lead (debounced from client)' })
  saveDetails(
    @Param('sessionId') sessionId: string,
    @Body() dto: SaveDetailsDto,
  ) {
    return this.service.saveDetails(sessionId, dto);
  }

  @Public()
  @Throttle(TIER_FINANCIAL)
  @Get(':sessionId/price')
  @ApiOperation({ summary: 'Reveal price for a lead session (only price endpoint in booking flow)' })
  revealPrice(@Param('sessionId') sessionId: string) {
    return this.service.revealPrice(sessionId);
  }

  // ── Admin Endpoints ─────────────────────────────────────────────────────────
  // Note: No public endpoint can set CONVERTED — only the internal markConverted
  // method (called from the payment verification path) does that.
}

// Separate admin controller to keep route prefix clean
@ApiTags('Admin - Leads')
@Controller('admin/leads')
@Roles(Role.ADMIN)
@Throttle(TIER_ADMIN_INTERNAL)
export class AdminLeadsController {
  constructor(private readonly service: LeadsService) {}

  @Get()
  @ApiOperation({ summary: 'List leads (admin only)' })
  listLeads(@Query('stale') stale?: string) {
    const staleOnly = stale === 'true';
    return this.service.listLeads({ staleOnly });
  }
}
