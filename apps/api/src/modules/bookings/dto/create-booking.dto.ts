import {
  IsString, IsEmail, IsEnum, IsOptional,
  IsDateString, IsInt, Min, IsNotEmpty, Matches
} from 'class-validator';
import { ServiceCategory, UrgencyTier } from '@prisma/client';
import { IsPastDate, IsNotPurelyNumeric } from '../../../common/decorators/validation.decorator';

export class CreateBookingDto {
  @IsEnum(ServiceCategory)
  serviceCategory!: ServiceCategory;

  @IsString() @IsNotEmpty()
  serviceSlug!: string;

  @IsString() @IsNotEmpty()
  serviceName!: string;

  @IsString() @IsNotEmpty()
  @Matches(/^[a-zA-Z\s]+$/, { message: "Name must contain only letters and spaces" })
  fullName!: string;

  @IsEmail()
  email!: string;

  @IsString() @IsNotEmpty()
  @Matches(/^\d{10}$/, { message: "Phone must be exactly 10 digits" })
  phone!: string;

  @IsOptional() @IsDateString()
  @IsPastDate()
  dateOfBirth?: string;

  @IsOptional() @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "timeOfBirth must be in HH:MM 24-hour format",
  })
  timeOfBirth?: string;

  @IsOptional() @IsString()
  @IsNotPurelyNumeric()
  placeOfBirth?: string;

  @IsOptional() @IsString()
  @IsNotPurelyNumeric()
  businessName?: string;

  @IsOptional() @IsString()
  businessAddress?: string;

  @IsOptional() @IsString()
  spaceType?: string;

  @IsOptional() @IsDateString()
  scheduledDate?: string;

  @IsOptional() @IsString()
  scheduledSlot?: string;

  @IsEnum(UrgencyTier)
  urgencyTier!: UrgencyTier;

  @IsOptional() @IsString()
  notes?: string;

  // Lead capture session ID — if present, the booking came through the lead flow
  @IsOptional() @IsString()
  leadSessionId?: string;
}

