import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Logger, Inject, forwardRef } from "@nestjs/common";
import { QueueService } from "./queue.service";

const frontendOrigins = (process.env.FRONTEND_URL ?? "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

if (!frontendOrigins.includes("http://localhost:3000")) {
  frontendOrigins.push("http://localhost:3000");
}

/**
 * Queue-specific WebSocket gateway.
 *
 * Handles real-time queue events:
 * - Users join/leave queue rooms to receive position updates
 * - Admin monitors the queue in real time
 * - Position broadcasts on every queue change (join/leave/dequeue)
 *
 * Authentication is handled by the main RealtimeGateway;
 * this gateway shares the same Socket.IO server instance
 * via the same port (NestJS merges gateways on the same namespace).
 */
@WebSocketGateway({
  cors: {
    origin: frontendOrigins,
    credentials: true,
  },
})
export class QueueGateway {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger("QueueGateway");

  constructor(
    @Inject(forwardRef(() => QueueService))
    private readonly queueService: QueueService
  ) {}

  /**
   * Client joins a queue room to receive real-time updates.
   */
  @SubscribeMessage("queue:join_room")
  handleJoinRoom(
    @MessageBody() data: { campaignId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const roomId = `queue:${data.campaignId}`;
    client.join(roomId);
    this.logger.log(
      `Socket ${client.id} joined queue room: ${roomId}`,
    );
    return { status: "success" };
  }

  /**
   * Client leaves a queue room.
   */
  @SubscribeMessage("queue:leave_room")
  handleLeaveRoom(
    @MessageBody() data: { campaignId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const roomId = `queue:${data.campaignId}`;
    client.leave(roomId);
    return { status: "success" };
  }

  // ─── SERVER-SIDE BROADCAST METHODS ────────────────────────────────────────

  /**
   * Broadcast when a new user joins the queue.
   * Called from QueueService or QueueController after successful join.
   */
  broadcastQueueJoined(campaignId: string, entry: any) {
    const roomId = `queue:${campaignId}`;
    this.server.to(roomId).emit("queue:joined", {
      campaignId,
      entry,
    });
  }

  /**
   * Broadcast updated positions to all users in the queue room.
   * Called after any queue state change (join, leave, dequeue, skip).
   */
  async broadcastPositionUpdate(campaignId: string) {
    const roomId = `queue:${campaignId}`;
    const state = await this.queueService.getQueueState(campaignId);

    this.server.to(roomId).emit("queue:position_update", {
      campaignId,
      entries: state.entries.map((e: any) => ({
        id: e.id,
        userId: e.userId,
        userName: (e.user as any)?.name ?? "Unknown",
        status: e.status,
        position: e.position,
      })),
      waitingCount: state.waitingCount,
    });
  }

  /**
   * Notify a specific user that they are being called (position 1 → CALLING).
   */
  emitCallingToUser(campaignId: string, userId: string, consultationId: string, trtc?: any) {
    const roomId = `queue:${campaignId}`;
    // Broadcast to the room — the client filters by their own userId
    this.server.to(roomId).emit("queue:calling", {
      campaignId,
      userId,
      consultationId,
      trtc,
      message: "You're up! Dr. Pradeep is ready for your consultation.",
    });
  }

  /**
   * Notify the room that a user has been promoted to IN_CALL.
   */
  emitPromotedToInCall(campaignId: string, userId: string, consultationId: string, trtc?: any) {
    const roomId = `queue:${campaignId}`;
    this.server.to(roomId).emit("queue:promoted", {
      campaignId,
      userId,
      consultationId,
      trtc,
      message: "Your consultation is starting now.",
    });
  }
}
