"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Loader2, Phone, Filter, CheckCircle2, AlertCircle } from "lucide-react";
import { apiClient } from "@/lib/http/client";

interface Lead {
  id: string;
  sessionId: string;
  solutionSlug: string;
  solutionName: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  status: string;
  lastActivityAt: string;
  createdAt: string;
  convertedBookingId: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  STARTED: "bg-gray-100 text-gray-700",
  CONTACT_CAPTURED: "bg-blue-50 text-blue-700 border-blue-200",
  DETAILS_COMPLETED: "bg-purple-50 text-purple-700 border-purple-200",
  PRICE_REVEALED: "bg-amber-50 text-amber-700 border-amber-200",
  PAYMENT_INITIATED: "bg-orange-50 text-orange-700 border-orange-200",
  CONVERTED: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [staleOnly, setStaleOnly] = useState(true);

  useEffect(() => {
    fetchLeads();
  }, [staleOnly]);

  const fetchLeads = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.get<Lead[]>(`/admin/leads${staleOnly ? "?stale=true" : ""}`);
      setLeads(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch leads");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-[#1E1A16]">Booking Leads</h1>
          <p className="text-sm text-[#6B5F52] mt-1">
            Monitor prospective clients from the progressive lead capture flow.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setStaleOnly(!staleOnly)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              staleOnly 
                ? "bg-[#C8A04A]/10 text-[#8B6914] border border-[#C8A04A]/20" 
                : "bg-white text-[#4B5563] border border-[#EFEBE1] hover:bg-[#FAFAF8]"
            }`}
          >
            <Filter className="w-4 h-4" />
            {staleOnly ? "Showing Unconverted Only" : "Showing All Leads"}
          </button>
          <button
            onClick={fetchLeads}
            disabled={isLoading}
            className="px-4 py-2 bg-[#1E1A16] text-white rounded-full text-sm font-medium hover:bg-[#C8A04A] transition-colors disabled:opacity-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <p className="text-sm text-rose-700">{error}</p>
        </div>
      ) : (
        <div className="bg-white border border-[#EFEBE1] rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#FAFAF8] border-b border-[#EFEBE1]">
                <tr>
                  <th className="px-6 py-4 font-semibold text-[#1E1A16]">Contact</th>
                  <th className="px-6 py-4 font-semibold text-[#1E1A16]">Solution</th>
                  <th className="px-6 py-4 font-semibold text-[#1E1A16]">Status</th>
                  <th className="px-6 py-4 font-semibold text-[#1E1A16]">Last Active</th>
                  <th className="px-6 py-4 font-semibold text-[#1E1A16]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFEBE1]">
                {isLoading && leads.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <Loader2 className="w-6 h-6 animate-spin text-[#C8A04A] mx-auto" />
                    </td>
                  </tr>
                ) : leads.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-[#6B5F52]">
                      No leads found matching current filters.
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-[#FAFAF8] transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-[#1E1A16]">
                          {lead.name || <span className="text-[#9CA3AF] italic">Unnamed</span>}
                        </div>
                        {lead.phone && (
                          <div className="text-xs text-[#6B5F52] mt-1 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {lead.phone}
                          </div>
                        )}
                        {lead.email && <div className="text-xs text-[#9CA3AF] mt-0.5">{lead.email}</div>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-[#1E1A16] font-medium">{lead.solutionName}</div>
                        <div className="text-xs text-[#9CA3AF] mt-1 font-mono">ID: {lead.sessionId.slice(-8)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            STATUS_COLORS[lead.status] || STATUS_COLORS.STARTED
                          }`}
                        >
                          {lead.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[#6B5F52]">
                        <div>{format(new Date(lead.lastActivityAt), "MMM d, yyyy")}</div>
                        <div className="text-xs text-[#9CA3AF] mt-1">
                          {format(new Date(lead.lastActivityAt), "h:mm a")}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {lead.status === "CONVERTED" ? (
                          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 w-fit">
                            <CheckCircle2 className="w-4 h-4" />
                            Converted
                          </div>
                        ) : lead.phone ? (
                          <a
                            href={`tel:${lead.phone}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1E1A16] text-white text-xs font-medium rounded-lg hover:bg-[#C8A04A] transition-colors"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            Call Lead
                          </a>
                        ) : (
                          <span className="text-xs text-[#9CA3AF] italic">No phone</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
