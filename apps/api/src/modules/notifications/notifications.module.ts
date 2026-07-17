import { Module, forwardRef } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";
import { NotificationsController } from "./notifications.controller";
import { FirebaseModule } from "../firebase/firebase.module";
import { RealtimeModule } from "../../realtime/realtime.module";

@Module({
  imports: [FirebaseModule, forwardRef(() => RealtimeModule)],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
