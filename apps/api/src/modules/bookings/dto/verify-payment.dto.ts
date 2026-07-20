import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class VerifyPaymentDto {
  @IsString()
  @IsNotEmpty()
  bookingId!: string;

  @IsString()
  @IsNotEmpty()
  razorpayOrderId!: string;

  @IsString()
  @IsNotEmpty()
  razorpayPaymentId!: string;

  @IsString()
  @IsNotEmpty()
  razorpaySignature!: string;

  // Lead capture session ID — if present, mark the lead as converted on success
  @IsOptional()
  @IsString()
  leadSessionId?: string;
}

