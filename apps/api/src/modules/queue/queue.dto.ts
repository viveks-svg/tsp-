import { IsString } from "class-validator";

export class JoinQueueDto {
  @IsString()
  campaignId!: string;
}

export class LeaveQueueDto {
  @IsString()
  campaignId!: string;
}
