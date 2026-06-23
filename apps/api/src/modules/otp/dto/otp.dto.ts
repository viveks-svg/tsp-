import { IsString, IsNotEmpty, Matches } from "class-validator";

export class SendOtpDto {
  @IsString()
  @IsNotEmpty()
  identifier!: string; // email or phone number

  @IsString()
  @IsNotEmpty()
  purpose!: string; // LOGIN, SIGNUP, RESET_PASSWORD, etc.
}

export class VerifyOtpDto {
  @IsString()
  @IsNotEmpty()
  identifier!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{6}$/, { message: "code must be exactly 6 digits" })
  code!: string;

  @IsString()
  @IsNotEmpty()
  purpose!: string;
}
