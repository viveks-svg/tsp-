import { IsOptional, IsUUID, IsDateString, IsInt, Min, Max, IsString, IsNotEmpty, MaxLength } from "class-validator";

export class ChatMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content!: string;
}

export class ReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  review?: string;
}

export class CreateConsultationDto {
  @IsUUID("4", { message: "Invalid astrologer ID" })
  astrologerId!: string;

  @IsDateString({}, { message: "Invalid date format" })
  scheduledAt!: string;
}

export class CompleteConsultationDto {
  // Ignored: the server measures the chat itself. Kept so older app versions still validate.
  @IsOptional()
  @IsInt()
  @Min(1)
  durationMin?: number;
}

export class InitiateCallDto {
  @IsUUID("4", { message: "Invalid astrologer ID" })
  astrologerId!: string;
}
