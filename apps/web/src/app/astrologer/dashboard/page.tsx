"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  IndianRupee,
  Users,
  Play,
  Phone,
} from "lucide-react";
import { apiClient } from "@/lib/http/client";
import { ENDPOINTS } from "@/lib/constants/http/endpoints";
import { useAuth } from "@/providers/AuthProvider";
import { useCallSocket } from "@/features/call/hooks/useCallSocket";
import { cn } from "@/lib/cn";

interface ConsultationItem {
  id: string;
  userId: string;
  astrologerId: string;
  status: string;
  type?: "CHAT" | "CALL";
  scheduledAt: string;
  lockedPricingPerMin: string | number;
  durationMin?: number;
  cost?: string | number;
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
  astrologer: {
    id: string;
    user: {
      id: string;
      name: string | null;
      email: string | null;
    };
  };
  chatThread?: {
    id: string;
    status: string;
  } | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  PENDING: { label: "Pending", color: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock },
  ACTIVE: { label: "Active", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: Play },
  COMPLETED: { label: "Completed", color: "bg-slate-100 text-slate-600 border-slate-200", icon: CheckCircle },
  CANCELLED: { label: "Cancelled", color: "bg-rose-100 text-rose-600 border-rose-200", icon: XCircle },
};

export default function AstrologerDashboardPage() {
  const router = useRouter();
  const { user, walletBalance } = useAuth();
  const { acceptCall } = useCallSocket();
  const [consultations, setConsultations] = useState<ConsultationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const loadConsultations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.get<ConsultationItem[]>(ENDPOINTS.CONSULTATIONS.LIST);
      setConsultations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load consultations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadConsultations();
  }, [loadConsultations]);

  // Auto-refresh every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      void loadConsultations();
    }, 15000);
    return () => clearInterval(interval);
  }, [loadConsultations]);

  const handleAcceptAndStart = async (consultation: ConsultationItem) => {
    try {
      setActionId(consultation.id);
      setError(null);
      
      if (consultation.type === "CALL") {
        acceptCall(consultation.id);
        router.push(`/consultations/${consultation.id}/call`);
      } else {
        // Start the consultation (transitions PENDING → ACTIVE and creates ChatThread)
        await apiClient.post(ENDPOINTS.CONSULTATIONS.START(consultation.id));
        // Redirect to the chat room
        router.push(`/consultations/${consultation.id}/chat`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start consultation.");
      setActionId(null);
    }
  };

  const handleJoinChat = (consultation: ConsultationItem) => {
    if (consultation.type === "CALL") {
      router.push(`/consultations/${consultation.id}/call`);
    } else {
      router.push(`/consultations/${consultation.id}/chat`);
    }
  };

  // Sort: PENDING first, then ACTIVE, then rest
  const sortedConsultations = [...consultations].sort((a, b) => {
    const order: Record<string, number> = { PENDING: 0, ACTIVE: 1, COMPLETED: 2, CANCELLED: 3 };
    return (order[a.status] ?? 4) - (order[b.status] ?? 4);
  });

  const pendingCount = consultations.filter((c) => c.status === "PENDING").length;
  const activeCount = consultations.filter((c) => c.status === "ACTIVE").length;
  const completedCount = consultations.filter((c) => c.status === "COMPLETED").length;

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold font-poppins">
            Astrologer Panel
          </p>
          <h1 className="mt-1 font-heading text-3xl font-bold text-dark">
            Welcome back, {user?.name?.split(" ")[0] || "Acharya"}
          </h1>
          <p className="mt-1 text-sm text-paragraph">
            Manage your consultation sessions and connect with seekers.
          </p>
        </div>
        <button
          onClick={() => void loadConsultations()}
          disabled={loading}
          className="self-start md:self-auto flex items-center gap-2 bg-white border border-border rounded-button px-4 py-2.5 text-xs font-semibold text-dark hover:bg-cream transition-colors shadow-sm"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-card border border-border p-5 shadow-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-dark font-poppins">{pendingCount}</p>
              <p className="text-[10px] text-muted uppercase font-bold tracking-wider font-poppins">Pending</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-card border border-border p-5 shadow-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-dark font-poppins">{activeCount}</p>
              <p className="text-[10px] text-muted uppercase font-bold tracking-wider font-poppins">Active</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-card border border-border p-5 shadow-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-dark font-poppins">{completedCount}</p>
              <p className="text-[10px] text-muted uppercase font-bold tracking-wider font-poppins">Completed</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-card border border-border p-5 shadow-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-navy/10 flex items-center justify-center">
              <IndianRupee className="w-5 h-5 text-navy" />
            </div>
            <div>
              <p className="text-2xl font-bold text-dark font-poppins">₹{Number(walletBalance).toFixed(0)}</p>
              <p className="text-[10px] text-muted uppercase font-bold tracking-wider font-poppins">Earnings</p>
            </div>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-card border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Pending Consultations Alert */}
      {pendingCount > 0 && (
        <div className="mb-6 rounded-card-lg border-2 border-amber-300 bg-amber-50 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-200 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6 text-amber-700" />
          </div>
          <div>
            <p className="font-heading font-bold text-dark">
              {pendingCount} Pending Consultation{pendingCount > 1 ? "s" : ""}
            </p>
            <p className="text-xs text-paragraph mt-0.5">
              New seekers are waiting for your guidance. Accept to start the session.
            </p>
          </div>
        </div>
      )}

      {/* Consultations List */}
      <div className="space-y-1 mb-4">
        <h2 className="font-heading text-lg font-bold text-dark">All Consultations</h2>
        <p className="text-xs text-muted">Auto-refreshes every 15 seconds</p>
      </div>

      {loading && consultations.length === 0 ? (
        <div className="flex min-h-48 items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-navy" />
        </div>
      ) : sortedConsultations.length === 0 ? (
        <div className="rounded-card-lg border border-border bg-white px-6 py-14 text-center shadow-card">
          <MessageSquare className="mx-auto h-10 w-10 text-gold" />
          <h3 className="mt-4 font-heading text-xl font-bold text-dark">No consultations yet</h3>
          <p className="mt-2 text-sm text-paragraph">
            When seekers book a session with you, they will appear here.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {sortedConsultations.map((consultation) => {
            const statusConfig = STATUS_CONFIG[consultation.status] || STATUS_CONFIG.PENDING;
            const StatusIcon = statusConfig.icon;
            const clientName = consultation.user.name || consultation.user.email || "Anonymous User";
            const isMyAction = actionId === consultation.id;

            return (
              <article
                key={consultation.id}
                className={cn(
                  "rounded-card-lg border bg-white p-6 shadow-card transition-all",
                  consultation.status === "PENDING" && "border-amber-300 ring-1 ring-amber-100",
                  consultation.status === "ACTIVE" && "border-emerald-300 ring-1 ring-emerald-100",
                  consultation.status !== "PENDING" && consultation.status !== "ACTIVE" && "border-border"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-heading text-base font-bold text-dark truncate">
                      {clientName}
                    </h3>
                    <p className="mt-0.5 text-xs text-muted font-poppins">
                      {new Date(consultation.scheduledAt).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "flex items-center gap-1.5 rounded-button border px-3 py-1 text-[10px] font-bold uppercase tracking-wider shrink-0",
                      statusConfig.color
                    )}
                  >
                    <StatusIcon className="w-3 h-3" />
                    {statusConfig.label}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4 text-sm">
                  <div>
                    <p className="text-[10px] text-muted uppercase font-bold tracking-wider font-poppins">Rate</p>
                    <p className="font-semibold text-dark">
                      ₹{Number(consultation.lockedPricingPerMin).toFixed(2)}/min
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted uppercase font-bold tracking-wider font-poppins">
                      {consultation.cost ? "Earned" : "Duration"}
                    </p>
                    <p className="font-semibold text-dark">
                      {consultation.cost
                        ? `₹${Number(consultation.cost).toFixed(2)}`
                        : consultation.durationMin
                          ? `${consultation.durationMin} min`
                          : "—"}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-4 flex gap-2">
                  {consultation.status === "PENDING" && (
                    <button
                      onClick={() => void handleAcceptAndStart(consultation)}
                      disabled={isMyAction}
                      className="flex-1 flex items-center justify-center gap-2 bg-navy hover:bg-navy-hover text-white py-2.5 rounded-button text-xs font-bold font-poppins transition-colors shadow-sm disabled:opacity-60"
                    >
                      {isMyAction ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : consultation.type === "CALL" ? (
                        <Phone className="w-3.5 h-3.5" />
                      ) : (
                        <Play className="w-3.5 h-3.5" />
                      )}
                      {isMyAction ? "Starting..." : consultation.type === "CALL" ? "Accept & Join Call" : "Accept & Start Chat"}
                    </button>
                  )}

                  {consultation.status === "ACTIVE" && (
                    <button
                      onClick={() => handleJoinChat(consultation)}
                      className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-button text-xs font-bold font-poppins transition-colors shadow-sm"
                    >
                      {consultation.type === "CALL" ? (
                        <>
                          <Phone className="w-3.5 h-3.5" />
                          Join Call Room
                        </>
                      ) : (
                        <>
                          <MessageSquare className="w-3.5 h-3.5" />
                          Join Chat Room
                        </>
                      )}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
