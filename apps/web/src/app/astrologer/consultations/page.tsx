"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Clock, CheckCircle, XCircle, Loader2, Search, Filter, Phone, Play } from "lucide-react";
import { apiClient } from "@/lib/http/client";
import { ENDPOINTS } from "@/lib/constants/http/endpoints";
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
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  PENDING: { label: "Pending", color: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock },
  ACTIVE: { label: "Active", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: Play },
  COMPLETED: { label: "Completed", color: "bg-slate-100 text-slate-600 border-slate-200", icon: CheckCircle },
  CANCELLED: { label: "Cancelled", color: "bg-rose-100 text-rose-600 border-rose-200", icon: XCircle },
};

export default function AstrologerConsultationsPage() {
  const router = useRouter();
  const { acceptCall } = useCallSocket();
  const [consultations, setConsultations] = useState<ConsultationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

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

  const handleAcceptAndStart = async (consultation: ConsultationItem) => {
    try {
      setActionId(consultation.id);
      setError(null);

      if (consultation.type === "CALL") {
        acceptCall(consultation.id);
        router.push(`/consultations/${consultation.id}/call`);
      } else {
        await apiClient.post(ENDPOINTS.CONSULTATIONS.START(consultation.id));
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

  const filteredConsultations = consultations.filter((item) => {
    const name = (item.user.name || item.user.email || "").toLowerCase();
    const matchesSearch = name.includes(searchTerm.toLowerCase());
    const matchesFilter = statusFilter === "ALL" || item.status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold font-poppins">
          Astrologer Panel
        </p>
        <h1 className="mt-1 font-heading text-3xl font-bold text-dark">
          Consultation Sessions
        </h1>
        <p className="mt-1 text-sm text-paragraph">
          View history and manage your client consultations.
        </p>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted" />
          <input
            type="text"
            placeholder="Search by client name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-border rounded-button pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-navy"
          />
        </div>
        <div className="flex gap-2 items-center">
          <Filter className="h-4 w-4 text-muted hidden md:block" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-border rounded-button px-4 py-2.5 text-sm text-dark focus:outline-none focus:border-navy"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-card border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-48 items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-navy" />
        </div>
      ) : filteredConsultations.length === 0 ? (
        <div className="rounded-card-lg border border-border bg-white px-6 py-14 text-center shadow-card">
          <MessageSquare className="mx-auto h-10 w-10 text-gold" />
          <h3 className="mt-4 font-heading text-xl font-bold text-dark">No sessions found</h3>
          <p className="mt-2 text-sm text-paragraph">
            No consultations match your search or filters.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredConsultations.map((consultation) => {
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