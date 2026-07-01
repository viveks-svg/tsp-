import { GrahaName, ZodiacSign } from '@prisma/client';

export interface TransitSnapshot {
  graha: GrahaName;
  sign: ZodiacSign;
  longitudeDegrees: number;
  retrograde: boolean;
}
