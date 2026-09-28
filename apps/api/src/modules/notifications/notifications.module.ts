import { Module, forwardRef } from "@nestjs/common";
import { MailModule } from "../mail/mail.module";
import { NotificationsService } from "./notifications.service";
import { NotificationsController } from "./notifications.controller";
import { BroadcastController } from "./broadcast.controller";
import { BroadcastService } from "./broadcast.service";
import { FirebaseModule } from "../firebase/firebase.module";
import { RealtimeModule } from "../../realtime/realtime.module";

@Module({
  imports: [FirebaseModule, MailModule, forwardRef(() => RealtimeModule)],
  controllers: [NotificationsController, BroadcastController],
  providers: [NotificationsService, BroadcastService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
