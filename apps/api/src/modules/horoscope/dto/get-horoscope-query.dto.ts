import { IsEnum } from 'class-validator';
import { ZodiacSign, HoroscopePeriod } from '@prisma/client';

export class GetHoroscopeQueryDto {
  @IsEnum(ZodiacSign, {
    message: `sign must be one of: ${Object.values(ZodiacSign).join(', ')}`,
  })
  sign!: ZodiacSign;

  @IsEnum(HoroscopePeriod, {
    message: `period must be one of: ${Object.values(HoroscopePeriod).join(', ')}`,
  })
  period!: HoroscopePeriod;
}
