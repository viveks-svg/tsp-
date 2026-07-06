import { IsString, IsEmail, IsNotEmpty, IsNumber, Min, Matches, ValidateNested, IsOptional, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class ShopOrderItemDto {
  @IsString()
  @IsNotEmpty()
  productId!: string;

  @IsString()
  @IsNotEmpty()
  productName!: string;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsNumber()
  @Min(1)
  quantity!: number;
}

export class CreateShopOrderDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z\s]+$/, { message: "Name must contain only letters and spaces" })
  customerName!: string;

  @IsOptional()
  @IsEmail({}, { message: "Invalid email format" })
  customerEmail?: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{10}$/, { message: "Phone must be exactly 10 digits" })
  customerPhone!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  shippingAddress!: string;

  @IsString()
  @IsNotEmpty()
  city!: string;

  @IsString()
  @IsNotEmpty()
  state!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{6}$/, { message: "Pincode must be exactly 6 digits" })
  pincode!: string;

  @ValidateNested({ each: true })
  @Type(() => ShopOrderItemDto)
  items!: ShopOrderItemDto[];

  @IsNumber()
  @Min(0)
  totalAmount!: number;

  @IsOptional()
  @IsString()
  userId?: string;
}
