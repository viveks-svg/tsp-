import { IsEmail, IsString, MinLength, IsOptional, IsEnum, Matches } from "class-validator";
import { Role } from "@prisma/client";

export class SignupDto {
  @IsEmail({}, { message: "Invalid email format" })
  email!: string;

  @IsString()
  @MinLength(8, { message: "Password must be at least 8 characters" })
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/~`';])/, {
    message: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
  })
  password!: string;

  @IsString()
  @MinLength(2, { message: "Name must be at least 2 characters" })
  @Matches(/^[a-zA-Z\s]+$/, { message: "Name must contain only letters and spaces" })
  name!: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{10}$/, { message: "Phone must be exactly 10 digits" })
  phone?: string;

  @IsOptional()
  @IsEnum(Role, { message: "Invalid role specified" })
  role?: Role;
}

export class LoginDto {
  @IsEmail({}, { message: "Invalid email format" })
  email!: string;

  @IsString()
  @MinLength(1, { message: "Password is required" })
  password!: string;
}

export class RefreshTokenDto {
  @IsString()
  refreshToken!: string;
}


