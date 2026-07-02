"use client";

import { useRef, useCallback, useEffect } from "react";
import type TRTC from "trtc-sdk-v5";
import { useCallStore } from "../store/call.store";

/**
 * Hook that manages the Tencent TRTC client lifecycle.
 * Handles joining/leaving rooms, local/remote tracks,
 * and connection state changes.
 *
 * Replaces the former useAgoraClient hook.
 */
export function useTrtcClient() {
  const trtcRef = useRef<TRTC | null>(null);
  const isJoiningOrJoinedRef = useRef<boolean>(false);

  const {
    setActive,
    setRemoteUid,
    setFailed,
    isAudioMuted,
    isVideoMuted,
  } = useCallStore();

  /**
   * Create the TRTC instance (once).
   */
  const getTrtc = useCallback(() => {
    if (!trtcRef.current) {
      const TRTC_SDK = require("trtc-sdk-v5").default || require("trtc-sdk-v5");
      trtcRef.current = TRTC_SDK.create();
    }
    return trtcRef.current;
  }, []);

  /**
   * Join a TRTC room and publish local audio/video.
   */
  const joinRoom = useCallback(
    async (
      sdkAppId: number,
      roomId: string,
      userSig: string,
      userId: string,
      localVideoContainer: HTMLDivElement | null,
      remoteVideoContainer: HTMLDivElement | null,
    ) => {
      if (isJoiningOrJoinedRef.current) {
        console.warn("[TRTC] Already joining or joined room, ignoring duplicate joinRoom call.");
        return;
      }
      isJoiningOrJoinedRef.current = true;
      try {
        const TRTC = require("trtc-sdk-v5").default || require("trtc-sdk-v5");
        const trtc = getTrtc();

        if (!trtc) {
          throw new Error("TRTC client failed to initialize.");
        }

        // Listen for remote stream events
        trtc.on(TRTC.EVENT.REMOTE_VIDEO_AVAILABLE, ({ userId: remoteUserId }: { userId: string }) => {
          console.log(`[TRTC] Remote video available: ${remoteUserId}`);
          if (remoteVideoContainer) {
            trtc.startRemoteVideo({
              userId: remoteUserId,
              view: remoteVideoContainer,
              streamType: TRTC.TYPE.STREAM_TYPE_MAIN,
            });
          }
          setRemoteUid(remoteUserId);
        });

        trtc.on(TRTC.EVENT.REMOTE_VIDEO_UNAVAILABLE, ({ userId: remoteUserId }: { userId: string }) => {
          console.log(`[TRTC] Remote video unavailable: ${remoteUserId}`);
          trtc.stopRemoteVideo({ userId: remoteUserId });
          if (remoteVideoContainer) {
            remoteVideoContainer.innerHTML = "";
          }
        });

        trtc.on(TRTC.EVENT.REMOTE_AUDIO_AVAILABLE, ({ userId: remoteUserId }: { userId: string }) => {
          console.log(`[TRTC] Remote audio available: ${remoteUserId}`);
          // TRTC auto-plays remote audio by default after subscribing
        });

        trtc.on(TRTC.EVENT.REMOTE_USER_EXIT, ({ userId: remoteUserId }: { userId: string }) => {
          console.log(`[TRTC] Remote user exited: ${remoteUserId}`);
          setRemoteUid(null);
          if (remoteVideoContainer) {
            remoteVideoContainer.innerHTML = "";
          }
        });

        trtc.on(TRTC.EVENT.CONNECTION_STATE_CHANGED, (event: { prevState: string; state: string }) => {
          console.log(`[TRTC] Connection: ${event.prevState} → ${event.state}`);
        });

        // Enter the room — TRTC uses string room IDs via strRoomId
        await trtc.enterRoom({
          sdkAppId,
          userId,
          userSig,
          roomId: 0, // We use strRoomId below
          strRoomId: roomId,
        });

        // Start local audio + video
        try {
          await trtc.startLocalAudio();

          if (localVideoContainer) {
            await trtc.startLocalVideo({
              view: localVideoContainer,
            });
          }

          setActive();
        } catch (err) {
          console.error("[TRTC] Failed to start local media:", err);
          // Try audio-only fallback
          try {
            await trtc.startLocalAudio();
            setActive();
          } catch (audioErr) {
            console.error("[TRTC] Failed to start audio:", audioErr);
            setFailed("MEDIA_ACCESS_DENIED");
          }
        }
      } catch (globalErr) {
        console.error("[TRTC] Global join room failure:", globalErr);
        isJoiningOrJoinedRef.current = false;
        setFailed("CONNECTION_FAILED");
      }
    },
    [getTrtc, setActive, setRemoteUid, setFailed],
  );

  /**
   * Leave the TRTC room and clean up all tracks.
   */
  const leaveRoom = useCallback(async () => {
    isJoiningOrJoinedRef.current = false;
    const trtc = trtcRef.current;
    if (trtc) {
      try {
        await trtc.stopLocalVideo();
        await trtc.stopLocalAudio();
        await trtc.exitRoom();
      } catch (err) {
        console.warn("[TRTC] Cleanup error (non-critical):", err);
      }
      trtc.destroy();
      trtcRef.current = null;
    }
  }, []);

  /**
   * Toggle local audio mute state.
   */
  const toggleLocalAudio = useCallback(async (muted: boolean) => {
    const trtc = trtcRef.current;
    if (trtc) {
      try {
        await trtc.updateLocalAudio({ mute: muted });
      } catch (err: any) {
        if (err?.code === 5998 || err?.message?.includes("abort") || err?.message?.includes("not started")) {
          console.warn("[TRTC] toggleLocalAudio aborted (not ready):", err);
        } else {
          console.error("[TRTC] toggleLocalAudio failed:", err);
        }
      }
    }
  }, []);

  /**
   * Toggle local video mute state.
   */
  const toggleLocalVideo = useCallback(async (muted: boolean) => {
    const trtc = trtcRef.current;
    if (trtc) {
      try {
        await trtc.updateLocalVideo({ mute: muted });
      } catch (err: any) {
        if (err?.code === 5998 || err?.message?.includes("abort") || err?.message?.includes("not started")) {
          console.warn("[TRTC] toggleLocalVideo aborted (not ready):", err);
        } else {
          console.error("[TRTC] toggleLocalVideo failed:", err);
        }
      }
    }
  }, []);

  // Cleanup on unmount — only if we actually joined a room
  useEffect(() => {
    return () => {
      // Guard: only clean up if we actually joined a room.
      // Prevents Strict Mode double-unmount from destroying a client
      // that was never initialized.
      if (isJoiningOrJoinedRef.current || trtcRef.current) {
        console.log("[TRTC] Unmount cleanup — leaving room");
        void leaveRoom();
      }
    };
  }, [leaveRoom]);

  return {
    joinRoom,
    leaveRoom,
    toggleLocalAudio,
    toggleLocalVideo,
  };
}
