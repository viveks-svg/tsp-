import { Controller } from "@nestjs/common";
import { HoroscopeService } from "./horoscope.service";

@Controller("horoscope")
export class HoroscopeController {
  constructor(private readonly horoscopeService: HoroscopeService) {}
}
