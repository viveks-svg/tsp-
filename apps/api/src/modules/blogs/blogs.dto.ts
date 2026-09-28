import { SAFE_LINK, SAFE_LINK_MESSAGE } from "../../common/safe-link";
import { IsBoolean, IsIn, IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";

export const BLOG_CATEGORIES = ["vedic", "matchmaking", "gemstones", "horoscope"] as const;

export class BlogDto {
  @IsString()
  @MinLength(4)
  @MaxLength(160)
  title!: string;

  /** Optional; made from the title when left out. */
  @IsOptional()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: "The address may use lower-case letters, numbers and hyphens" })
  @MaxLength(120)
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  excerpt?: string;

  @IsString()
  @MaxLength(100_000)
  content!: string;

  @IsIn(BLOG_CATEGORIES)
  category!: (typeof BLOG_CATEGORIES)[number];

  @IsOptional()
  @Matches(SAFE_LINK, { message: SAFE_LINK_MESSAGE })
  @MaxLength(500)
  coverImageUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  byline?: string;

  @IsOptional()
  @IsBoolean()
  published?: boolean;
}
