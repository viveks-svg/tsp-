import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

export class CreateAstrologerDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @Matches(/^\d{10}$/, { message: "Phone must be exactly 10 digits" })
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100000)
  pricingPerMin!: number;

  /** The email already belongs to a client or admin account: convert that account. */
  @IsOptional()
  @IsBoolean()
  convertExisting?: boolean;

  /** Also email a link so the astrologer can choose their own password. */
  @IsOptional()
  @IsBoolean()
  sendSetupEmail?: boolean;
}

export class UpdateAstrologerDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @Matches(/^\d{10}$/, { message: "Phone must be exactly 10 digits" })
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100000)
  pricingPerMin?: number;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}

export class ResetAstrologerPasswordDto {
  /** "temporary": set a new password and show it once. "email": send a set-password link. */
  @IsIn(["temporary", "email"])
  mode!: "temporary" | "email";
}
