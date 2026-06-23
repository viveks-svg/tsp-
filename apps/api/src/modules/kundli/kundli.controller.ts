import { Controller } from "@nestjs/common";
import { KundliService } from "./kundli.service";

@Controller("kundli")
export class KundliController {
  constructor(private readonly kundliService: KundliService) {}
}
