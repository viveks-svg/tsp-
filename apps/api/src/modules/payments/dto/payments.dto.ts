import { IsString, IsNotEmpty, IsNumber, Min, Max, IsOptional, IsIn } from "class-validator";

export class CreatePaymentOrderDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1, { message: "Amount must be at least ₹1" })
  @Max(200_000, { message: "Top-ups are limited to ₹2,00,000 at a time" })
  amount!: number; // Rupees

  // Wallets are in rupees; any other currency is refused.
  @IsOptional()
  @IsIn(["INR"], { message: "Only INR top-ups are supported" })
  currency?: string;
}

export class RefundOrderDto {
  @IsString()
  @IsNotEmpty()
  paymentTransactionId!: string;

  @IsNumber()
  @Min(1, { message: "Refund amount must be at least 1" })
  amount!: number;

  @IsString()
  @IsOptional()
  reason?: string;
}

export class VerifyPaymentDto {
  @IsString()
  @IsNotEmpty()
  orderId!: string;

  @IsString()
  @IsNotEmpty()
  gatewayTransactionId!: string;

  @IsString()
  @IsNotEmpty()
  signature!: string;
}

