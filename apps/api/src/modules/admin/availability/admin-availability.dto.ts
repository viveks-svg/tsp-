import { IsInt, IsString, IsBoolean, IsOptional, IsArray, ValidateNested, Min, Max, Matches } from "class-validator";
import { Type } from "class-transformer";

export class AvailabilityRuleDto {
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

export class SetAvailabilityRulesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AvailabilityRuleDto)
  rules!: AvailabilityRuleDto[];
}
