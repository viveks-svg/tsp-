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

export const useCallStore = create<CallState>()((set) => ({
  ...initialState,

  setInitiating: (consultationId) =>
    set({ status: "initiating", consultationId }),

  setRinging: () =>
    set({ status: "ringing" }),

  setConnecting: (data) =>
    set({
      status: "connecting",
      channelName: data.channelName,
      userSig: data.userSig,
      trtcUserId: data.trtcUserId,
      sdkAppId: data.sdkAppId,
      maxDurationSeconds: data.maxDurationSeconds,
    }),

  setActive: () =>
    set({ status: "active" }),

  setRemoteUid: (uid) =>
    set({ remoteUid: uid }),

  setEnded: (reason) =>
    set({ status: "ended", endReason: reason }),

  setFailed: (reason) =>
    set({ status: "failed", endReason: reason }),

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
