"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Megaphone, Clock, ArrowRight } from "lucide-react";
import { apiClient } from "@/lib/http/client";
import { ENDPOINTS } from "@/lib/constants/http/endpoints";
import { toast } from "sonner";
import { useQueueSocket } from "@/providers/QueueSocketProvider";

interface ActiveCampaign {
  id: string;
  title: string;
  bannerText: string;
  isLiveNow: boolean;
  nextWindowDate: string | null;
}

export function CampaignStrip() {
  const [campaign, setCampaign] = useState<ActiveCampaign | null>(null);
  const { joinQueueRoom } = useQueueSocket();
  const pathname = usePathname();

  // Do not show on admin or astrologer pages
  const isHiddenRoute = pathname?.startsWith("/admin") || pathname?.startsWith("/astrologer");

  useEffect(() => {
    if (isHiddenRoute) return;

    const fetchActiveCampaign = async () => {
      try {
        const data = await apiClient.get<ActiveCampaign>(ENDPOINTS.CAMPAIGNS.ACTIVE);
        // The API returns 200 with an empty body or a specific campaign
        if (data && data.id) {
          setCampaign(data);
        } else {
          setCampaign(null);
        }
      } catch {
        // Silently fail if no active campaign
        setCampaign(null);
      }
    };

    void fetchActiveCampaign();
    // Poll every minute to update live status
    const interval = setInterval(fetchActiveCampaign, 60_000);
    return () => clearInterval(interval);
  }, [isHiddenRoute]);

  if (isHiddenRoute || !campaign) return null;

  const handleJoinClick = async () => {
    if (!campaign.isLiveNow) return;
    
    try {
      await apiClient.post(ENDPOINTS.QUEUE.JOIN, { campaignId: campaign.id });
      // Tell the global socket to subscribe to the queue room
      joinQueueRoom(campaign.id);
      
      // Redirect to dashboard where the queue entry will be visible
      toast.success("Successfully joined the queue!");
      window.location.href = "/dashboard";
    } catch (err: any) {
      if (err.statusCode === 400) {
        toast.error(err.message || "Failed to join queue");
      } else {
        toast.error("An unexpected error occurred while joining the queue.");
      }
    }
  };

  return (
    <div className="bg-[#1E1A16] text-[#FDFBF7] text-sm py-2.5 px-4 font-poppins relative z-50">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-center">
        
        <div className="flex items-center gap-2">
          {campaign.isLiveNow ? (
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </div>
          ) : (
            <Megaphone className="w-4 h-4 text-[#C8A04A]" />
          )}
          <span className="font-semibold text-[#C8A04A]">{campaign.title}:</span>
          <span className="opacity-90">{campaign.bannerText}</span>
        </div>

        {campaign.isLiveNow ? (
          <button 
            onClick={handleJoinClick}
            className="flex items-center gap-1.5 bg-[#C8A04A] text-[#1E1A16] px-4 py-1 rounded-full text-xs font-bold hover:bg-[#D4AF37] transition-colors whitespace-nowrap"
          >
            Join Queue Now
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : campaign.nextWindowDate ? (
          <div className="flex items-center gap-1.5 opacity-75 text-xs font-medium">
            <Clock className="w-3.5 h-3.5" />
            Next: {new Date(campaign.nextWindowDate).toLocaleDateString("en-IN", { weekday: "long", hour: "2-digit", minute: "2-digit" })}
          </div>
        ) : null}

      </div>
    </div>
  );
}
