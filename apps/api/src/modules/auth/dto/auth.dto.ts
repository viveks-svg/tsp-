import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from "class-validator";
import { Role } from "@prisma/client";

export class SignupDto {
  @IsEmail({}, { message: "Invalid email format" })
  email!: string;

  @IsString()
  @MinLength(6, { message: "Password must be at least 6 characters" })
  password!: string;

  @IsString()
  @MinLength(2, { message: "Name must be at least 2 characters" })
  name!: string;

  @IsOptional()
  @IsEnum(Role, { message: "Invalid role specified" })
  role?: Role;
}

export class LoginDto {
  @IsEmail({}, { message: "Invalid email format" })
  email!: string;

  @IsString()
  @MinLength(6, { message: "Password must be at least 6 characters" })
  password!: string;
}

export class RefreshTokenDto {
  @IsString()
  refreshToken!: string;
}

