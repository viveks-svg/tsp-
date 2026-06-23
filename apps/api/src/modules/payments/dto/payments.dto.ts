import { IsString, IsNotEmpty, IsNumber, Min, IsOptional } from "class-validator";

export class CreatePaymentOrderDto {
  @IsNumber()
  @Min(1, { message: "Amount must be at least 1" })
  amount!: number; // Amount in standard unit (e.g. Rupees)

  @IsString()
  @IsOptional()
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

