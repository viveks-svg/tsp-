"use client";

import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useCallStore } from "../store/call.store";
import { useAuth } from "@/providers/AuthProvider";
import { apiClient } from "@/lib/http/client";

let sharedSocket: Socket | null = null;
let sharedSocketRefs = 0;
let listenersBound = false;

/** Token fetched from the backend's /auth/ws-token endpoint */
let cachedWsToken: string | null = null;
let tokenFetchPromise: Promise<string | null> | null = null;

function getSocketUrl() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";
  return apiUrl.replace(/\/api\/v1\/?$/, "");
}

/**
 * Fetch the WebSocket auth token from the backend.
 * Uses apiClient so the request goes through the Next.js proxy (/api/...),
 * which ensures the same-origin httpOnly cookie is sent correctly.
 */
async function fetchWsToken(): Promise<string | null> {
  if (cachedWsToken) return cachedWsToken;
  if (tokenFetchPromise) return tokenFetchPromise;

  tokenFetchPromise = (async () => {
    try {
      const data = await apiClient.get<{ token: string | null }>("/auth/ws-token");
      cachedWsToken = data.token || null;
      console.log("[CallSocket] ws-token fetched via proxy:", cachedWsToken ? "OK" : "null");
      return cachedWsToken;
    } catch (err) {
      console.error("[CallSocket] ws-token fetch error:", err);
      return null;
    } finally {
      tokenFetchPromise = null;
    }
  })();

  return tokenFetchPromise;
}

function bindCallSocketListeners(socket: Socket) {
  if (listenersBound) return;
  listenersBound = true;

  socket.on("connect", () => {
    console.log("[CallSocket] Connected:", socket.id, "| transport:", socket.io.engine?.transport?.name);
    const currentConsId = useCallStore.getState().consultationId;
    if (currentConsId) {
      console.log(`[CallSocket] Rejoining call room on reconnect: ${currentConsId}`);
      socket.emit("join_call", { consultationId: currentConsId });
    }
  });

  socket.on("auth_error", (data) => {
    console.warn("[CallSocket] Auth error:", data?.message ?? data);
    // Token might have expired — clear cache so next attempt fetches fresh
    cachedWsToken = null;
    useCallStore.getState().setFailed("SOCKET_AUTH_FAILED");
  });

  socket.on("connect_error", (error) => {
    console.warn("[CallSocket] Connect error:", error.message);
  });

  socket.on("disconnect", (reason) => {
    console.log(`[CallSocket] Disconnected — reason: ${reason}`);
  });

  socket.on("reconnect_attempt", (attempt) => {
    console.log(`[CallSocket] Reconnect attempt #${attempt}`);
  });

  socket.on("call:incoming", (data) => {
    console.log(`[CALL:${data.consultationId}] Incoming call from ${data.callerName}`);
    useCallStore.getState().setIncomingCall({
      consultationId: data.consultationId,
      callerName: data.callerName,
      callerUserId: data.callerUserId,
    });
  });

  socket.on("call:accepted", (data) => {
    console.log(`[CALL:${data.consultationId}] Call accepted — connecting to TRTC`);
    useCallStore.getState().setConnecting({
      channelName: data.channelName,
      userSig: data.userSig,
      trtcUserId: data.trtcUserId,
      sdkAppId: data.sdkAppId,
      maxDurationSeconds: data.maxDurationSeconds,
    });
  });

  socket.on("call:rejected", (data) => {
    console.log(`[CALL:${data?.consultationId}] Call rejected — reason: ${data?.endReason || "REJECTED"}`);
    const store = useCallStore.getState();
    store.setEnded(data?.endReason || "REJECTED");
    store.setIncomingCall(null);
  });

  socket.on("call:ended", (data) => {
    console.log(
      `[CALL:${data.consultationId}] Call ended — reason: ${data.endReason || "CALL_ENDED"}, ` +
      `duration: ${data.durationSeconds ?? 0}s`,
    );
    useCallStore.getState().setEnded(data.endReason || "CALL_ENDED");
  });

  socket.on("call:timeout", (data) => {
    console.log(`[CALL:${data?.consultationId}] Call timeout — reason: ${data?.endReason || "TIMEOUT"}`);
    const store = useCallStore.getState();
    store.setEnded(data?.endReason || "TIMEOUT_NO_ANSWER");
    store.setIncomingCall(null);
  });

  socket.on("call:busy", () => {
    console.log("[CallSocket] Astrologer busy");
    useCallStore.getState().setEnded("BUSY");
  });

  socket.on("call:media_toggled", (data) => {
    useCallStore.getState().setRemoteMediaState(
      data.audio !== undefined ? data.audio : true,
      data.video !== undefined ? data.video : true,
    );
  });
}

/**
 * Create the shared socket with a valid auth token.
 *
 * Uses WebSocket-only transport because Railway doesn't support sticky
 * sessions needed for HTTP long-polling. Authentication is handled via
 * an explicit token (fetched from /auth/ws-token), not cookies.
 */
function createSocket(token: string): Socket {
  const socketUrl = getSocketUrl();
  console.log(`[CallSocket] Creating socket — url: ${socketUrl}, hasToken: true`);

  const socket = io(socketUrl, {
    transports: ["websocket"],
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    withCredentials: true,
    auth: { token },
  });

  bindCallSocketListeners(socket);
  return socket;
}

/**
 * Tear down the shared socket completely.
 */
function destroySharedSocket() {
  if (sharedSocket) {
    sharedSocket.disconnect();
    sharedSocket.removeAllListeners();
    sharedSocket = null;
    listenersBound = false;
  }
}

/**
 * Get or create the shared socket. If the socket doesn't exist yet,
 * this will fetch a token and create it. Returns null if no token is available.
 */
