import { IsString, IsArray, IsNumber, Min, IsBoolean, ArrayMinSize, IsEnum, IsOptional } from "class-validator";
import { AstrologerStatus } from "@prisma/client";

export class OnboardAstrologerDto {
  @IsString()
  bio!: string;

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1, { message: "Specify at least one skill (Expertise name)" })
  skills!: string[];

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1, { message: "Specify at least one language (Language code, e.g., 'en', 'hi')" })
  languages!: string[];

  @IsNumber()
  @Min(0, { message: "Pricing per minute cannot be negative" })
  pricingPerMin!: number;
}

export class UpdateAvailabilityDto {
  @IsBoolean()
  isAvailable!: boolean;
}

export class SubmitKycDto {
  @IsString()
  idType!: string; // PAN, AADHAAR, PASSPORT, etc.

  @IsString()
  idNumber!: string;

  @IsString()
  idDocUrl!: string;
}

export class ReviewKycDto {
  @IsEnum(AstrologerStatus)
  status!: AstrologerStatus; // APPROVED or REJECTED

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}

