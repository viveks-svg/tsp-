"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, PhoneCall, Users } from "lucide-react";
import { apiClient } from "@/lib/http/client";
import { ENDPOINTS } from "@/lib/constants/http/endpoints";
import { ROUTES } from "@/lib/constants/routes";
import { useQueueSocket } from "@/providers/QueueSocketProvider";
import { useCallStore } from "@/features/call/store/call.store";

interface Position {
  status: "WAITING" | "CALLING" | "IN_CALL";
  position: number;
  estimatedWaitMin: number;
  consultationId: string | null;
  trtc?: {
    consultationId: string;
    channelName: string;
    sdkAppId: number;
    maxDurationSeconds?: number;
    user: { userSig: string; trtcUserId: string };
  };
}

/**
 * The client's place in Dr. Pradeep's live queue, with a way to leave it —
 * or to join the call once it's their turn. Updates live and every 20 seconds.
 */
export default function QueueStatusCard() {
  const router = useRouter();
  const { socket, joinQueueRoom } = useQueueSocket();
  const [campaign, setCampaign] = useState<{ id: string; title: string } | null>(null);
  const [position, setPosition] = useState<Position | null>(null);
  const [leaving, setLeaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const active = await apiClient.get<{ id: string; title: string } | null>(ENDPOINTS.CAMPAIGNS.ACTIVE);
      setCampaign(active?.id ? active : null);
      setPosition(active?.id ? await apiClient.get<Position | null>(ENDPOINTS.QUEUE.POSITION(active.id)) : null);
    } catch {
      /* no live queue right now */
    }
  }, []);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 20_000);
    return () => clearInterval(t);
  }, [load]);

  // Live updates while they wait.
  useEffect(() => {
    if (!socket || !campaign || !position) return;
    joinQueueRoom(campaign.id);
    const refresh = () => void load();
    socket.on("queue:position_update", refresh);
    return () => {
      socket.off("queue:position_update", refresh);
    };
  }, [socket, campaign, position, joinQueueRoom, load]);

  if (!campaign || !position) return null;

  const leave = async () => {
    if (!confirm("Leave the queue? You'll lose your place.")) return;
    setLeaving(true);
    try {
      await apiClient.post(ENDPOINTS.QUEUE.LEAVE, { campaignId: campaign.id });
      toast.success("You've left the queue.");
      setPosition(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not leave the queue");
    } finally {
      setLeaving(false);
    }
  };

  const joinCall = () => {
    if (!position.trtc) return;
    useCallStore.getState().setConnecting({
      channelName: position.trtc.channelName,
      userSig: position.trtc.user.userSig,
      trtcUserId: position.trtc.user.trtcUserId,
      sdkAppId: position.trtc.sdkAppId,
      maxDurationSeconds: position.trtc.maxDurationSeconds ?? 3600,
    });
    router.push(`${ROUTES.CONSULTATIONS}/${position.trtc.consultationId}/call`);
  };

  const yourTurn = position.status !== "WAITING";
  return (
    <div className="mt-6 flex flex-col gap-4 rounded-card-lg border border-gold/40 bg-white p-5 shadow-card sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-navy text-white">
          {yourTurn ? <PhoneCall className="h-5 w-5" /> : <Users className="h-5 w-5" />}
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gold">{campaign.title}</p>
          {yourTurn ? (
            <p className="mt-1 text-sm text-dark">
              <strong>It&apos;s your turn.</strong> Dr. Pradeep is ready for you.
            </p>
          ) : (
            <p className="mt-1 text-sm text-dark">
              You&apos;re <strong>number {position.position}</strong> in the queue
              {position.estimatedWaitMin > 0 && <> · about {position.estimatedWaitMin} min</>}. Keep this page open — we&apos;ll bring you in
              automatically.
            </p>
          )}
        </div>
      </div>
      {yourTurn && position.trtc ? (
        <button onClick={joinCall} className="rounded-button bg-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-hover">
          Join call
        </button>
      ) : !yourTurn ? (
        <button
          onClick={leave}
          disabled={leaving}
          className="inline-flex items-center gap-2 rounded-button border border-border px-4 py-2.5 text-sm font-semibold text-dark hover:bg-cream disabled:opacity-50"
        >
          {leaving && <Loader2 className="h-4 w-4 animate-spin" />} Leave the queue
        </button>
      ) : null}
    </div>
  );
}
