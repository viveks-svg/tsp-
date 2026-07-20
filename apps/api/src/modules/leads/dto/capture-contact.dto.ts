import { IsString, IsBoolean, IsEmail, IsOptional, Matches, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CaptureContactDto {
  @ApiProperty({ description: 'Unique session identifier from the client' })
  @IsString()
  @MinLength(1)
  sessionId!: string;

  @ApiProperty({ description: 'Solution slug, e.g. "business-vastu"' })
  @IsString()
  @MinLength(1)
  solutionSlug!: string;

  @ApiProperty({ description: 'Human-readable solution name' })
  @IsString()
  @MinLength(1)
  solutionName!: string;

  @ApiProperty({ description: 'Customer full name' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ description: 'Customer phone number (10-digit Indian mobile)' })
  @IsString()
  @Matches(/^[6-9]\d{9}$/, {
    message: 'Phone must be a valid 10-digit Indian mobile number',
  })
  phone!: string;

  @ApiPropertyOptional({ description: 'Customer email address' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: 'Consent to contact — must be true' })
  @IsBoolean()
  consentToContact!: boolean;
}
