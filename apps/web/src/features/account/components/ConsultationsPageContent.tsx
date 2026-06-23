"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CalendarClock, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/http/client";
import { ENDPOINTS } from "@/lib/constants/http/endpoints";
import { ROUTES } from "@/lib/constants/routes";
import type { Consultation } from "@/types/api";

export default function ConsultationsPageContent() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadConsultations = useCallback(async () => {
    try {
      setLoading(true);
      setConsultations(
        await apiClient.get<Consultation[]>(ENDPOINTS.CONSULTATIONS.LIST)
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load consultations."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const initialLoad = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiClient.get<Consultation[]>(
          ENDPOINTS.CONSULTATIONS.LIST
        );
        if (!cancelled) setConsultations(data);
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load consultations."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void initialLoad();

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        void initialLoad();
      }
    };

    window.addEventListener("pageshow", handlePageShow);

    return () => {
      cancelled = true;
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

  const cancelConsultation = async (id: string) => {
    try {
      setActionId(id);
      setError(null);
      await apiClient.post(ENDPOINTS.CONSULTATIONS.CANCEL(id));
      await loadConsultations();
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Unable to cancel consultation."
      );
    } finally {
      setActionId(null);
    }
  };

  return (
    <section className="py-12 md:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">
          Guidance
        </p>
        <h1 className="mt-2 font-heading text-3xl font-bold text-dark">
          Consultations
        </h1>
        <p className="mt-2 text-sm text-paragraph">
          Your upcoming and completed sessions with TSP astrologers.
        </p>

        {error && (
          <div className="mt-6 rounded-card border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex min-h-64 items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-navy" />
          </div>
        ) : consultations.length === 0 ? (
          <div className="mt-8 rounded-card-lg border border-border bg-white px-6 py-14 text-center shadow-card">
            <CalendarClock className="mx-auto h-10 w-10 text-gold" />
            <h2 className="mt-4 font-heading text-xl font-bold text-dark">
              No consultations booked
            </h2>
            <Link
              href={ROUTES.CHAT}
              className="mt-5 inline-flex rounded-button bg-navy px-5 py-2.5 text-sm font-semibold text-white"
            >
              Find an astrologer
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {consultations.map((consultation) => (
              <article
                key={consultation.id}
                className="rounded-card-lg border border-border bg-white p-6 shadow-card"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-heading text-xl font-bold text-dark">
                      {consultation.astrologer.user.name || "TSP Astrologer"}
                    </h2>
                    <p className="mt-1 text-sm text-muted">
                      {new Date(consultation.scheduledAt).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <span className="rounded-button bg-cream px-3 py-1 text-xs font-semibold text-navy">
                    {consultation.status}
                  </span>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-4 text-sm">
                  <div>
                    <p className="text-xs text-muted">Rate</p>
                    <p className="font-semibold text-dark">
                      ₹{Number(consultation.lockedPricingPerMin).toFixed(2)}/min
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Final cost</p>
                    <p className="font-semibold text-dark">
                      {consultation.cost
                        ? `₹${Number(consultation.cost).toFixed(2)}`
                        : "Not charged"}
                    </p>
                  </div>
                </div>
                {consultation.status === "ACTIVE" && (
                  <Link
                    href={`/consultations/${consultation.id}/${consultation.type === "CALL" ? "call" : "chat"}`}
                    className="mt-5 inline-flex rounded-button bg-navy hover:bg-navy-hover px-4 py-2 text-xs font-semibold text-white transition-colors"
                  >
                    {consultation.type === "CALL" ? "Join Call Room" : "Join Chat Room"}
                  </Link>
                )}
                {consultation.status === "PENDING" && (
                  <button
                    type="button"
                    disabled={actionId === consultation.id}
                    onClick={() => void cancelConsultation(consultation.id)}
                    className="mt-5 rounded-button border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-60"
                  >
                    {actionId === consultation.id
                      ? "Cancelling..."
                      : "Cancel consultation"}
                  </button>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
