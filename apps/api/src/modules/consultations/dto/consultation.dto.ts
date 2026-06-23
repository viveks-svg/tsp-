import { IsUUID, IsDateString, IsInt, Min } from "class-validator";

export class CreateConsultationDto {
  @IsUUID("4", { message: "Invalid astrologer ID" })
  astrologerId!: string;

  @IsDateString({}, { message: "Invalid date format" })
  scheduledAt!: string;
}

export class CompleteConsultationDto {
  @IsInt()
  @Min(1, { message: "Duration must be at least 1 minute" })
  durationMin!: number;
}

export class InitiateCallDto {
  @IsUUID("4", { message: "Invalid astrologer ID" })
  astrologerId!: string;
}
