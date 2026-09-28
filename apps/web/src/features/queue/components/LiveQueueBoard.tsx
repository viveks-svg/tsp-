"use client";

import { useCallback, useEffect, useState } from "react";
import { getSocketUrl } from "@/features/call/hooks/useCallSocket";
import { useRouter } from "next/navigation";
import io, { Socket } from "socket.io-client";
import { toast } from "sonner";
import { ListOrdered, Loader2, PhoneCall, Play, SkipForward, XCircle } from "lucide-react";
import { apiClient } from "@/lib/http/client";
import { ENDPOINTS } from "@/lib/constants/http/endpoints";
import { useCallStore } from "@/features/call/store/call.store";
import { useAuth } from "@/providers/AuthProvider";
import { cn } from "@/lib/cn";

/**
 * The live consultation queue.
 *
 * - "astrologer": Dr. Pradeep sees who is waiting and calls the next client.
 * - "admin": staff monitor the queue and tidy it (skip a no-show, remove someone,
 *   close a stuck call) but never take calls themselves.
 */

type Mode = "admin" | "astrologer";

interface QueueEntry {
  id: string;
  userId: string;
  userName: string;
  status: "WAITING" | "CALLING" | "IN_CALL" | "COMPLETED" | "ABANDONED";
  position: number;
  consultationId?: string;
}

interface CampaignState {
  campaign: { id: string; title: string; isActive: boolean };
  entries: QueueEntry[];
  waitingCount: number;
  currentCall: QueueEntry | null;
}

const withName = (e: any): QueueEntry => ({ ...e, userName: e.user?.name || "Client" });

