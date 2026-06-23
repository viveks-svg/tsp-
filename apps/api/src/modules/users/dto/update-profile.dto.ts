import { IsString, IsOptional, IsISO8601, IsDateString, Matches } from "class-validator";

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  preferredLanguage?: string;

  @IsOptional()
  @IsISO8601()
  dob?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "tob must be in HH:MM 24-hour format",
  })
  tob?: string;

  @IsOptional()
  @IsString()
  pob?: string;

  @IsOptional()
  @IsString()
  gender?: string;
}
