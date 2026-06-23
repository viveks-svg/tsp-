import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { JwtService } from "@nestjs/jwt";
import { ConsultationsService } from "../modules/consultations/consultations.service";
import { CallService } from "../modules/consultations/call.service";

const frontendOrigins = (process.env.FRONTEND_URL ?? "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

/**
 * Authenticated WebSocket gateway.
 *
 * On connection the gateway verifies the JWT sent via
 * `auth.token` in the socket handshake. If verification fails
 * the socket is immediately disconnected.
 *
 * The verified user payload is attached to `client.data.user`
 * so downstream event handlers can trust it without the client
 * needing to send a `senderId`.
 */
@WebSocketGateway({
  cors: {
    origin: frontendOrigins,
    credentials: true,
  },
})
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  /**
   * Maps userId → Set<socketId> for routing call events to specific users.
   * A user may have multiple tabs/devices connected.
   */
  private userSockets = new Map<string, Set<string>>();

  /**
   * Maps consultationId → timeout handle for 30-second ringing timeouts.
   */
  private callTimeouts = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly consultationsService: ConsultationsService,
    private readonly callService: CallService,
    private readonly jwtService: JwtService,
  ) { }

  /**
   * Verify JWT on every new socket connection.
   * Expects the client to connect with:
   *   io(url, { auth: { token: "<accessToken>" } })
   */
  handleConnection(client: Socket) {
    try {
      let token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace("Bearer ", "");

      // Fallback: extract token from access_token cookie
      if (!token && client.handshake.headers?.cookie) {
        const cookieToken = client.handshake.headers.cookie
          .split(";")
          .map((c) => c.trim())
          .find((c) => c.startsWith("access_token="))
          ?.split("=")[1];
        if (cookieToken) {
          token = decodeURIComponent(cookieToken);
        }
      }

      if (!token) {
        console.warn(`Socket ${client.id} rejected — no token provided`);
        client.emit("auth_error", { message: "Authentication required" });
        client.disconnect(true);
        return;
      }

      const payload = this.jwtService.verify(token);

      // Attach user identity to socket for downstream handlers
      client.data.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      };

      // Register in user→socket map
      const userId = payload.sub;
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);

      console.log(
        `Client connected: ${client.id} (userId: ${userId})`,
      );
    } catch (err) {
      console.warn(
        `Socket ${client.id} rejected — invalid token: ${(err as Error).message}`,
      );
      client.emit("auth_error", { message: "Invalid or expired token" });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data?.user?.id ?? "unknown";

    // Remove from user→socket map
    if (userId !== "unknown") {
      const sockets = this.userSockets.get(userId);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.userSockets.delete(userId);

          // 15-second grace period for user reconnection
          setTimeout(async () => {
            const currentSockets = this.userSockets.get(userId);
            if (!currentSockets || currentSockets.size === 0) {
              console.log(`User ${userId} did not reconnect within grace period. Cleaning up calls.`);
              try {
                const activeSession = await this.callService.findActiveSessionForUser(userId);
                if (activeSession) {
                  console.log(`Ending active/ringing call session for disconnected user ${userId}`);
                  if (activeSession.status === "RINGING") {
                    await this.callService.markMissed(activeSession.consultationId);
                    this.server.to(`call:${activeSession.consultationId}`).emit("call:timeout", {
                      consultationId: activeSession.consultationId,
                    });
                  } else if (activeSession.status === "ACTIVE") {
                    const result = await this.callService.endCall(userId, activeSession.consultationId, "DISCONNECTED");
                    this.server.to(`call:${activeSession.consultationId}`).emit("call:ended", {
                      consultationId: activeSession.consultationId,
                      durationSeconds: result.durationSeconds,
                      endReason: "DISCONNECTED",
                    });
                  }
                }
              } catch (err) {
                console.error(`Failed to clean up call for disconnected user ${userId}:`, err);
              }
            }
          }, 15_000);
        }
      }
    }

    console.log(`Client disconnected: ${client.id} (userId: ${userId})`);
  }

  // ─────────────────────────────────────────────────────
  //  CHAT EVENTS (existing)
  // ─────────────────────────────────────────────────────

  @SubscribeMessage("join_thread")
  handleJoinThread(
    @MessageBody() data: { threadId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(data.threadId);
    console.log(`Socket ${client.id} joined thread room: ${data.threadId}`);
    return { status: "success" };
  }

  /**
   * Handle an incoming chat message.
   *
   * `senderId` is now derived from the JWT-verified
   * `client.data.user.id` — the client cannot spoof it.
   */
  @SubscribeMessage("chat_message")
  async handleChatMessage(
    @MessageBody() data: { threadId: string; content: string },
    @ConnectedSocket() client: Socket,
  ) {
    const senderId: string | undefined = client.data?.user?.id;

    if (!senderId) {
      return { status: "error", error: "Not authenticated" };
    }

    if (!data.threadId || !data.content) {
      return { status: "error", error: "Missing fields" };
    }

    const message = await this.consultationsService.saveMessage(
      data.threadId,
      senderId,
      data.content,
      "TEXT",
    );

    this.server.to(data.threadId).emit("chat_message", message);
    return { status: "sent", message };
  }

  @SubscribeMessage("end_session")
  handleEndSession(
    @MessageBody() data: { threadId: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.server
      .to(data.threadId)
      .emit("end_session", { threadId: data.threadId });
    return { status: "completed" };
  }

  // ─────────────────────────────────────────────────────
  //  CALL SIGNALING EVENTS
  // ─────────────────────────────────────────────────────

  /**
   * Join a call signaling room.
   * Both user and astrologer join this room to receive call events.
   */
  @SubscribeMessage("join_call")
  handleJoinCall(
    @MessageBody() data: { consultationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const roomId = `call:${data.consultationId}`;
    client.join(roomId);
    console.log(`Socket ${client.id} joined call room: ${roomId}`);
    return { status: "success" };
  }

  /**
   * User initiates a call → sends ringing notification to astrologer.
   * The call initiation (creating DB records) is done via REST API first.
   * This event handles the real-time signaling only.
   */
  @SubscribeMessage("call:initiate")
  async handleCallInitiate(
    @MessageBody() data: {
      consultationId: string;
      astrologerUserId: string;
      callerName: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data?.user?.id;
    if (!userId) {
      return { status: "error", error: "Not authenticated" };
    }

    const { consultationId, astrologerUserId, callerName } = data;

    // Join the call signaling room
    const roomId = `call:${consultationId}`;
    client.join(roomId);

    // Send incoming call notification to astrologer's connected sockets
    this.emitToUser(astrologerUserId, "call:incoming", {
      consultationId,
      callerName,
      callerUserId: userId,
    });

    // Start 30-second timeout
    this.startCallTimeout(consultationId, userId, astrologerUserId);

    console.log(`Call initiated: ${consultationId} by ${userId} to ${astrologerUserId}`);
    return { status: "ringing" };
  }

  /**
   * Astrologer accepts the incoming call.
   * REST endpoint handles the DB transition + userSig generation.
   * This event distributes the TRTC credentials to both parties.
   */
  @SubscribeMessage("call:accept")
  async handleCallAccept(
    @MessageBody() data: { consultationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const astrologerUserId = client.data?.user?.id;
    if (!astrologerUserId) {
      return { status: "error", error: "Not authenticated" };
    }

    const { consultationId } = data;

    // Clear the ringing timeout
    this.clearCallTimeout(consultationId);

    try {
      // Accept via the service (DB transition + token gen)
      const result = await this.callService.acceptCall(astrologerUserId, consultationId);

      // Join the call room
      const roomId = `call:${consultationId}`;
      client.join(roomId);

      // Send TRTC credentials to the user (caller)
      this.emitToUser(result.user.userId, "call:accepted", {
        consultationId,
        channelName: result.channelName,
        sdkAppId: result.sdkAppId,
        userSig: result.user.userSig,
        trtcUserId: result.user.trtcUserId,
        maxDurationSeconds: result.maxDurationSeconds,
      });

      // Send TRTC credentials to the astrologer
      this.emitToUser(result.astrologer.userId, "call:accepted", {
        consultationId,
        channelName: result.channelName,
        sdkAppId: result.sdkAppId,
        userSig: result.astrologer.userSig,
        trtcUserId: result.astrologer.trtcUserId,
        maxDurationSeconds: result.maxDurationSeconds,
      });

      console.log(`Call accepted: ${consultationId} by ${astrologerUserId}`);
      return { status: "accepted" };
    } catch (err) {
      console.error(`Call accept failed: ${(err as Error).message}`);
      return { status: "error", error: (err as Error).message };
    }
  }

  /**
   * Astrologer rejects the incoming call.
   */
  @SubscribeMessage("call:reject")
  async handleCallReject(
    @MessageBody() data: { consultationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const astrologerUserId = client.data?.user?.id;
    if (!astrologerUserId) {
      return { status: "error", error: "Not authenticated" };
    }

    const { consultationId } = data;

    // Clear the ringing timeout
    this.clearCallTimeout(consultationId);

    try {
      await this.callService.rejectCall(astrologerUserId, consultationId);

      // Notify the caller
      const roomId = `call:${consultationId}`;
      this.server.to(roomId).emit("call:rejected", { consultationId });

      console.log(`Call rejected: ${consultationId} by ${astrologerUserId}`);
      return { status: "rejected" };
    } catch (err) {
      console.error(`Call reject failed: ${(err as Error).message}`);
      return { status: "error", error: (err as Error).message };
    }
  }

  /**
   * Either party ends the active call.
   */
  @SubscribeMessage("call:end")
  async handleCallEnd(
    @MessageBody() data: { consultationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data?.user?.id;
    if (!userId) {
      return { status: "error", error: "Not authenticated" };
    }

    const { consultationId } = data;

    try {
      const result = await this.callService.endCall(userId, consultationId);
      const endResult = result as Record<string, any>;

      // Notify both parties
      const roomId = `call:${consultationId}`;
      this.server.to(roomId).emit("call:ended", {
        consultationId,
        durationSeconds: endResult.durationSeconds,
        durationMin: endResult.durationMin,
        cost: endResult.cost,
        endReason: endResult.endReason,
      });

      console.log(`Call ended: ${consultationId} by ${userId}, duration: ${endResult.durationSeconds}s`);
      return { status: "ended", consultationId, durationSeconds: endResult.durationSeconds };
    } catch (err) {
      console.error(`Call end failed: ${(err as Error).message}`);
      return { status: "error", error: (err as Error).message };
    }
  }

  /**
   * Toggle mute/camera — sync state to the other party.
   */
  @SubscribeMessage("call:toggle_media")
  handleToggleMedia(
    @MessageBody() data: {
      consultationId: string;
      audio?: boolean;
      video?: boolean;
    },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data?.user?.id;
    if (!userId) {
      return { status: "error", error: "Not authenticated" };
    }

    const roomId = `call:${data.consultationId}`;
    // Broadcast to the room (excluding sender)
    client.to(roomId).emit("call:media_toggled", {
      consultationId: data.consultationId,
      userId,
      audio: data.audio,
      video: data.video,
    });

    return { status: "success" };
  }

  // ─────────────────────────────────────────────────────
  //  HELPERS
  // ─────────────────────────────────────────────────────

  /**
   * Emit an event to all sockets belonging to a specific user.
   */
  private emitToUser(userId: string, event: string, payload: any) {
    const sockets = this.userSockets.get(userId);
    if (!sockets || sockets.size === 0) {
      console.warn(`No connected sockets for user ${userId}, event ${event} not delivered`);
      return;
    }

    for (const socketId of sockets) {
      this.server.to(socketId).emit(event, payload);
    }
  }

  /**
   * Start a 30-second ringing timeout for a call.
   * If the astrologer doesn't respond, both parties are notified and the call is marked MISSED.
   */
  private startCallTimeout(
    consultationId: string,
    callerUserId: string,
    astrologerUserId: string,
  ) {
    // Clear any existing timeout for this call
    this.clearCallTimeout(consultationId);

    const timeout = setTimeout(async () => {
      this.callTimeouts.delete(consultationId);

      try {
        // Mark as missed in DB
        await this.callService.markMissed(consultationId);

        // Notify both parties
        const roomId = `call:${consultationId}`;
        this.server.to(roomId).emit("call:timeout", { consultationId });
        this.emitToUser(callerUserId, "call:timeout", { consultationId });
        this.emitToUser(astrologerUserId, "call:timeout", { consultationId });

        console.log(`Call timeout: ${consultationId}`);
      } catch (err) {
        console.error(`Call timeout handling failed: ${(err as Error).message}`);
      }
    }, 30_000);

    this.callTimeouts.set(consultationId, timeout);
  }

  /**
   * Clear a ringing timeout.
   */
  private clearCallTimeout(consultationId: string) {
    const existing = this.callTimeouts.get(consultationId);
    if (existing) {
      clearTimeout(existing);
      this.callTimeouts.delete(consultationId);
    }
  }
}
