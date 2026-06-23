import { IsNumber, Min } from "class-validator";

export class AddFundsDto {
  @IsNumber()
  @Min(1, { message: "Must add at least 1 unit of currency" })
  amount!: number;
}