export function LiveQueueBoard({ mode }: { mode: Mode }) {
  const router = useRouter();
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<CampaignState[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  const overviewUrl = mode === "admin" ? ENDPOINTS.ADMIN.QUEUE : ENDPOINTS.ASTROLOGER_QUEUE.OVERVIEW;

  const fetchOverview = useCallback(async () => {
    try {
      const data = await apiClient.get<any[]>(overviewUrl);
      setCampaigns(
        data.map((item) => ({
          campaign: item.campaign,
          waitingCount: item.waitingCount,
          currentCall: item.currentCall ? withName(item.currentCall) : null,
          entries: item.entries.map(withName),
        })),
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load the queue");
    } finally {
      setLoading(false);
    }
  }, [overviewUrl]);

  useEffect(() => {
    void fetchOverview();
    if (!user) return;
    // Same origin: the session cookie authenticates the socket (works after reloads too).
    const s = io(getSocketUrl(), { transports: ["websocket"], withCredentials: true });
    s.on("connect", () => void fetchOverview());
    s.on("queue:position_update", () => void fetchOverview());
    setSocket(s);
    return () => {
      s.disconnect();
    };
  }, [user, fetchOverview]);

  useEffect(() => {
    if (!socket) return;
    campaigns.forEach((c) => socket.emit("queue:join_room", { campaignId: c.campaign.id }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, campaigns.length]);

  const run = async (key: string, action: () => Promise<unknown>, failure: string) => {
    setBusy(key);
    try {
      await action();
      await fetchOverview();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : failure);
    } finally {
      setBusy(null);
    }
  };

  const callNext = (campaignId: string) =>
    run(
      `next-${campaignId}`,
      async () => {
        const res = await apiClient.post<{ consultation?: { id: string }; trtc?: any; message?: string }>(
          ENDPOINTS.ASTROLOGER_QUEUE.CALL_NEXT(campaignId),
        );
        if (!res.consultation?.id) {
          toast.message(res.message || "No one else is waiting.");
          return;
        }
        if (res.trtc) {
          // Set the consultation first so an older CallRoom's cleanup sees the store moved on.
          useCallStore.getState().setInitiating(res.consultation.id);
          useCallStore.getState().setConnecting({
            channelName: res.trtc.channelName,
            userSig: res.trtc.astrologer.userSig,
            trtcUserId: res.trtc.astrologer.trtcUserId,
            sdkAppId: res.trtc.sdkAppId,
            maxDurationSeconds: res.trtc.maxDurationSeconds ?? 3600,
          });
        }
        router.push(`/astrologer/consultations/${res.consultation.id}/call`);
      },
      "Could not call the next client",
    );

  const skip = (entryId: string) =>
    confirm("Skip this client? They will leave the queue.") &&
    run(`skip-${entryId}`, () => apiClient.post(ENDPOINTS.ADMIN.QUEUE_SKIP(entryId)), "Could not skip");

  const remove = (entryId: string) =>
    confirm("Remove this client from the queue?") &&
    run(`remove-${entryId}`, () => apiClient.post(ENDPOINTS.ADMIN.QUEUE_REMOVE(entryId)), "Could not remove");

  const forceClose = (consultationId: string) =>
    confirm("Close this call? Use this only when a call is stuck.") &&
    run(
      `close-${consultationId}`,
      () => apiClient.post(ENDPOINTS.ADMIN.QUEUE_FORCE_CLOSE(consultationId)),
      "Could not close the call",
    );

  if (loading) {
    return (
      <div className="flex h-[40vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-champagne" />
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-hairline bg-ivory px-6 py-16 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-full border border-hairline bg-parchment text-champagne">
          <ListOrdered className="h-5 w-5" />
        </span>
        <p className="text-sm text-ink-3">No live-queue campaign is running right now.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {campaigns.map((state) => {
        const waiting = state.entries.filter((e) => e.status === "WAITING" || e.status === "CALLING");
        return (
          <section
            key={state.campaign.id}
            className="overflow-hidden rounded-2xl border border-hairline bg-ivory shadow-[0_1px_0_rgba(26,23,18,0.03),0_12px_32px_-18px_rgba(26,23,18,0.18)]"
          >
            <div className="flex flex-col gap-4 border-b border-hairline px-6 py-5 md:flex-row md:items-center md:justify-between md:px-7">
              <div>
                <h2 className="font-playfair text-xl font-semibold text-ink">{state.campaign.title}</h2>
                <p className="text-[13px] text-ink-3">
                  {state.waitingCount} {state.waitingCount === 1 ? "client" : "clients"} waiting
                </p>
              </div>
              {mode === "astrologer" && (
                <button
                  onClick={() => callNext(state.campaign.id)}
                  disabled={!!busy || (!state.currentCall && state.waitingCount === 0)}
                  className="inline-flex items-center gap-2 rounded-full bg-midnight px-5 py-2.5 text-[13px] font-semibold text-champagne-light transition hover:bg-midnight-2 disabled:opacity-40"
                >
                  {busy === `next-${state.campaign.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                  {state.currentCall ? "End call & call next" : "Call next client"}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 divide-y divide-hairline lg:grid-cols-3 lg:divide-x lg:divide-y-0">
              <div className="p-6 md:p-7">
                <p className="mb-4 flex items-center gap-2 text-[12px] font-medium text-ink-3">
                  <PhoneCall className="h-4 w-4" /> In consultation
                </p>
                {state.currentCall ? (
                  <div className="rounded-xl border border-emerald-deep/20 bg-emerald-deep/5 p-4">
                    <p className="font-medium text-ink">{state.currentCall.userName}</p>
                    <p className="text-[12px] text-emerald-deep">On the call now</p>
                    {mode === "admin" && state.currentCall.consultationId && (
                      <button
                        onClick={() => forceClose(state.currentCall!.consultationId!)}
                        disabled={!!busy}
                        className="mt-3 text-[12px] font-medium text-garnet hover:underline disabled:opacity-50"
                      >
                        Close stuck call
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-[13px] text-ink-3">No one on a call.</p>
                )}
              </div>

              <div className="p-6 md:p-7 lg:col-span-2">
                <p className="mb-4 flex items-center gap-2 text-[12px] font-medium text-ink-3">
                  <ListOrdered className="h-4 w-4" /> Waiting
                </p>
                {waiting.length === 0 ? (
                  <p className="text-[13px] text-ink-3">The queue is empty.</p>
                ) : (
                  <ul className="divide-y divide-hairline rounded-xl border border-hairline">
                    {waiting.map((entry) => (
                      <li
                        key={entry.id}
                        className={cn("flex items-center gap-4 px-4 py-3", entry.status === "CALLING" && "bg-champagne/10")}
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-hairline bg-parchment text-[13px] font-semibold text-ink-2 tabular-nums">
                          {entry.position}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[14px] font-medium text-ink">{entry.userName}</p>
                          {entry.status === "CALLING" && <p className="text-[12px] text-bronze">Joining the call…</p>}
                        </div>
                        {mode === "admin" && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => skip(entry.id)}
                              disabled={!!busy}
                              title="Skip (no-show)"
                              aria-label="Skip client"
                              className="rounded-lg p-2 text-ink-3 transition hover:bg-champagne/15 hover:text-bronze"
                            >
                              {busy === `skip-${entry.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <SkipForward className="h-4 w-4" />}
                            </button>
                            <button
                              onClick={() => remove(entry.id)}
                              disabled={!!busy}
                              title="Remove from queue"
                              aria-label="Remove client"
                              className="rounded-lg p-2 text-ink-3 transition hover:bg-garnet/10 hover:text-garnet"
                            >
                              {busy === `remove-${entry.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                            </button>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
