"use client";

import { CheckCircle2 } from "lucide-react";
import type { ServiceDefinition, ServicePlan } from "@/lib/data/service-catalog";
import { formatCalendarDate, formatSlot, formatTime24 } from "./booking-format";

interface Props {
  service: ServiceDefinition;
  plan: ServicePlan;
  formData: Record<string, string>;
  scheduledDate: string;
  scheduledSlot: string;
  urgencyTier: string;
  onBack: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  /** Message from the last failed payment attempt, shown above the Pay button. */
  error?: string | null;
}

const SURCHARGE: Record<string, number> = {
  STANDARD: 0,
  NEXT_DAY: 0.25,
  SAME_DAY: 0.50,
};

export default function ReviewStep({
  service,
  plan,
  formData,
  scheduledDate,
  scheduledSlot,
  urgencyTier,
  onBack,
  onConfirm,
  isLoading,
  error,
}: Props) {
  // Show what the client entered, in form order, with the form's own labels.
  // (Consent and uploads aren't "details" — they're left out.)
  const displayFields = service.formFields
    .filter((f) => f.type !== 'file')
    .map((f) => {
      const raw = (formData[f.name] || '').trim();
      if (!raw) return null;
      let value = raw;
      if (f.type === 'date') value = formatCalendarDate(raw);
      else if (f.type === 'time') value = formatTime24(raw);
      else if (f.type === 'tel') value = `+91 ${raw}`;
      return { key: f.name, label: f.label.replace(/\s*\(optional\)\s*$/i, ''), value, long: f.type === 'textarea' };
    })
    .filter((f): f is { key: string; label: string; value: string; long: boolean } => f !== null);

  const surcharge = Math.round(plan.priceINR * (SURCHARGE[urgencyTier] || 0));
  const displayTotal = plan.priceINR + surcharge;
  const isReport = service.bookingCategory === 'REPORT';

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
                    {formatCalendarDate(scheduledDate, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
                {scheduledSlot && (
                  <div className="flex justify-between">
                    <span className="text-sm text-[#6B5F52]">Time Slot</span>
                    <span className="text-sm font-semibold text-[#1E1A16]">{formatSlot(scheduledSlot)}</span>
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
                {displayFields.map(({ key, label, value, long }) =>
                  long ? (
                    <div key={key} className="space-y-1">
                      <span className="block text-sm text-[#6B5F52]">{label}</span>
                      <p className="text-sm font-medium text-[#1E1A16] whitespace-pre-line break-words">{value}</p>
                    </div>
                  ) : (
                    <div key={key} className="flex justify-between gap-4">
                      <span className="text-sm text-[#6B5F52] shrink-0">{label}</span>
                      <span className="text-sm font-medium text-[#1E1A16] text-right break-words min-w-0">{value}</span>
                    </div>
                  )
                )}
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
                  ₹{plan.priceINR.toLocaleString('en-IN')}
                </span>
              </div>
              
              {surcharge > 0 ? (
                <div className="flex justify-between text-sm">
                  <span className="text-[#C8A04A]">Priority Surcharge</span>
                  <span className="text-[#C8A04A]">+ ₹{surcharge.toLocaleString('en-IN')}</span>
                </div>
              ) : null}

              <div className="border-t border-[#EFEBE1] pt-3 flex justify-between">
                <span className="font-semibold text-[#1E1A16]">Total</span>
                <span className="font-heading text-xl font-bold text-[#1E1A16]">
                  ₹{displayTotal.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {error && (
              <p role="alert" className="text-xs text-rose-500 mb-4 font-medium text-center">{error}</p>
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
              {isReport
                ? 'Your report is prepared personally and kept confidential.'
                : 'All consultations are confidential.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
