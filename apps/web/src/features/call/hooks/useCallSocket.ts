"use client";

import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useCallStore } from "../store/call.store";
import { useAuth } from "@/providers/AuthProvider";

let sharedSocket: Socket | null = null;
let sharedSocketRefs = 0;
let listenersBound = false;

function getSocketUrl() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";
  return apiUrl.replace(/\/api\/v1\/?$/, "");
}

function bindCallSocketListeners(socket: Socket) {
  if (listenersBound) return;
  listenersBound = true;

  socket.on("connect", () => {
    console.log("[CallSocket] Connected:", socket.id);
    const currentConsId = useCallStore.getState().consultationId;
    if (currentConsId) {
      console.log(`[CallSocket] Rejoining call room on reconnect: ${currentConsId}`);
      socket.emit("join_call", { consultationId: currentConsId });
    }
  });

  socket.on("auth_error", (data) => {
    console.warn("[CallSocket] Auth error:", data?.message ?? data);
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

function ensureCallSocket(token: string | null) {
  if (sharedSocket) return sharedSocket;

  sharedSocket = io(getSocketUrl(), {
    transports: ["websocket"],
    reconnectionAttempts: 5,
    withCredentials: true,
    auth: token ? { token } : undefined,
  });

  bindCallSocketListeners(sharedSocket);
  return sharedSocket;
}

/**
 * Hook that manages Socket.io call signaling events.
 * Connects to the server, listens for call events, and provides
 * emit functions for initiating/accepting/rejecting/ending/cancelling calls.
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
  const { accessToken } = useAuth();
  const tokenRef = useRef(accessToken);

  useEffect(() => {
    tokenRef.current = accessToken;
  }, [accessToken]);

  const { setRinging, setIncomingCall, consultationId } = useCallStore();

  // Connect the shared socket on mount. Multiple consumers reuse one connection.
  useEffect(() => {
    const socket = ensureCallSocket(tokenRef.current);
    sharedSocketRefs += 1;
    socketRef.current = socket;

    return () => {
      sharedSocketRefs = Math.max(0, sharedSocketRefs - 1);
      if (sharedSocketRefs === 0) {
        socket.disconnect();
        socket.removeAllListeners();
        sharedSocket = null;
        listenersBound = false;
      }
      socketRef.current = null;
    };
  }, []);

  // Join signaling room when consultationId changes.
  useEffect(() => {
    if (socketRef.current && consultationId) {
      console.log("[CallSocket] Joining call room on consultationId change:", consultationId);
      socketRef.current.emit("join_call", { consultationId });
    }
  }, [consultationId]);

  const getToken = useCallback(() => tokenRef.current, []);

  const initiateCall = useCallback(
    (consId: string, astrologerUserId: string, callerName: string) => {
      console.log(`[CALL:${consId}] Emitting call:initiate to ${astrologerUserId}`);
      ensureCallSocket(getToken()).emit("call:initiate", {
        consultationId: consId,
        astrologerUserId,
        callerName,
      });
      setRinging();
    },
    [setRinging, getToken],
  );

  const acceptCall = useCallback(
    (consId: string) => {
      console.log(`[CALL:${consId}] Emitting call:accept`);
      ensureCallSocket(getToken()).emit("call:accept", {
        consultationId: consId,
      });
      setIncomingCall(null);
    },
    [setIncomingCall, getToken],
  );

  const rejectCall = useCallback(
    (consId: string) => {
      console.log(`[CALL:${consId}] Emitting call:reject`);
      ensureCallSocket(getToken()).emit("call:reject", {
        consultationId: consId,
      });
      setIncomingCall(null);
    },
    [setIncomingCall, getToken],
  );

  const endCall = useCallback((consId: string) => {
    console.log(`[CALL:${consId}] Emitting call:end`);
    ensureCallSocket(getToken()).emit("call:end", {
      consultationId: consId,
    });
  }, [getToken]);

  /**
   * Cancel a ringing call (caller-side only).
   * Distinct from endCall which is for active calls.
   */
  const cancelCall = useCallback((consId: string) => {
    console.log(`[CALL:${consId}] Emitting call:cancel`);
    ensureCallSocket(getToken()).emit("call:cancel", {
      consultationId: consId,
    });
  }, [getToken]);

  const toggleMedia = useCallback((consId: string, audio?: boolean, video?: boolean) => {
    ensureCallSocket(getToken()).emit("call:toggle_media", {
      consultationId: consId,
      audio,
      video,
    });
  }, [getToken]);

  const joinCallRoom = useCallback((consId: string) => {
    ensureCallSocket(getToken()).emit("join_call", {
      consultationId: consId,
    });
  }, [getToken]);

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