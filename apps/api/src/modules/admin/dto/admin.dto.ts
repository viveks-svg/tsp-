import { IsEnum, IsOptional, IsString } from "class-validator";
import { AstrologerStatus } from "@prisma/client";

export class ReviewAstrologerDto {
  @IsEnum(AstrologerStatus, { message: "Invalid status: must be APPROVED or REJECTED" })
  status!: AstrologerStatus;

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
