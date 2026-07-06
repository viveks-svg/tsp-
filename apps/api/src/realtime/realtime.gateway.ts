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
import { Logger } from "@nestjs/common";
import { ConsultationsService } from "../modules/consultations/consultations.service";
import { CallService } from "../modules/consultations/call.service";

const frontendOrigins = (process.env.FRONTEND_URL ?? "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// Always include localhost for development
if (!frontendOrigins.includes("http://localhost:3000")) {
  frontendOrigins.push("http://localhost:3000");
}

// Log at module load so it's visible in Railway deploy logs
console.log("[RealtimeGateway] CORS origins:", frontendOrigins);

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

  private readonly logger = new Logger("RealtimeGateway");

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
        this.logger.warn(`Socket ${client.id} rejected — no token provided`);
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

      this.logger.log(
        `Client connected: ${client.id} (userId: ${userId}, sockets: ${this.userSockets.get(userId)!.size})`,
      );
    } catch (err) {
      this.logger.warn(
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
          this.logger.log(`[DISCONNECT] User ${userId} has 0 sockets — starting 15s grace period`);
          setTimeout(async () => {
            const currentSockets = this.userSockets.get(userId);
            if (!currentSockets || currentSockets.size === 0) {
              this.logger.log(`[DISCONNECT] User ${userId} did not reconnect within grace period. Cleaning up calls.`);
              try {
                const activeSession = await this.callService.findActiveSessionForUser(userId);
                if (activeSession) {
                  this.logger.log(
                    `[CALL:${activeSession.consultationId}] Ending call for disconnected user ${userId} (status: ${activeSession.status})`,
                  );
                  if (activeSession.status === "RINGING") {
                    await this.callService.markMissed(activeSession.consultationId);
                    this.server.to(`call:${activeSession.consultationId}`).emit("call:timeout", {
                      consultationId: activeSession.consultationId,
                      endReason: "DISCONNECTED",
                    });
                  } else if (activeSession.status === "ACTIVE") {
                    const result = await this.callService.endCall(userId, activeSession.consultationId, "DISCONNECTED");
                    this.server.to(`call:${activeSession.consultationId}`).emit("call:ended", {
                      consultationId: activeSession.consultationId,
                      durationSeconds: (result as any).durationSeconds,
                      endReason: "DISCONNECTED",
                    });
                  }
                }
              } catch (err) {
                this.logger.error(`Failed to clean up call for disconnected user ${userId}: ${(err as Error).message}`);
              }
            } else {
              this.logger.log(`[DISCONNECT] User ${userId} reconnected (${currentSockets.size} sockets) — no cleanup needed`);
            }
          }, 15_000);
        } else {
          this.logger.log(
            `Client disconnected: ${client.id} (userId: ${userId}, remaining sockets: ${sockets.size})`,
          );
        }
      }
    }

    this.logger.log(`Client disconnected: ${client.id} (userId: ${userId})`);
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
    this.logger.log(`Socket ${client.id} joined thread room: ${data.threadId}`);
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
    this.logger.log(`[CALL:${data.consultationId}] Socket ${client.id} joined call room`);
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

    // Also add astrologer's existing sockets to the call room
    // so they receive room-broadcast events even if emitToUser fails
    const astroSockets = this.userSockets.get(astrologerUserId);
    if (astroSockets) {
      for (const socketId of astroSockets) {
        const astroSocket = this.server.sockets.sockets.get(socketId);
        if (astroSocket) {
          astroSocket.join(roomId);
          this.logger.log(
            `[CALL:${consultationId}] Pre-joined astrologer socket ${socketId} to call room`,
          );
        }
      }
    }

    // Send incoming call notification to astrologer's connected sockets
    this.emitToUser(astrologerUserId, "call:incoming", {
      consultationId,
      callerName,
      callerUserId: userId,
    });

    // Start 30-second timeout (server-authoritative)
    this.startCallTimeout(consultationId, userId, astrologerUserId);

    this.logger.log(
      `[CALL:${consultationId}] Initiated signaling — caller=${userId}, callee=${astrologerUserId}, ` +
      `callerSocket=${client.id}, astroSocketsFound=${astroSockets?.size ?? 0}`,
    );
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

      // Send TRTC credentials to the user (caller) via direct socket mapping
      this.emitToUser(result.user.userId, "call:accepted", {
        consultationId,
        channelName: result.channelName,
        sdkAppId: result.sdkAppId,
        userSig: result.user.userSig,
        trtcUserId: result.user.trtcUserId,
        maxDurationSeconds: result.maxDurationSeconds,
      });

      // Send TRTC credentials to the astrologer via direct socket mapping
      this.emitToUser(result.astrologer.userId, "call:accepted", {
        consultationId,
        channelName: result.channelName,
        sdkAppId: result.sdkAppId,
        userSig: result.astrologer.userSig,
        trtcUserId: result.astrologer.trtcUserId,
        maxDurationSeconds: result.maxDurationSeconds,
      });

      // The emitToUser method is robust enough since we now manage sockets correctly.
      // We do not broadcast to the room here because sending the exact same payload 
      // (with a single userSig) to both parties causes a TRTC Kick error.
      this.logger.log(`[CALL:${consultationId}] Accepted via signaling by ${astrologerUserId}`);

      // Start timeout for max duration
      this.startActiveCallTimeout(
        consultationId,
        result.user.userId,
        astrologerUserId,
        result.maxDurationSeconds,
      );

      return { status: "accepted" };
    } catch (err) {
      this.logger.error(`[CALL:${consultationId}] Accept failed: ${(err as Error).message}`);
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
      this.server.to(roomId).emit("call:rejected", {
        consultationId,
        endReason: "ASTROLOGER_REJECTED",
      });

      this.logger.log(`[CALL:${consultationId}] Rejected by ${astrologerUserId}`);
      return { status: "rejected" };
    } catch (err) {
      this.logger.error(`[CALL:${consultationId}] Reject failed: ${(err as Error).message}`);
      return { status: "error", error: (err as Error).message };
    }
  }

  /**
   * Caller cancels a ringing call before the callee accepts.
   * This is the correct event for the caller to cancel — NOT call:end.
   */
  @SubscribeMessage("call:cancel")
  async handleCallCancel(
    @MessageBody() data: { consultationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data?.user?.id;
    if (!userId) {
      return { status: "error", error: "Not authenticated" };
    }

    const { consultationId } = data;

    // Clear the ringing timeout (no need for it anymore)
    this.clearCallTimeout(consultationId);

    try {
      const result = await this.callService.cancelCall(userId, consultationId);

      // Notify all parties in the call room (including callee)
      const roomId = `call:${consultationId}`;
      this.server.to(roomId).emit("call:ended", {
        consultationId,
        endReason: "CALLER_CANCELLED",
      });

      this.logger.log(`[CALL:${consultationId}] Cancelled by caller ${userId}`);
      return { status: "cancelled" };
    } catch (err) {
      this.logger.error(`[CALL:${consultationId}] Cancel failed: ${(err as Error).message}`);
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

    // Also clear any ringing timeout (in case of race)
    this.clearCallTimeout(consultationId);

    try {
      const result = await this.callService.endCall(userId, consultationId);
      const endResult = result as Record<string, any>;

      // Only notify room if the call was actually transitioned (not a no-op)
      if (endResult.status === "COMPLETED" || endResult.status === "CANCELLED") {
        const roomId = `call:${consultationId}`;
        this.server.to(roomId).emit("call:ended", {
          consultationId,
          durationSeconds: endResult.durationSeconds,
          durationMin: endResult.durationMin,
          cost: endResult.cost,
          endReason: endResult.endReason,
        });
      } else {
        this.logger.log(
          `[CALL:${consultationId}] endCall was no-op (status: ${endResult.status}) — not re-emitting call:ended`,
        );
      }

      this.logger.log(
        `[CALL:${consultationId}] End by ${userId} — status: ${endResult.status}, ` +
        `duration: ${endResult.durationSeconds ?? 0}s, reason: ${endResult.endReason}`,
      );
      return { status: "ended", consultationId, durationSeconds: endResult.durationSeconds };
    } catch (err) {
      this.logger.error(`[CALL:${consultationId}] End failed: ${(err as Error).message}`);
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
      this.logger.warn(
        `[CALL:${payload?.consultationId ?? "?"}] No connected sockets for user ${userId}, event ${event} not delivered`,
      );
      return;
    }

    for (const socketId of sockets) {
      this.server.to(socketId).emit(event, payload);
    }
  }

  /**
   * Start a 30-second ringing timeout for a call (server-authoritative).
   * If the astrologer doesn't respond, both parties are notified and the call is marked MISSED.
   *
   * This timeout is the SINGLE source of truth for ringing expiry — the client
   * does NOT independently time out calls.
   */
  private startCallTimeout(
    consultationId: string,
    callerUserId: string,
    astrologerUserId: string,
  ) {
    // Clear any existing timeout for this call
    this.clearCallTimeout(consultationId);

    const CALL_RING_TIMEOUT_MS = 30_000; // 30 seconds

    const timeout = setTimeout(async () => {
      this.callTimeouts.delete(consultationId);

      try {
        // Mark as missed in DB (uses conditional update — no-op if already transitioned)
        await this.callService.markMissed(consultationId);

        // Notify via the call room (single emit — both parties are in the room)
        const roomId = `call:${consultationId}`;
        this.server.to(roomId).emit("call:timeout", {
          consultationId,
          endReason: "TIMEOUT_NO_ANSWER",
        });

        // Also emit directly to both users in case they aren't in the room yet
        this.emitToUser(callerUserId, "call:timeout", {
          consultationId,
          endReason: "TIMEOUT_NO_ANSWER",
        });
        this.emitToUser(astrologerUserId, "call:timeout", {
          consultationId,
          endReason: "TIMEOUT_NO_ANSWER",
        });

        this.logger.log(`[CALL:${consultationId}] Ringing timeout after ${CALL_RING_TIMEOUT_MS}ms`);
      } catch (err) {
        this.logger.error(`[CALL:${consultationId}] Timeout handling failed: ${(err as Error).message}`);
      }
    }, CALL_RING_TIMEOUT_MS);

    this.callTimeouts.set(consultationId, timeout);
    this.logger.log(`[CALL:${consultationId}] Ringing timeout scheduled — ${CALL_RING_TIMEOUT_MS}ms`);
  }

  /**
   * Start a timeout for an active call based on the user's maximum affordable duration.
   * Forces the call to end if it exceeds the maximum time + grace period.
   */
  private startActiveCallTimeout(
    consultationId: string,
    callerUserId: string,
    astrologerUserId: string,
    maxDurationSeconds: number,
  ) {
    this.clearCallTimeout(consultationId);

    // Add 3 seconds grace period to allow frontend to disconnect gracefully first
    const timeoutMs = (maxDurationSeconds + 3) * 1000;

    const timeout = setTimeout(async () => {
      this.callTimeouts.delete(consultationId);

      try {
        this.logger.log(`[CALL:${consultationId}] Max duration reached. Forcefully ending call.`);

        // Use callerUserId to end the call on their behalf due to insufficient balance
        const result = await this.callService.endCall(callerUserId, consultationId, "INSUFFICIENT_BALANCE");

        const roomId = `call:${consultationId}`;
        this.server.to(roomId).emit("call:ended", {
          consultationId,
          endReason: "INSUFFICIENT_BALANCE",
          durationSeconds: result.durationSeconds,
        });

      } catch (err) {
        this.logger.error(
          `[CALL:${consultationId}] Failed to forcefully end active call: ${(err as Error).message}`,
        );
      }
    }, timeoutMs);

    this.callTimeouts.set(consultationId, timeout);
    this.logger.log(`[CALL:${consultationId}] Active call timeout scheduled — ${timeoutMs}ms`);
  }

  /**
   * Clear a ringing timeout.
   */
  private clearCallTimeout(consultationId: string) {
    const existing = this.callTimeouts.get(consultationId);
    if (existing) {
      clearTimeout(existing);
      this.callTimeouts.delete(consultationId);
      this.logger.log(`[CALL:${consultationId}] Ringing timeout cleared`);
    }
  }
}
