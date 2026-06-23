import { Module } from "@nestjs/common";
import { RealtimeGateway } from "./realtime.gateway";
import { AuthModule } from "../modules/auth/auth.module";
import { ConsultationsModule } from "../modules/consultations/consultations.module";

/**
 * RealtimeModule
 *
 * Encapsulates the WebSocket gateway and its dependencies.
 * Imports AuthModule so JwtService is available for gateway
 * connection-level authentication.
 * Imports ConsultationsModule for chat and call service access.
 */
@Module({
  imports: [AuthModule, ConsultationsModule],
  providers: [RealtimeGateway],
})
export class RealtimeModule {}
