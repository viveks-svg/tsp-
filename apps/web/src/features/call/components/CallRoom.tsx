"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, WifiOff } from "lucide-react";
import { useCallStore } from "../store/call.store";
import { useCallSocket } from "../hooks/useCallSocket";
import { useTrtcClient } from "../hooks/useTrtcClient";
import { useCallTimer } from "../hooks/useCallTimer";
import { useAuth } from "@/providers/AuthProvider";
import CallControls from "./CallControls";
import CallTimer from "./CallTimer";
import CallingOverlay from "./CallingOverlay";
import CallReviewModal from "./CallReviewModal";
import { apiClient } from "@/lib/http/client";
import { ENDPOINTS } from "@/lib/constants/http/endpoints";

interface CallRoomProps {
  consultationId: string;
}

/**
 * Main call room component — renders the video call interface.
 * Manages the full call lifecycle: ringing → connecting → active → ended.
 */
export default function CallRoom({ consultationId }: CallRoomProps) {
  const router = useRouter();

  // ── Strict Mode safety ──
  // This ref tracks whether the component is "truly mounted" vs a Strict Mode
  // phantom mount/unmount cycle. It is set to true on mount and false on unmount.
  // The cleanup timeout checks this ref — if the component remounted (Strict Mode),
  // the ref will be true again and the cleanup is skipped.
  const isMountedRef = useRef(true);

  // Refs for video containers using callback refs to trigger useEffect when they mount
  const [localContainer, setLocalContainer] = useState<HTMLDivElement | null>(null);
  const [remoteContainer, setRemoteContainer] = useState<HTMLDivElement | null>(null);

  const localVideoRef = useCallback((node: HTMLDivElement | null) => {
    setLocalContainer(node);
  }, []);

  const remoteVideoRef = useCallback((node: HTMLDivElement | null) => {
    setRemoteContainer(node);
  }, []);

  // Call state
  const { user: authUser, hydrate: hydrateAuth } = useAuth();
  const {
    status,
    channelName,
    userSig,
    trtcUserId,
    sdkAppId,
    isAudioMuted,
    isVideoMuted,
    remoteUid,
    maxDurationSeconds,
    durationSeconds,
    endReason,
    toggleAudio,
    toggleVideo,
    setEnded,
    setInitiating,
    reset,
  } = useCallStore();

  // Hooks
  const { initiateCall, endCall, cancelCall, toggleMedia, joinCallRoom } = useCallSocket();
  const {
    joinRoom,
    leaveRoom,
    toggleLocalAudio,
    toggleLocalVideo,
  } = useTrtcClient();

  // Session metadata for post-call review
  const [sessionMeta, setSessionMeta] = useState<{
    astrologerName: string;
    perMinRate: number;
  } | null>(null);

  const callTimer = useCallTimer(
    useCallback(() => {
      // Wallet depleted — auto-end
      if (consultationId) {
        endCall(consultationId);
      }
    }, [consultationId, endCall]),
  );

  // ── 1. Load session data and initiate the call ──
  useEffect(() => {
    let cancelled = false;
    isMountedRef.current = true;

    console.log(`[CallRoom] Mount — consultationId=${consultationId}, status=${useCallStore.getState().status}`);

    const initCall = async () => {
      try {
        const session = await apiClient.get<any>(
          ENDPOINTS.CONSULTATIONS.CALL_SESSION(consultationId),
        );

        if (cancelled) return;

        setSessionMeta({
          astrologerName: session.consultation.astrologer?.name || "Astrologer",
          perMinRate: Number(session.consultation.lockedPricingPerMin),
        });

        const currentStoreStatus = useCallStore.getState().status;
        console.log(
          `[CallRoom] Session loaded — DB status: ${session.callSession?.status}, store status: ${currentStoreStatus}`,
        );

        // If the call session is already active (reconnection), we need the token
        if (session.callSession?.status === "ACTIVE") {
          // Join the signaling room
          joinCallRoom(consultationId);

          // Only fetch token and transition to connecting if not already active or connecting
          if (currentStoreStatus !== "connecting" && currentStoreStatus !== "active") {
            const tokenData = await apiClient.get<any>(
              ENDPOINTS.CONSULTATIONS.CALL_TOKEN(consultationId),
            );

            if (cancelled) return;

            useCallStore.getState().setConnecting({
              channelName: tokenData.channelName,
              userSig: tokenData.userSig,
              trtcUserId: tokenData.trtcUserId,
              sdkAppId: tokenData.sdkAppId,
              maxDurationSeconds: maxDurationSeconds || 3600,
            });
          }
        } else if (session.callSession?.status === "RINGING") {
          // Join the signaling room
          joinCallRoom(consultationId);
          
          const currentUser = authUser;
          const isCaller = currentUser?.id === session.consultation.user.id;

          if (isCaller) {
            if (
              currentStoreStatus !== "ringing" &&
              currentStoreStatus !== "connecting" &&
              currentStoreStatus !== "active"
            ) {
              initiateCall(
                consultationId,
                session.consultation.astrologer.userId,
                currentUser?.name || session.consultation.user.name || "Seeker",
              );
            }
          } else {
            // Astrologer side: only set initiating if not already connecting/active
            if (currentStoreStatus !== "connecting" && currentStoreStatus !== "active") {
              setInitiating(consultationId);
            }
          }
        } else if (
          session.callSession?.status === "COMPLETED" ||
          session.callSession?.status === "MISSED" ||
          session.callSession?.status === "REJECTED" ||
          session.callSession?.status === "CANCELLED"
        ) {
          setEnded(session.callSession.endReason || session.callSession.status);
        }
      } catch (err) {
        console.error("[CallRoom] Failed to load call session:", err);
        if (!cancelled) {
          setEnded("LOAD_FAILED");
        }
      }
    };

    void initCall();

    return () => {
      cancelled = true;
    };
  }, [consultationId]);

  // ── 2. Join TRTC when we have credentials ──
  useEffect(() => {
    console.log("[CallRoom] TRTC join check — Status:", status, {
      channelName,
      userSig: userSig ? "EXISTS" : "MISSING",
      trtcUserId,
      sdkAppId,
      localContainer: localContainer ? "EXISTS" : "MISSING",
      remoteContainer: remoteContainer ? "EXISTS" : "MISSING",
    });

    if (
      status !== "connecting" ||
      !channelName ||
      !userSig ||
      !trtcUserId ||
      !sdkAppId ||
      !localContainer ||
      !remoteContainer
    ) {
      return;
    }

    console.log("[CallRoom] Calling joinRoom with:", { sdkAppId, channelName, trtcUserId });
    void joinRoom(
      sdkAppId,
      channelName,
      userSig,
      trtcUserId,
      localContainer,
      remoteContainer,
    );
  }, [
    status,
    channelName,
    userSig,
    trtcUserId,
    sdkAppId,
    localContainer,
    remoteContainer,
    joinRoom,
  ]);

  // ── 3. Sync audio/video toggle to TRTC + Socket ──
  useEffect(() => {
    if (status === "active") {
      void toggleLocalAudio(isAudioMuted);
      toggleMedia(consultationId, !isAudioMuted, !isVideoMuted);
    }
  }, [isAudioMuted, status]);

  useEffect(() => {
    if (status === "active") {
      void toggleLocalVideo(isVideoMuted);
      toggleMedia(consultationId, !isAudioMuted, !isVideoMuted);
    }
  }, [isVideoMuted, status]);

  // ── 4. Cleanup on call end ──
  useEffect(() => {
    if (status === "ended" || status === "failed") {
      console.log(`[CallRoom] Call ended/failed — leaving TRTC room, reason: ${endReason}`);
      void leaveRoom();
      void hydrateAuth(); // Refresh wallet balance
    }
  }, [status, leaveRoom]);

  // ── 5. Browser close/tab close handler ──
  useEffect(() => {
    const handleBeforeUnload = () => {
      const currentStatus = useCallStore.getState().status;
      if (currentStatus === "active") {
        endCall(consultationId);
      } else if (currentStatus === "ringing" || currentStatus === "initiating") {
        cancelCall(consultationId);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [consultationId, endCall, cancelCall]);

  // ── 6. Cleanup on unmount — Strict Mode safe ──
  const unmountTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // On (re)mount, clear any pending cleanup timeout from a previous unmount.
    // This is critical for React Strict Mode: the rapid unmount→remount cycle
    // will set a timeout on unmount, and this line cancels it on remount.
    isMountedRef.current = true;
    if (unmountTimeoutRef.current) {
      console.log("[CallRoom] Clearing stale unmount timeout (Strict Mode remount detected)");
      clearTimeout(unmountTimeoutRef.current);
      unmountTimeoutRef.current = null;
    }

    return () => {
      isMountedRef.current = false;

      // Delay cleanup to distinguish real unmount from Strict Mode teardown.
      // If this is Strict Mode, the component will remount within ~1ms and
      // the timeout will be cleared above. If it's a real unmount (navigation),
      // the timeout fires after 200ms and we end/cancel the call.
      unmountTimeoutRef.current = setTimeout(() => {
        // Double-check: if component remounted, isMountedRef will be true
        if (isMountedRef.current) {
          console.log("[CallRoom] Unmount timeout fired but component is mounted — skipping cleanup");
          return;
        }

        const currentState = useCallStore.getState();
        console.log(`[CallRoom] Real unmount — cleaning up, status: ${currentState.status}`);

        if (currentState.status === "active") {
          endCall(consultationId);
        } else if (
          currentState.status === "ringing" ||
          currentState.status === "initiating" ||
          currentState.status === "connecting"
        ) {
          cancelCall(consultationId);
        }
        // Only reset if we actually did something, to avoid wiping state for
        // components that are already in idle/ended state
        if (currentState.status !== "idle" && currentState.status !== "ended" && currentState.status !== "failed") {
          reset();
        }
      }, 200);
    };
  }, [consultationId, endCall, cancelCall, reset]);

  // ── Handlers ──
  const handleToggleAudio = () => {
    toggleAudio();
  };

  const handleToggleVideo = () => {
    toggleVideo();
  };

  const handleEndCall = () => {
    console.log(`[CallRoom] User clicked end call — status: ${status}`);
    endCall(consultationId);
    setEnded("USER_ENDED");
  };

  const handleCancelRinging = () => {
    console.log(`[CallRoom] User cancelled ringing — emitting call:cancel`);
    cancelCall(consultationId);
    reset();
    router.push("/consultation/call");
  };

  // ── RENDER ──

  // Ringing state — show CallingOverlay
  if (status === "ringing" || status === "initiating") {
    return (
      <CallingOverlay
        astrologerName={sessionMeta?.astrologerName || "Astrologer"}
        onCancel={handleCancelRinging}
      />
    );
  }

  // Ended/Failed — show review modal
  if (status === "ended" || status === "failed") {
    const elapsedMin = Math.max(1, Math.ceil(durationSeconds / 60));
    const cost = sessionMeta
      ? (elapsedMin * sessionMeta.perMinRate).toFixed(2)
      : "0";

    return (
      <CallReviewModal
        consultationId={consultationId}
        astrologerName={sessionMeta?.astrologerName || "Astrologer"}
        durationMin={elapsedMin}
        cost={cost}
      />
    );
  }

  // Active / Connecting — show call room
  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a1a] flex flex-col">
      {/* Top bar with timer */}
      <header className="absolute top-0 left-0 right-0 z-20 p-4 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <span className="text-sm font-heading font-bold text-white">
              {sessionMeta?.astrologerName?.charAt(0) || "A"}
            </span>
          </div>
          <div>
            <p className="text-sm font-heading font-semibold text-white">
              {sessionMeta?.astrologerName || "Astrologer"}
            </p>
            <p className="text-[10px] text-emerald-400 font-poppins flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {status === "connecting" ? "Connecting..." : "Live Call"}
            </p>
          </div>
        </div>

        {status === "active" && (
          <CallTimer
            formattedDuration={callTimer.formattedDuration}
            formattedRemaining={callTimer.formattedRemaining}
            isLowTime={callTimer.isLowTime}
            perMinRate={sessionMeta?.perMinRate || 0}
          />
        )}
      </header>

      {/* Video area */}
      <div className="flex-1 relative">
        {/* Remote video (full screen) */}
        <div
          ref={remoteVideoRef}
          className="absolute inset-0 bg-[#0a0a1a]"
        >
          {!remoteUid && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white/40">
              {status === "connecting" ? (
                <>
                  <Loader2 className="w-10 h-10 animate-spin mb-3" />
                  <p className="text-sm font-poppins">Connecting to call...</p>
                </>
              ) : (
                <>
                  <WifiOff className="w-10 h-10 mb-3" />
                  <p className="text-sm font-poppins">
                    Waiting for the other participant...
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Local video (picture-in-picture) */}
        <div
          ref={localVideoRef}
          className="absolute bottom-24 right-4 w-36 h-48 rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 bg-[#1a1a2e] z-10"
        />
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 to-transparent pb-6 pt-12">
        <CallControls
          isAudioMuted={isAudioMuted}
          isVideoMuted={isVideoMuted}
          onToggleAudio={handleToggleAudio}
          onToggleVideo={handleToggleVideo}
          onEndCall={handleEndCall}
          disabled={status === "connecting"}
        />
      </div>
    </div>
  );
}
