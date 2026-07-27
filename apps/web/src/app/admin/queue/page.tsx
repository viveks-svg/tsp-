"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ListOrdered, User, Phone, Play, SkipForward, XCircle, PhoneCall, CheckCircle2 } from "lucide-react";
import { apiClient } from "@/lib/http/client";
import { ENDPOINTS } from "@/lib/constants/http/endpoints";
import io, { Socket } from "socket.io-client";
import { useCallStore } from "@/features/call/store/call.store";
import { useAuth } from "@/providers/AuthProvider";

interface QueueEntry {
  id: string;
  userId: string;
  userName: string;
  status: "WAITING" | "CALLING" | "IN_CALL" | "COMPLETED" | "ABANDONED";
  position: number;
  consultationId?: string;
}

interface CampaignState {
  campaign: {
    id: string;
    title: string;
    isActive: boolean;
  };
  entries: QueueEntry[];
  waitingCount: number;
  currentCall: QueueEntry | null;
  calling: QueueEntry | null;
}

export default function AdminQueuePage() {
  const router = useRouter();
  const { accessToken } = useAuth();
  const [campaignsState, setCampaignsState] = useState<CampaignState[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  const fetchOverview = async () => {
    try {
      const data = await apiClient.get<any[]>(ENDPOINTS.ADMIN.QUEUE);
      
      // Map API response to our UI state shape
      const mapped = data.map((item) => ({
        campaign: item.campaign,
        waitingCount: item.waitingCount,
        currentCall: item.currentCall ? {
          ...item.currentCall,
          userName: item.currentCall.user?.name || "Unknown",
        } : null,
        calling: item.calling ? {
          ...item.calling,
          userName: item.calling.user?.name || "Unknown",
        } : null,
        entries: item.entries.map((e: any) => ({
          ...e,
          userName: e.user?.name || "Unknown",
        })),
      }));

      setCampaignsState(mapped);
    } catch (err) {
      console.error("Failed to load queue state:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchOverview();

    // Setup Socket.IO connection for real-time queue monitoring
    if (accessToken) {
      const envUrl = process.env.NEXT_PUBLIC_API_URL;
      const socketUrl = (envUrl && envUrl !== "undefined") ? envUrl.replace("/api/v1", "") : "http://127.0.0.1:3001";
      
      const newSocket = io(socketUrl, {
        auth: { token: accessToken },
        transports: ["websocket"],
      });

      newSocket.on("connect", () => {
        console.log("Queue Monitor Socket connected:", newSocket.id);
        // After connecting, we need to join the rooms for all active campaigns
        // We'll do this in the other useEffect when campaignsState changes, or we can just refetch on connect
        fetchOverview();
      });

      newSocket.on("queue:position_update", (data) => {
        // We received an update for a specific campaign, just refetch everything to be safe and consistent
        fetchOverview();
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [accessToken]);

  // Join socket rooms for all active campaigns
  useEffect(() => {
    if (socket && campaignsState.length > 0) {
      campaignsState.forEach(c => {
        socket.emit("queue:join_room", { campaignId: c.campaign.id });
      });
    }
  }, [socket, campaignsState.length]);

  const handleDequeue = async (campaignId: string) => {
    setActionLoading(`dequeue-${campaignId}`);
    try {
      const response = await apiClient.post<{ entry: any; consultation: any; trtc?: any }>(
        ENDPOINTS.ADMIN.QUEUE_DEQUEUE(campaignId)
      );
      
      // Socket event will trigger a refetch, but we can do one manually just in case
      await fetchOverview();

      if (response.trtc) {
        // Set consultationId first so any old CallRoom's unmount cleanup
        // can detect the store has moved on and skip its cleanup.
        useCallStore.getState().setInitiating(response.consultation.id);
        useCallStore.getState().setConnecting({
          channelName: response.trtc.channelName,
          userSig: response.trtc.astrologer.userSig,
          trtcUserId: response.trtc.astrologer.trtcUserId,
          sdkAppId: response.trtc.sdkAppId,
          maxDurationSeconds: 3600,
        });
        
        router.push(`/admin/consultations/${response.consultation.id}/call`);
      } else if (response.consultation?.id) {
        router.push(`/admin/consultations/${response.consultation.id}/call`);
      }
    } catch (err: any) {
      alert(err.message || "Failed to dequeue next user");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSkip = async (entryId: string) => {
    if (!confirm("Are you sure you want to skip this user? They will be removed from the queue.")) return;
    
    setActionLoading(`skip-${entryId}`);
    try {
      await apiClient.post(ENDPOINTS.ADMIN.QUEUE_SKIP(entryId));
    } catch (err: any) {
      alert(err.message || "Failed to skip user");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemove = async (entryId: string) => {
    if (!confirm("Are you sure you want to remove this user from the queue?")) return;
    
    setActionLoading(`remove-${entryId}`);
    try {
      await apiClient.post(ENDPOINTS.ADMIN.QUEUE_REMOVE(entryId));
    } catch (err: any) {
      alert(err.message || "Failed to remove user");
    } finally {
      setActionLoading(null);
    }
  };

  const handleForceClose = async (consultationId: string) => {
    if (!confirm("Are you sure you want to force close this stuck consultation?")) return;
    setActionLoading(`forceclose-${consultationId}`);
    try {
      await apiClient.post(ENDPOINTS.ADMIN.QUEUE_FORCE_CLOSE(consultationId));
      await fetchOverview();
    } catch (err: any) {
      alert(err.message || "Failed to force close consultation");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#071B8D]" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#C8A04A] font-poppins">
            Admin Panel
          </p>
          <h1 className="mt-1 font-heading text-3xl font-bold text-[#1E1A16]">
            Live Queue Monitor
          </h1>
          <p className="mt-1 text-sm text-[#4B5563]">
            Manage users waiting in the live consultation queue.
          </p>
        </div>
        <button
          onClick={fetchOverview}
          className="bg-white border border-[#EFEBE1] text-[#1E1A16] hover:bg-[#FDFBF7] rounded-lg px-4 py-2 text-sm font-bold font-poppins transition-colors shadow-sm"
        >
          Refresh Data
        </button>
      </div>

      {campaignsState.length === 0 ? (
        <div className="text-center py-16 bg-white border border-[#EFEBE1] rounded-xl">
          <ListOrdered className="w-12 h-12 text-[#EFEBE1] mx-auto mb-3" />
          <p className="text-[#4B5563] text-sm">No active campaigns with a live queue at the moment.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {campaignsState.map((state) => (
            <div key={state.campaign.id} className="bg-white border border-[#EFEBE1] rounded-xl shadow-sm overflow-hidden">
              {/* Campaign Header */}
              <div className="p-6 border-b border-[#EFEBE1] bg-[#FDFBF7]/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </div>
                    <h2 className="font-heading text-lg font-bold text-[#1E1A16]">
                      {state.campaign.title}
                    </h2>
                  </div>
                  <p className="text-sm text-[#4B5563] mt-1 font-medium">
                    {state.waitingCount} users waiting in queue
                  </p>
                </div>
                <button
                  onClick={() => handleDequeue(state.campaign.id)}
                  disabled={!!actionLoading || (!state.currentCall && state.waitingCount === 0)}
                  className="flex items-center gap-2 bg-[#071B8D] hover:bg-[#05156e] text-white rounded-lg px-6 py-2.5 text-sm font-bold font-poppins transition-colors shadow-sm disabled:opacity-60"
                >
                  {actionLoading === `dequeue-${state.campaign.id}` ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  {state.currentCall ? "End Call & Next" : "Call Next User"}
                </button>
              </div>

              {/* Queue Status Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-[#EFEBE1]">
                
                {/* IN CALL */}
                <div className="p-6">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF] mb-4 flex items-center gap-2">
                    <PhoneCall className="w-4 h-4" />
                    Currently In Call
                  </h3>
                  {state.currentCall ? (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-800 font-bold shrink-0">
                          {state.currentCall.userName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-[#1E1A16]">{state.currentCall.userName}</p>
                          <p className="text-xs text-emerald-600 font-medium mt-0.5 flex items-center gap-1">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            Live Now
                          </p>
                        </div>
                      </div>
                      
                      {state.currentCall.consultationId && (
                        <div className="mt-4 pt-3 border-t border-emerald-200/50 flex justify-end">
                          <button
                            onClick={() => handleForceClose(state.currentCall!.consultationId!)}
                            disabled={!!actionLoading}
                            className="text-xs text-rose-600 hover:text-rose-700 font-semibold disabled:opacity-50"
                          >
                            Force Close
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-[#9CA3AF] text-sm">
                      No active call
                    </div>
                  )}
                </div>

                {/* WAITING QUEUE */}
                <div className="p-6 lg:col-span-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF] mb-4 flex items-center gap-2">
                    <ListOrdered className="w-4 h-4" />
                    Waiting List
                  </h3>
                  
                  {state.entries.filter(e => e.status === "WAITING" || e.status === "CALLING").length === 0 ? (
                    <div className="text-center py-8 text-[#9CA3AF] text-sm bg-[#FDFBF7]/30 rounded-lg border border-dashed border-[#EFEBE1]">
                      Queue is currently empty
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {state.entries
                        .filter(e => e.status === "WAITING" || e.status === "CALLING")
                        .map((entry) => (
                        <div 
                          key={entry.id} 
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            entry.status === "CALLING" 
                              ? "bg-amber-50 border-amber-200" 
                              : "bg-white border-[#EFEBE1]"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                              entry.status === "CALLING" ? "bg-amber-200 text-amber-800" : "bg-[#FDFBF7] text-[#9CA3AF]"
                            }`}>
                              {entry.position}
                            </div>
                            <div>
                              <p className="font-semibold text-[#1E1A16] text-sm">{entry.userName}</p>
                              {entry.status === "CALLING" && (
                                <p className="text-xs text-amber-600 font-medium">Joining call...</p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleSkip(entry.id)}
                              disabled={!!actionLoading}
                              className="p-1.5 text-[#9CA3AF] hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                              title="Skip User (No-show)"
                            >
                              {actionLoading === `skip-${entry.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <SkipForward className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleRemove(entry.id)}
                              disabled={!!actionLoading}
                              className="p-1.5 text-[#9CA3AF] hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                              title="Remove User"
                            >
                              {actionLoading === `remove-${entry.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
