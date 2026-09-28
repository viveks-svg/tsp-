import { IsString, IsEmail, IsNotEmpty, IsNumber, IsInt, Min, Max, Matches, ValidateNested, IsOptional, MaxLength, ArrayMinSize, ArrayMaxSize, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class ShopOrderItemDto {
  @IsString()
  @IsNotEmpty()
  productId!: string;

  // Ignored: the name and price come from the server's product list.
  @IsOptional()
  @IsString()
  @MaxLength(200)
  productName?: string;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsInt()
  @Min(1)
  @Max(20)
  quantity!: number;
}

export class CreateShopOrderDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  @Matches(/^[\p{L}][\p{L}\s.'\u2019-]*$/u, { message: "Please enter your name using letters (spaces, full stops, apostrophes and hyphens are fine)" })
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
  @MaxLength(80)
  city!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  state!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{6}$/, { message: "Pincode must be exactly 6 digits" })
  pincode!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => ShopOrderItemDto)
  items!: ShopOrderItemDto[];

  // Ignored: the total is computed on the server and the owner comes from the login.
  @IsOptional()
  @IsNumber()
  totalAmount?: number;

  @IsOptional()
  @IsString()
  userId?: string;
}
