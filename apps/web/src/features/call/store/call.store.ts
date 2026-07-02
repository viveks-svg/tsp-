import { create } from "zustand";

export interface IncomingCallInfo {
  consultationId: string;
  callerName: string;
  callerUserId: string;
}

export type CallStatus =
  | "idle"
  | "initiating"
  | "ringing"
  | "connecting"
  | "active"
  | "ended"
  | "failed";

/** Terminal UI states — once entered, only reset() can leave them. */
const TERMINAL_UI_STATES: CallStatus[] = ["ended", "failed"];

export interface CallState {
  // Call status
  status: CallStatus;
  consultationId: string | null;
  callSessionId: string | null;
  channelName: string | null;
  userSig: string | null;
  trtcUserId: string | null;
  sdkAppId: number | null;

  // Remote peer state
  remoteUid: string | null;
  isRemoteAudioMuted: boolean;
  isRemoteVideoMuted: boolean;

  // Local media state
  isAudioMuted: boolean;
  isVideoMuted: boolean;

  // Duration & billing
  durationSeconds: number;
  maxDurationSeconds: number;
  endReason: string | null;

  // Incoming call (astrologer side)
  incomingCall: IncomingCallInfo | null;

  // Actions
  setInitiating: (consultationId: string) => void;
  setRinging: () => void;
  setConnecting: (data: {
    channelName: string;
    userSig: string;
    trtcUserId: string;
    sdkAppId: number;
    maxDurationSeconds: number;
  }) => void;
  setActive: () => void;
  setRemoteUid: (uid: string | null) => void;
  setEnded: (reason: string) => void;
  setFailed: (reason: string) => void;
  toggleAudio: () => void;
  toggleVideo: () => void;
  setRemoteMediaState: (audio: boolean, video: boolean) => void;
  incrementDuration: () => void;
  setIncomingCall: (call: IncomingCallInfo | null) => void;
  reset: () => void;
}

const initialState = {
  status: "idle" as CallStatus,
  consultationId: null,
  callSessionId: null,
  channelName: null,
  userSig: null,
  trtcUserId: null,
  sdkAppId: null,
  remoteUid: null,
  isRemoteAudioMuted: false,
  isRemoteVideoMuted: false,
  isAudioMuted: false,
  isVideoMuted: false,
  durationSeconds: 0,
  maxDurationSeconds: 0,
  endReason: null,
  incomingCall: null,
};

export const useCallStore = create<CallState>()((set, get) => ({
  ...initialState,

  setInitiating: (consultationId) =>
    set({ status: "initiating", consultationId }),

  setRinging: () =>
    set({ status: "ringing" }),

  setConnecting: (data) => {
    const current = get().status;
    // Don't allow backward transitions from terminal states
    if (TERMINAL_UI_STATES.includes(current)) {
      console.warn(`[CallStore] Ignoring setConnecting — already in terminal state: ${current}`);
      return;
    }
    set({
      status: "connecting",
      channelName: data.channelName,
      userSig: data.userSig,
      trtcUserId: data.trtcUserId,
      sdkAppId: data.sdkAppId,
      maxDurationSeconds: data.maxDurationSeconds,
    });
  },

  setActive: () => {
    const current = get().status;
    if (TERMINAL_UI_STATES.includes(current)) {
      console.warn(`[CallStore] Ignoring setActive — already in terminal state: ${current}`);
      return;
    }
    set({ status: "active" });
  },

  setRemoteUid: (uid) =>
    set({ remoteUid: uid }),

  setEnded: (reason) => {
    const current = get().status;
    // Prevent re-entering ended state (idempotent)
    if (current === "ended" || current === "failed") {
      console.log(`[CallStore] setEnded no-op — already ${current} (existing reason: ${get().endReason}, new: ${reason})`);
      return;
    }
    console.log(`[CallStore] ${current} → ended (reason: ${reason})`);
    set({ status: "ended", endReason: reason });
  },

  setFailed: (reason) => {
    const current = get().status;
    if (current === "ended" || current === "failed") {
      console.log(`[CallStore] setFailed no-op — already ${current}`);
      return;
    }
    console.log(`[CallStore] ${current} → failed (reason: ${reason})`);
    set({ status: "failed", endReason: reason });
  },

  toggleAudio: () =>
    set((state) => ({ isAudioMuted: !state.isAudioMuted })),

  toggleVideo: () =>
    set((state) => ({ isVideoMuted: !state.isVideoMuted })),

  setRemoteMediaState: (audio, video) =>
    set({ isRemoteAudioMuted: !audio, isRemoteVideoMuted: !video }),

  incrementDuration: () =>
    set((state) => ({ durationSeconds: state.durationSeconds + 1 })),

  setIncomingCall: (call) =>
    set({ incomingCall: call }),

  reset: () =>
    set(initialState),
}));
