import { IsArray, IsInt, IsString, IsBoolean, IsOptional, ValidateNested, Min, Max, Matches, IsISO8601 } from "class-validator";
import { Type } from "class-transformer";

export class AvailabilityRuleItem {
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek!: number;

  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "startTime must be in HH:MM 24-hour format",
  })
  startTime!: string;

  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "endTime must be in HH:MM 24-hour format",
  })
  endTime!: string;

  @IsString()
  @IsOptional()
  timezone?: string;
}

export class SetAvailabilityRulesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AvailabilityRuleItem)
  rules!: AvailabilityRuleItem[];
}

export class AddAvailabilityExceptionDto {
  @IsISO8601()
  date!: string;

  @IsBoolean()
  isAvailable!: boolean;

  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "startTime must be in HH:MM 24-hour format",
  })
  startTime?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "endTime must be in HH:MM 24-hour format",
  })
  endTime?: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
