"use client";

import { Mic, MicOff, Video, VideoOff, PhoneOff } from "lucide-react";
import { cn } from "@/lib/cn";

interface CallControlsProps {
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onEndCall: () => void;
  disabled?: boolean;
}

export default function CallControls({
  isAudioMuted,
  isVideoMuted,
  onToggleAudio,
  onToggleVideo,
  onEndCall,
  disabled = false,
}: CallControlsProps) {
  return (
    <div className="flex items-center justify-center gap-4 py-4">
      {/* Mute / Unmute */}
      <button
        id="call-toggle-audio"
        onClick={onToggleAudio}
        disabled={disabled}
        className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 shadow-md",
          isAudioMuted
            ? "bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30"
            : "bg-white/10 text-white border border-white/20 hover:bg-white/20",
          disabled && "opacity-50 cursor-not-allowed",
        )}
        title={isAudioMuted ? "Unmute" : "Mute"}
      >
        {isAudioMuted ? (
          <MicOff className="w-5 h-5" />
        ) : (
          <Mic className="w-5 h-5" />
        )}
      </button>

      {/* End Call */}
      <button
        id="call-end-button"
        onClick={onEndCall}
        disabled={disabled}
        className={cn(
          "w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-rose-500/25 hover:scale-105 active:scale-95",
          disabled && "opacity-50 cursor-not-allowed",
        )}
        title="End Call"
      >
        <PhoneOff className="w-6 h-6" />
      </button>

      {/* Camera toggle */}
      <button
        id="call-toggle-video"
        onClick={onToggleVideo}
        disabled={disabled}
        className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 shadow-md",
          isVideoMuted
            ? "bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30"
            : "bg-white/10 text-white border border-white/20 hover:bg-white/20",
          disabled && "opacity-50 cursor-not-allowed",
        )}
        title={isVideoMuted ? "Turn Camera On" : "Turn Camera Off"}
      >
        {isVideoMuted ? (
          <VideoOff className="w-5 h-5" />
        ) : (
          <Video className="w-5 h-5" />
        )}
      </button>
    </div>
  );
}
