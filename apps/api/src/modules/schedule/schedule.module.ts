import { Global, Module } from "@nestjs/common";
import { ScheduleService } from "./schedule.service";

/** Global so bookings, slots, queue and admin can all read Dr. Pradeep's schedule. */
@Global()
@Module({
  providers: [ScheduleService],
  exports: [ScheduleService],
})
export class ConsultationScheduleModule {}
