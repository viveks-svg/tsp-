import {
  IsString, IsEmail, IsEnum, IsOptional,
  IsDateString, IsInt, Min, IsNotEmpty
} from 'class-validator';
import { ServiceCategory, UrgencyTier } from '@prisma/client';

export class CreateBookingDto {
  @IsEnum(ServiceCategory)
  serviceCategory!: ServiceCategory;

  @IsString() @IsNotEmpty()
  serviceSlug!: string;

  @IsString() @IsNotEmpty()
  serviceName!: string;

  @IsString() @IsNotEmpty()
  fullName!: string;

  @IsEmail()
  email!: string;

  @IsString() @IsNotEmpty()
  phone!: string;

  @IsOptional() @IsDateString()
  dateOfBirth?: string;

  @IsOptional() @IsString()
  timeOfBirth?: string;

  @IsOptional() @IsString()
  placeOfBirth?: string;

  @IsOptional() @IsString()
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
}
