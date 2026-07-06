import { IsString, IsOptional, IsISO8601, Matches, IsIn } from "class-validator";
import { IsPastDate, IsNotPurelyNumeric } from "../../../common/decorators/validation.decorator";

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsIn(["en", "hi", "ta", "te", "mr", "bn", "gu", "kn", "ml", "pa", "or", "as"])
  preferredLanguage?: string;

  @IsOptional()
  @IsISO8601()
  @IsPastDate()
  dob?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "tob must be in HH:MM 24-hour format",
  })
  tob?: string;

  @IsOptional()
  @IsString()
  @IsNotPurelyNumeric()
  pob?: string;

  @IsOptional()
  @IsIn(["Male", "Female", "Other"])
  gender?: string;
}

