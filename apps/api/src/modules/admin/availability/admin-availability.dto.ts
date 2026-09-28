import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$|^24:00$/;

export class TimeRangeDto {
  @Matches(HHMM, { message: "start must be HH:MM" })
  start!: string;

  @Matches(HHMM, { message: "end must be HH:MM" })
  end!: string;
}

export class WeeklyDayDto {
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeRangeDto)
  ranges!: TimeRangeDto[];
}

export class ScheduleSettingsDto {
  @IsInt()
  @Min(15)
  @Max(240)
  sessionMinutes!: number;

  @IsInt()
  @Min(0)
  @Max(120)
  bufferMinutes!: number;

  @IsInt()
  @Min(7)
  @Max(365)
  horizonDays!: number;

  @IsBoolean()
  acceptingBookings!: boolean;
}

export class SaveScheduleDto {
  /** The astrologer (Dr. Pradeep) whose hours these are. */
  @IsOptional()
  @IsUUID()
  astrologerId?: string;

  @ValidateNested()
  @Type(() => ScheduleSettingsDto)
  settings!: ScheduleSettingsDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WeeklyDayDto)
  weekly!: WeeklyDayDto[];
}

export class DayOffDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: "date must be YYYY-MM-DD" })
  date!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  note?: string;
}
