-- CreateEnum
CREATE TYPE "ZodiacSign" AS ENUM ('ARIES', 'TAURUS', 'GEMINI', 'CANCER', 'LEO', 'VIRGO', 'LIBRA', 'SCORPIO', 'SAGITTARIUS', 'CAPRICORN', 'AQUARIUS', 'PISCES');

-- CreateEnum
CREATE TYPE "HoroscopePeriod" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "GrahaName" AS ENUM ('SUN', 'MOON', 'MARS', 'MERCURY', 'JUPITER', 'VENUS', 'SATURN', 'RAHU', 'KETU');

-- CreateTable
CREATE TABLE "HoroscopeReading" (
    "id" TEXT NOT NULL,
    "sign" "ZodiacSign" NOT NULL,
    "period" "HoroscopePeriod" NOT NULL,
    "periodStartDate" DATE NOT NULL,
    "periodEndDate" DATE NOT NULL,
    "overallText" TEXT NOT NULL,
    "loveText" TEXT NOT NULL,
    "careerText" TEXT NOT NULL,
    "healthText" TEXT NOT NULL,
    "financeText" TEXT NOT NULL,
    "luckyColor" TEXT NOT NULL,
    "luckyNumber" INTEGER NOT NULL,
    "luckyTime" TEXT,
    "moodTag" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "themeTags" TEXT[],
    "transitSnapshot" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HoroscopeReading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserHoroscopePreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "natalMoonSign" "ZodiacSign",
    "natalSunSign" "ZodiacSign",
    "notifyDaily" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserHoroscopePreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HoroscopeReading_sign_period_idx" ON "HoroscopeReading"("sign", "period");

-- CreateIndex
CREATE INDEX "HoroscopeReading_periodStartDate_idx" ON "HoroscopeReading"("periodStartDate");

-- CreateIndex
CREATE UNIQUE INDEX "HoroscopeReading_sign_period_periodStartDate_key" ON "HoroscopeReading"("sign", "period", "periodStartDate");

-- CreateIndex
CREATE UNIQUE INDEX "UserHoroscopePreference_userId_key" ON "UserHoroscopePreference"("userId");

-- AddForeignKey
ALTER TABLE "UserHoroscopePreference" ADD CONSTRAINT "UserHoroscopePreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
