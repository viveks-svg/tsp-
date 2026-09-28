import { SAFE_LINK, SAFE_LINK_MESSAGE } from '../../common/safe-link';
import { IsBoolean, IsDateString, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';


export class PromoDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  title!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(400)
  description!: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  actionText?: string;

  @IsOptional()
  @Matches(SAFE_LINK, { message: SAFE_LINK_MESSAGE })
  @MaxLength(500)
  actionUrl?: string;

  @IsOptional()
  @Matches(SAFE_LINK, { message: SAFE_LINK_MESSAGE })
  @MaxLength(500)
  imageUrl?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdatePromoDto extends PromoDto {
  @IsOptional()
  declare title: string;

  @IsOptional()
  declare description: string;
}
