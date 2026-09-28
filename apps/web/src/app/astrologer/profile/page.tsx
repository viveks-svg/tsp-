"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Star } from "lucide-react";
import StaffSecurity from "@/features/auth/components/StaffSecurity";
import { apiClient } from "@/lib/http/client";
import { ENDPOINTS } from "@/lib/constants/http/endpoints";
import { useAuth } from "@/providers/AuthProvider";
import { PageHeader, Panel, Skeleton } from "@/features/admin/components/primitives";
import { formatINR } from "@/features/admin/lib/format";

interface Profile {
  name: string | null;
  email: string | null;
  bio: string;
  pricingPerMin: number;
  isAvailable: boolean;
  rating: number;
}

/** The astrologer's profile as clients see it. The TSP office edits it on request. */
export default function AstrologerProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    apiClient
      .get<{ profile: Profile }>(ENDPOINTS.ASTROLOGER_PANEL.OVERVIEW)
      .then((d) => setProfile(d.profile))
      .catch((e) => toast.error(e instanceof Error ? e.message : "Could not load your profile"));
  }, []);

  return (
    <div className="mx-auto max-w-[900px] space-y-8 px-5 py-8 md:px-10 md:py-12">
      <PageHeader eyebrow="Practice" title="Profile" description="How you appear to clients. To change your details or rate, ask the TSP office." />

      {!profile ? (
        <Skeleton className="h-72" />
      ) : (
        <>
          <Panel bodyClassName="pt-6">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-champagne/60 bg-midnight font-cinzel text-2xl font-semibold text-champagne-light">
                {(profile.name || "A").replace(/^Dr\.?\s+/i, "").split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("")}
              </span>
              <div className="space-y-1">
                <h2 className="font-playfair text-2xl font-semibold text-ink">{profile.name}</h2>
                <p className="text-[14px] text-ink-3">{profile.email || user?.email}</p>
                <p className="flex items-center gap-1 text-[13px] text-bronze">
                  <Star className="h-3.5 w-3.5 fill-current" /> {profile.rating.toFixed(1)} rating
                </p>
              </div>
            </div>
            <dl className="mt-6 grid grid-cols-2 gap-6 border-t border-hairline pt-6">
              <div>
                <dt className="text-[12px] text-ink-3">Rate</dt>
                <dd className="font-inter text-[17px] font-semibold text-ink">{formatINR(profile.pricingPerMin)}/min</dd>
              </div>
              <div>
                <dt className="text-[12px] text-ink-3">Instant chat & calls</dt>
                <dd className="font-inter text-[17px] font-semibold text-ink">{profile.isAvailable ? "Available" : "Paused"}</dd>
              </div>
            </dl>
          </Panel>

          <Panel title="About you" subtitle="Shown to clients">
            <p className="text-[15px] leading-relaxed whitespace-pre-line text-ink-2">{profile.bio || "No bio yet."}</p>
          </Panel>

          <StaffSecurity />
        </>
      )}
    </div>
  );
}
