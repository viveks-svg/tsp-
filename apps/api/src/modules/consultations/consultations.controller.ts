import { Controller, Post, Body, Get, Param, HttpCode, HttpStatus, NotFoundException, BadRequestException } from "@nestjs/common";
import { ConsultationsService } from "./consultations.service";
import { CallService } from "./call.service";
import { CreateConsultationDto, CompleteConsultationDto, InitiateCallDto } from "./dto/consultation.dto";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@Controller("consultations")
export class ConsultationsController {
  constructor(
    private readonly consultationsService: ConsultationsService,
    private readonly callService: CallService,
  ) {}

  @Post()
  async create(
    @CurrentUser() user: any,
    @Body() dto: CreateConsultationDto,
  ) {
    return this.consultationsService.create(user.id, dto);
  }

  @Post(":id/start")
  @HttpCode(HttpStatus.OK)
  async start(
    @CurrentUser() user: any,
    @Param("id") id: string,
  ) {
    return this.consultationsService.start(user.id, id);
  }

  @Post(":id/complete")
  @HttpCode(HttpStatus.OK)
  async complete(
    @CurrentUser() user: any,
    @Param("id") id: string,
    @Body() dto: CompleteConsultationDto,
  ) {
    return this.consultationsService.complete(user.id, id, dto);
  }

  @Post(":id/cancel")
  @HttpCode(HttpStatus.OK)
  async cancel(
    @CurrentUser() user: any,
    @Param("id") id: string,
  ) {
    return this.consultationsService.cancel(user.id, id);
  }

  @Get()
  async getMyConsultations(@CurrentUser() user: any) {
    return this.consultationsService.findUserConsultations(user.id);
  }

  // --- Chat Endpoints ---

  @Get(":id/thread")
  async getThread(
    @CurrentUser() user: any,
    @Param("id") id: string,
  ) {
    const thread = await this.consultationsService.findThread(id);
    if (!thread) {
      throw new NotFoundException("Chat thread not found for this consultation");
    }
    return thread;
  }

  @Post(":id/message")
  async sendMessage(
    @CurrentUser() user: any,
    @Param("id") id: string,
    @Body("content") content: string,
  ) {
    if (!content || content.trim() === "") {
      throw new BadRequestException("Message content cannot be empty");
    }

    const thread = await this.consultationsService.findThread(id);
    if (!thread) {
      throw new NotFoundException("Chat thread not found");
    }

    if (thread.status !== "ACTIVE") {
      throw new BadRequestException("This chat session is no longer active");
    }

    return this.consultationsService.saveMessage(thread.id, user.id, content);
  }

  @Post(":id/review")
  async createReview(
    @CurrentUser() user: any,
    @Param("id") id: string,
    @Body("rating") rating: number,
    @Body("review") review?: string,
  ) {
    if (rating === undefined || rating < 1 || rating > 5) {
      throw new BadRequestException("Rating must be a number between 1 and 5");
    }

    return this.consultationsService.createReview(user.id, id, rating, review);
  }

  // --- Call Endpoints ---

  /**
   * User initiates a call to an astrologer.
   * Creates a CALL consultation + CallSession in RINGING state.
   */
  @Post("call/initiate")
  async initiateCall(
    @CurrentUser() user: any,
    @Body() dto: InitiateCallDto,
  ) {
    return this.callService.initiateCall(user.id, dto.astrologerId);
  }

  /**
   * Astrologer accepts an incoming call.
   */
  @Post(":id/call/accept")
  @HttpCode(HttpStatus.OK)
  async acceptCall(
    @CurrentUser() user: any,
    @Param("id") id: string,
  ) {
    return this.callService.acceptCall(user.id, id);
  }

  /**
   * Astrologer rejects an incoming call.
   */
  @Post(":id/call/reject")
  @HttpCode(HttpStatus.OK)
  async rejectCall(
    @CurrentUser() user: any,
    @Param("id") id: string,
  ) {
    return this.callService.rejectCall(user.id, id);
  }

  /**
   * Either party ends an active call.
   */
  @Post(":id/call/end")
  @HttpCode(HttpStatus.OK)
  async endCall(
    @CurrentUser() user: any,
    @Param("id") id: string,
  ) {
    return this.callService.endCall(user.id, id);
  }

  /**
   * Refresh TRTC userSig (for reconnection or long calls).
   */
  @Get(":id/call/token")
  async refreshToken(
    @CurrentUser() user: any,
    @Param("id") id: string,
  ) {
    return this.callService.refreshToken(user.id, id);
  }

  /**
   * Get current call session state.
   */
  @Get(":id/call/session")
  async getCallSession(
    @CurrentUser() user: any,
    @Param("id") id: string,
  ) {
    return this.callService.getCallSession(user.id, id);
  }

  /**
   * Get call history for the logged-in user.
   */
  @Get("call/history")
  async getCallHistory(@CurrentUser() user: any) {
    return this.callService.getCallHistory(user.id);
  }
}