function getSharedSocket(): Socket | null {
  return sharedSocket;
}

/**
 * Hook that manages Socket.io call signaling events.
 * Connects to the server, listens for call events, and provides
 * emit functions for initiating/accepting/rejecting/ending/cancelling calls.
 *
 * The socket connection is deferred until a valid auth token is fetched
 * from the backend's /auth/ws-token endpoint. This ensures the WebSocket
 * always authenticates successfully on production.
 */
export function useCallSocket(): {
  initiateCall: (consId: string, astrologerUserId: string, callerName: string) => void;
  acceptCall: (consId: string) => void;
  rejectCall: (consId: string) => void;
  endCall: (consId: string) => void;
  cancelCall: (consId: string) => void;
  toggleMedia: (consId: string, audio?: boolean, video?: boolean) => void;
  joinCallRoom: (consId: string) => void;
} {
  const socketRef = useRef<Socket | null>(null);
  const { isAuthenticated } = useAuth();

  const { setRinging, setIncomingCall, consultationId } = useCallStore();

  // Connect the shared socket on mount — but only after fetching a token.
  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;
    sharedSocketRefs += 1;

    const connect = async () => {
      // If socket already exists and is connected, reuse it
      if (sharedSocket?.connected) {
        socketRef.current = sharedSocket;
        return;
      }

      // Fetch token from the backend
      const token = await fetchWsToken();
      if (cancelled) return;

      if (!token) {
        console.warn("[CallSocket] No ws-token available — socket not connected");
        return;
      }

      // Create socket with the fetched token
      if (!sharedSocket) {
        sharedSocket = createSocket(token);
      }
      socketRef.current = sharedSocket;
    };

    void connect();

    return () => {
      cancelled = true;
      sharedSocketRefs = Math.max(0, sharedSocketRefs - 1);
      if (sharedSocketRefs === 0) {
        destroySharedSocket();
        cachedWsToken = null;
      }
      socketRef.current = null;
    };
  }, [isAuthenticated]);

  // Join signaling room when consultationId changes.
  useEffect(() => {
    if (socketRef.current && consultationId) {
      console.log("[CallSocket] Joining call room on consultationId change:", consultationId);
      socketRef.current.emit("join_call", { consultationId });
    }
  }, [consultationId]);

  /**
   * Get a connected socket, fetching token if needed.
   * All emit functions go through this to ensure the socket is ready.
   */
  const getSocket = useCallback(async (): Promise<Socket> => {
    if (sharedSocket?.connected) return sharedSocket;

    // Need to (re)connect
    const token = await fetchWsToken();
    if (!token) {
      throw new Error("No auth token available for socket connection");
    }

    if (!sharedSocket) {
      sharedSocket = createSocket(token);
    }
    socketRef.current = sharedSocket;
    return sharedSocket;
  }, []);

  /**
   * Synchronous socket getter for fire-and-forget emits.
   * Falls back to async token fetch if socket isn't ready.
   */
  const emitOrDefer = useCallback(
    (event: string, data: any) => {
      if (sharedSocket?.connected) {
        sharedSocket.emit(event, data);
      } else {
        // Socket not ready — fetch token and connect first
        void getSocket().then((socket) => {
          socket.emit(event, data);
        }).catch((err) => {
          console.error(`[CallSocket] Failed to emit ${event}:`, err);
        });
      }
    },
    [getSocket],
  );

  const initiateCall = useCallback(
    (consId: string, astrologerUserId: string, callerName: string) => {
      console.log(`[CALL:${consId}] Emitting call:initiate to ${astrologerUserId}`);
      emitOrDefer("call:initiate", {
        consultationId: consId,
        astrologerUserId,
        callerName,
      });
      setRinging();
    },
    [setRinging, emitOrDefer],
  );

  const acceptCall = useCallback(
    (consId: string) => {
      console.log(`[CALL:${consId}] Emitting call:accept`);
      emitOrDefer("call:accept", {
        consultationId: consId,
      });
      setIncomingCall(null);
    },
    [setIncomingCall, emitOrDefer],
  );

  const rejectCall = useCallback(
    (consId: string) => {
      console.log(`[CALL:${consId}] Emitting call:reject`);
      emitOrDefer("call:reject", {
        consultationId: consId,
      });
      setIncomingCall(null);
    },
    [setIncomingCall, emitOrDefer],
  );

  const endCall = useCallback((consId: string) => {
    console.log(`[CALL:${consId}] Emitting call:end`);
    emitOrDefer("call:end", {
      consultationId: consId,
    });
  }, [emitOrDefer]);

  /**
   * Cancel a ringing call (caller-side only).
   * Distinct from endCall which is for active calls.
   */
  const cancelCall = useCallback((consId: string) => {
    console.log(`[CALL:${consId}] Emitting call:cancel`);
    emitOrDefer("call:cancel", {
      consultationId: consId,
    });
  }, [emitOrDefer]);

  const toggleMedia = useCallback((consId: string, audio?: boolean, video?: boolean) => {
    emitOrDefer("call:toggle_media", {
      consultationId: consId,
      audio,
      video,
    });
  }, [emitOrDefer]);

  const joinCallRoom = useCallback((consId: string) => {
    emitOrDefer("join_call", {
      consultationId: consId,
    });
  }, [emitOrDefer]);

  return {
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    cancelCall,
    toggleMedia,
    joinCallRoom,
  };
}

export function useSocketListener(event: string, callback: (data: any) => void) {
  useEffect(() => {
    if (sharedSocket) {
      sharedSocket.on(event, callback);
    }
    return () => {
      if (sharedSocket) {
        sharedSocket.off(event, callback);
      }
    };
  }, [event, callback]);
}