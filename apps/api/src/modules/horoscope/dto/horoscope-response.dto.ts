import { ZodiacSign, HoroscopePeriod, HoroscopeReading } from '@prisma/client';

export class HoroscopeResponseDto {
  sign!: ZodiacSign;
  period!: HoroscopePeriod;
  periodStartDate!: string;
  periodEndDate!: string;

  overallText!: string;
  loveText!: string;
  careerText!: string;
  healthText!: string;
  financeText!: string;

  luckyColor!: string;
  luckyNumber!: number;
  luckyTime!: string | null;
  moodTag!: string;
  rating!: number;

  generatedAt!: string;

  static fromEntity(entity: HoroscopeReading): HoroscopeResponseDto {
    const dto = new HoroscopeResponseDto();
    dto.sign = entity.sign;
    dto.period = entity.period;
    dto.periodStartDate = entity.periodStartDate.toISOString().split('T')[0];
    dto.periodEndDate = entity.periodEndDate.toISOString().split('T')[0];
    dto.overallText = entity.overallText;
    dto.loveText = entity.loveText;
    dto.careerText = entity.careerText;
    dto.healthText = entity.healthText;
    dto.financeText = entity.financeText;
    dto.luckyColor = entity.luckyColor;
    dto.luckyNumber = entity.luckyNumber;
    dto.luckyTime = entity.luckyTime;
    dto.moodTag = entity.moodTag;
    dto.rating = entity.rating;
    dto.generatedAt = entity.generatedAt.toISOString();
    return dto;
  }
}
