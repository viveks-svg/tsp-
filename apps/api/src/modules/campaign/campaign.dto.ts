import { IsString, IsInt, IsDecimal, IsBoolean, IsOptional, Min, Max, Matches, IsNumberString } from "class-validator";

export class CreateCampaignDto {
  @IsString()
  title!: string;

  @IsString()
  bannerText!: string;

  @IsNumberString()
  ratePerMinute!: string;

  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek!: number;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: "startTime must be in HH:MM format" })
  startTime!: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: "endTime must be in HH:MM format" })
  endTime!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateCampaignDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  bannerText?: string;

  @IsOptional()
  @IsNumberString()
  ratePerMinute?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek?: number;

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: "startTime must be in HH:MM format" })
  startTime?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: "endTime must be in HH:MM format" })
  endTime?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
