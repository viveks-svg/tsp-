"use client";

import { useEffect, useMemo, useState } from "react";
import { Users, Phone } from "lucide-react";
import PageWrapper from "@/components/layout/PageWrapper";
import StaggerContainer, { StaggerItem } from "@/components/animations/StaggerContainer";
import AstrologerFiltersBar from "@/features/astrologers/components/AstrologerFilters";
import AstrologerCard, { AstrologerCardSkeleton } from "@/features/astrologers/components/AstrologerCard";
import { filterAstrologers, mapApiAstrologer } from "@/lib/data/astrologers";
import { apiClient } from "@/lib/http/client";
import { ENDPOINTS } from "@/lib/constants/http/endpoints";
import { DEFAULT_ASTROLOGER_FILTERS, type Astrologer, type AstrologerFilters } from "@/types/astrologer";
import type { ApiAstrologer } from "@/types/api";

interface AstrologersPageContentProps {
  mode: "chat" | "call";
}

export default function AstrologersPageContent({ mode }: AstrologersPageContentProps) {
  const [filters, setFilters] = useState<AstrologerFilters>(
    DEFAULT_ASTROLOGER_FILTERS
  );
  const [loading, setLoading] = useState(true);
  const [astrologers, setAstrologers] = useState<Astrologer[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadAstrologers = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiClient.get<ApiAstrologer[]>(
          ENDPOINTS.ASTROLOGERS.LIST
        );
        if (!cancelled) {
          setAstrologers(data.map(mapApiAstrologer));
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load astrologers."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadAstrologers();

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        void loadAstrologers();
      }
    };

    window.addEventListener("pageshow", handlePageShow);

    return () => {
      cancelled = true;
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

  const filtered = useMemo(
    () => filterAstrologers(astrologers, filters),
    [astrologers, filters]
  );

  const isChat = mode === "chat";
  const title = isChat ? "Chat with an Astrologer" : "Call with an Astrologer";
  const description = isChat
    ? "Connect with verified Vedic experts for personalised guidance on love, career, health, and life's crossroads. First chat from ₹1."
    : "Connect via live audio/video call with verified Vedic experts for personalised guidance on love, career, health, and life's crossroads.";
  const EmptyIcon = isChat ? Users : Phone;

  return (
    <PageWrapper title={title} description={description}>
      <AstrologerFiltersBar
        filters={filters}
        onChange={setFilters}
        className="mb-8"
      />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <AstrologerCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-card-lg border border-rose-200 bg-rose-50 px-6 py-10 text-center">
          <h3 className="font-heading text-xl font-bold text-dark">
            We could not load the astrologers
          </h3>
          <p className="mt-2 text-sm text-rose-700">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 px-4 bg-card rounded-card-lg border border-border shadow-card">
          <EmptyIcon className="w-12 h-12 text-gold mx-auto mb-4" />
          <h3 className="font-heading text-xl font-bold text-dark mb-2">
            No astrologers match your filters
          </h3>
          <p className="text-paragraph text-sm max-w-md mx-auto mb-6">
            Try adjusting your language, specialty, or price range — our cosmic
            guides are waiting to connect with you.
          </p>
          <button
            type="button"
            onClick={() => setFilters(DEFAULT_ASTROLOGER_FILTERS)}
            className="text-navy font-poppins font-semibold text-sm hover:text-gold transition-colors"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((astrologer) => (
            <StaggerItem key={astrologer.id}>
              <AstrologerCard astrologer={astrologer} mode={mode} />
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}
    </PageWrapper>
  );
}
