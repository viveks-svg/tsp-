"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import type { ServiceDefinition, ServicePlan } from "@/lib/data/service-catalog";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/http/client";

interface Props {
  sessionId: string;
  service: ServiceDefinition;
  plan: ServicePlan;
  formData: Record<string, string>;
  scheduledDate: string;
  scheduledSlot: string;
  urgencyTier: string;
  onBack: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

const SURCHARGE: Record<string, number> = {
  STANDARD: 0,
  NEXT_DAY: 0.25,
  SAME_DAY: 0.50,
};

export default function ReviewStep({
  sessionId,
  service,
  plan,
  formData,
  scheduledDate,
  scheduledSlot,
  urgencyTier,
  onBack,
  onConfirm,
  isLoading,
}: Props) {
  const [serverPrice, setServerPrice] = useState<{ amount: number; currency: string; breakdown: Record<string, number> } | null>(null);
  const [isFetchingPrice, setIsFetchingPrice] = useState(true);
  const [priceError, setPriceError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const data = await apiClient.get<{ amount: number; currency: string; breakdown: Record<string, number> }>(`/leads/${sessionId}/price`);
        setServerPrice(data);
      } catch (err: any) {
        setPriceError(err.message || "Failed to fetch price");
      } finally {
        setIsFetchingPrice(false);
      }
    };
    fetchPrice();
  }, [sessionId]);

  // Group form fields for display — skip empty values
  const displayFields = Object.entries(formData).filter(
    ([, value]) => value && value.trim() !== ""
  );

  const calculatedTotal = plan.priceINR * (1 + (SURCHARGE[urgencyTier] || 0));
  const displayTotal = serverPrice?.amount ?? calculatedTotal;

  return (
    <div className="p-6 sm:p-8">
      <button
        onClick={onBack}
        className="text-sm text-[#8B6914] hover:text-[#C99411] font-medium mb-6 flex items-center gap-1 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Form
      </button>

      <div className="mb-8">
        <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#1E1A16]">
          Review Your Booking
        </h2>
        <p className="text-[#6B5F52] text-sm mt-2">
          Please review the details below before proceeding to payment.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left — Details */}
        <div className="lg:col-span-3 space-y-6">
          {/* Service & Plan */}
          <div className="bg-white rounded-xl border border-[#EFEBE1] p-5">
            <h3 className="text-xs font-bold text-[#8B6914] uppercase tracking-[0.15em] mb-3 font-poppins">
              Service & Plan
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-[#6B5F52]">Service</span>
                <span className="text-sm font-semibold text-[#1E1A16]">{service.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[#6B5F52]">Plan</span>
                <span className="text-sm font-semibold text-[#1E1A16]">{plan.name}</span>
              </div>
            </div>
          </div>

          {/* Schedule */}
          {service.requiresSlot && scheduledDate && (
            <div className="bg-white rounded-xl border border-[#EFEBE1] p-5">
              <h3 className="text-xs font-bold text-[#8B6914] uppercase tracking-[0.15em] mb-3 font-poppins">
                Schedule
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-[#6B5F52]">Date</span>
                  <span className="text-sm font-semibold text-[#1E1A16]">
                    {new Date(scheduledDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
                {scheduledSlot && (
                  <div className="flex justify-between">
                    <span className="text-sm text-[#6B5F52]">Time Slot</span>
                    <span className="text-sm font-semibold text-[#1E1A16]">{scheduledSlot}</span>
                  </div>
                )}
                {urgencyTier !== 'STANDARD' && (
                  <div className="flex justify-between">
                    <span className="text-sm text-[#6B5F52]">Priority</span>
                    <span className="text-sm font-semibold text-[#C8A04A]">{urgencyTier.replace('_', ' ')}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Form Data */}
          {displayFields.length > 0 && (
            <div className="bg-white rounded-xl border border-[#EFEBE1] p-5">
              <h3 className="text-xs font-bold text-[#8B6914] uppercase tracking-[0.15em] mb-3 font-poppins">
                Your Details
              </h3>
              <div className="space-y-2">
                {displayFields.map(([key, value]) => {
                  // Human-readable label from field name
                  const label = key
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/^./, (str) => str.toUpperCase())
                    .trim();
                  return (
                    <div key={key} className="flex justify-between gap-4">
                      <span className="text-sm text-[#6B5F52] shrink-0">{label}</span>
                      <span className="text-sm font-medium text-[#1E1A16] text-right truncate">{value}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Plan Features */}
          <div className="bg-white rounded-xl border border-[#EFEBE1] p-5">
            <h3 className="text-xs font-bold text-[#8B6914] uppercase tracking-[0.15em] mb-3 font-poppins">
              What&apos;s Included
            </h3>
            <ul className="space-y-2">
              {plan.features.map((feat) => (
                <li key={feat} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#C8A04A] shrink-0 mt-0.5" />
                  <span className="text-sm text-[#6B5F52]">{feat}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right — Payment Summary */}
        <div className="lg:col-span-2">
          <div className="bg-[#FAFAF8] rounded-xl border border-[#EFEBE1] p-6 sticky top-[140px]">
            <h3 className="font-heading text-xl font-bold text-[#1E1A16] mb-6">
              Payment Summary
            </h3>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-[#6B5F52]">{service.name} — {plan.name}</span>
                <span className="text-[#1E1A16]">
                  {isFetchingPrice && !serverPrice ? <Loader2 className="w-4 h-4 animate-spin text-[#C8A04A]" /> : `₹${(serverPrice?.breakdown?.basePrice || plan.priceINR).toLocaleString('en-IN')}`}
                </span>
              </div>
              
              {serverPrice?.breakdown?.urgencySurcharge || (SURCHARGE[urgencyTier] > 0) ? (
                <div className="flex justify-between text-sm">
                  <span className="text-[#C8A04A]">Priority Surcharge</span>
                  <span className="text-[#C8A04A]">+ ₹{(serverPrice?.breakdown?.urgencySurcharge || (plan.priceINR * (SURCHARGE[urgencyTier] || 0))).toLocaleString('en-IN')}</span>
                </div>
              ) : null}

              <div className="border-t border-[#EFEBE1] pt-3 flex justify-between">
                <span className="font-semibold text-[#1E1A16]">Total</span>
                <span className="font-heading text-xl font-bold text-[#1E1A16]">
                  ₹{displayTotal.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {priceError && (
              <p className="text-xs text-rose-500 mb-4 font-medium text-center">{priceError}</p>
            )}

            <button
              disabled={isLoading}
              onClick={onConfirm}
              className="w-full bg-gradient-to-r from-[#C8A04A] to-[#A6832E] text-white py-3.5 rounded-full font-semibold text-sm hover:from-[#D4AC5A] hover:to-[#B8933E] shadow-[0_4px_20px_rgba(200,160,74,0.25)] hover:shadow-[0_6px_28px_rgba(200,160,74,0.35)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Processing…' : `Pay ₹${displayTotal.toLocaleString('en-IN')}`}
            </button>

            <p className="text-xs text-[#9CA3AF] mt-4 text-center leading-relaxed">
              By proceeding, you agree to our Terms of Service.
              All consultations are confidential.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
