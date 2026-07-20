'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Script from 'next/script';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Loader2, AlertCircle, Phone, Mail, User, Shield } from 'lucide-react';
import { apiClient } from '@/lib/http/client';
import { useBookingSession } from './useBookingSession';
import type { BookingStep, BookingContentConfig, PriceRevealResponse } from './types';
import type { FormField } from '@/lib/data/service-catalog';
import FormFieldComponent from '@/components/ui/FormField';

// ── Step Indicator ───────────────────────────────────────────────────────────

const STEP_LABELS: { key: BookingStep; label: string; num: number }[] = [
  { key: 'contact', label: 'Contact', num: 1 },
  { key: 'details', label: 'Details', num: 2 },
  { key: 'review',  label: 'Review',  num: 3 },
  { key: 'payment', label: 'Payment', num: 4 },
];

function StepIndicator({ currentStep }: { currentStep: BookingStep }) {
  const currentIdx = STEP_LABELS.findIndex((s) => s.key === currentStep);
  return (
    <div className="flex items-center justify-center gap-0 px-4 py-5 border-b border-[#EFEBE1]">
      {STEP_LABELS.map((step, i) => {
        const isActive = i === currentIdx;
        const isCompleted = i < currentIdx;
        return (
          <div key={step.key} className="flex items-center">
            {i > 0 && (
              <div className={`w-8 sm:w-12 h-[2px] transition-colors duration-300 ${isCompleted ? 'bg-[#C8A04A]' : 'bg-[#EFEBE1]'}`} />
            )}
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-[#C8A04A] text-white shadow-[0_0_0_3px_rgba(200,160,74,0.2)]'
                    : isCompleted
                      ? 'bg-[#C8A04A] text-white'
                      : 'bg-[#EFEBE1] text-[#9CA3AF]'
                }`}
              >
                {isCompleted ? '✓' : step.num}
              </div>
              <span className={`text-[10px] font-medium hidden sm:block ${
                isActive ? 'text-[#C8A04A]' : isCompleted ? 'text-[#8B6914]' : 'text-[#9CA3AF]'
              }`}>
                {step.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Slide Animation Wrapper ──────────────────────────────────────────────────

const slideVariants = {
  enter: { opacity: 0, x: 40 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
};

// ── Contact Step ─────────────────────────────────────────────────────────────

function ContactStep({
  config,
  sessionId,
  onSuccess,
}: {
  config: BookingContentConfig;
  sessionId: string;
  onSuccess: (data: { name: string; phone: string; email: string }) => void;
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [networkError, setNetworkError] = useState<string | null>(null);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim() || name.trim().length < 2) errs.name = 'Name is required (min 2 characters)';
    if (!/^[a-zA-Z\s]+$/.test(name.trim())) errs.name = 'Name must contain only letters and spaces';
    const cleanPhone = phone.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) errs.phone = 'Enter a valid 10-digit Indian mobile number';
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Enter a valid email address';
    if (!consent) errs.consent = 'You must consent to be contacted';
    return errs;
  };

  const handleSubmit = async () => {
    setNetworkError(null);
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setIsSubmitting(true);
    try {
      await apiClient.post('/leads/contact', {
        sessionId,
        solutionSlug: config.solutionSlug,
        solutionName: config.solutionName,
        name: name.trim(),
        phone: phone.replace(/\D/g, ''),
        email: email || undefined,
        consentToContact: true,
      });
      onSuccess({ name: name.trim(), phone: phone.replace(/\D/g, ''), email });
    } catch (err: any) {
      setNetworkError(err.message || 'Failed to save your information. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 max-w-xl mx-auto">
      <div className="mb-8">
        <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#1E1A16]">
          Let&apos;s Get Started
        </h2>
        <p className="text-[#6B5F52] text-sm mt-2">
          Share your contact details so we can reach out regarding your{' '}
          <span className="font-semibold text-[#1E1A16]">{config.solutionName}</span> consultation.
        </p>
      </div>

      <div className="space-y-5">
        {/* Name */}
        <div>
          <label className="flex items-center gap-1.5 text-sm text-[#4B5563] mb-1.5 font-medium">
            <User className="w-3.5 h-3.5 text-[#8B6914]" />
            Full Name <span className="text-[#C8A04A]">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value.replace(/[0-9]/g, '')); setErrors((p) => ({ ...p, name: '' })); }}
            placeholder="Enter your full name"
            className={`w-full px-4 py-3 bg-[#FAFAF8] border ${errors.name ? 'border-rose-400' : 'border-[#EFEBE1]'} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A04A]/30 focus:border-[#C8A04A] transition-all`}
          />
          {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name}</p>}
        </div>

        {/* Phone */}
        <div>
          <label className="flex items-center gap-1.5 text-sm text-[#4B5563] mb-1.5 font-medium">
            <Phone className="w-3.5 h-3.5 text-[#8B6914]" />
            Phone Number <span className="text-[#C8A04A]">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#9CA3AF]">+91</span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setErrors((p) => ({ ...p, phone: '' })); }}
              placeholder="9876543210"
              maxLength={10}
              className={`w-full pl-12 pr-4 py-3 bg-[#FAFAF8] border ${errors.phone ? 'border-rose-400' : 'border-[#EFEBE1]'} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A04A]/30 focus:border-[#C8A04A] transition-all`}
            />
          </div>
          {errors.phone && <p className="text-xs text-rose-500 mt-1">{errors.phone}</p>}
        </div>

        {/* Email (optional) */}
        <div>
          <label className="flex items-center gap-1.5 text-sm text-[#4B5563] mb-1.5 font-medium">
            <Mail className="w-3.5 h-3.5 text-[#8B6914]" />
            Email Address <span className="text-xs text-[#9CA3AF]">(optional)</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: '' })); }}
            placeholder="you@example.com"
            className={`w-full px-4 py-3 bg-[#FAFAF8] border ${errors.email ? 'border-rose-400' : 'border-[#EFEBE1]'} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A04A]/30 focus:border-[#C8A04A] transition-all`}
          />
          {errors.email && <p className="text-xs text-rose-500 mt-1">{errors.email}</p>}
        </div>

        {/* Consent checkbox */}
        <div className="bg-[#FAFAF8] border border-[#EFEBE1] rounded-xl p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => { setConsent(e.target.checked); setErrors((p) => ({ ...p, consent: '' })); }}
              className="mt-0.5 w-4 h-4 rounded border-[#EFEBE1] text-[#C8A04A] focus:ring-[#C8A04A] accent-[#C8A04A]"
            />
            <div>
              <span className="text-sm text-[#4B5563] leading-relaxed">
                I consent to being contacted by Time Space & Planets regarding this consultation.
              </span>
              <div className="flex items-center gap-1 mt-1.5 text-[10px] text-[#9CA3AF]">
                <Shield className="w-3 h-3" />
                Your information is kept strictly confidential
              </div>
            </div>
          </label>
          {errors.consent && <p className="text-xs text-rose-500 mt-2">{errors.consent}</p>}
        </div>
      </div>

      {/* Network error */}
      {networkError && (
        <div className="mt-4 flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-rose-700">{networkError}</p>
            <button
              onClick={handleSubmit}
              className="text-xs font-semibold text-rose-600 hover:text-rose-800 mt-1 underline"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Submit */}
      <div className="mt-8">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full py-3.5 bg-[#1E1A16] text-white rounded-full text-sm font-semibold hover:bg-[#C8A04A] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving…
            </>
          ) : (
            'Continue to Details →'
          )}
        </button>
      </div>
    </div>
  );
}

// ── Details Step ─────────────────────────────────────────────────────────────

function DetailsStep({
  config,
  sessionId,
  formData,
  setFormData,
  scheduledDate,
  setScheduledDate,
  scheduledSlot,
  setScheduledSlot,
  onBack,
  onNext,
}: {
  config: BookingContentConfig;
  sessionId: string;
  formData: Record<string, string>;
  setFormData: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  scheduledDate: string;
  setScheduledDate: (v: string) => void;
  scheduledSlot: string;
  setScheduledSlot: (v: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced autosave — 800ms after last change
  const autosave = useCallback(
    (data: Record<string, string>) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        try {
          await apiClient.patch(`/leads/${sessionId}/details`, {
            formData: data,
          });
        } catch {
          // Silent — autosave is best-effort
        }
      }, 800);
    },
    [sessionId],
  );

  const updateField = useCallback(
    (key: string, value: string) => {
      let finalValue = value;
      if (key.toLowerCase().includes('name')) {
        finalValue = value.replace(/[0-9]/g, '');
      }
      setFormData((prev) => {
        const updated = { ...prev, [key]: finalValue };
        autosave(updated);
        return updated;
      });
      setFieldErrors((prev) => ({ ...prev, [key]: '' }));
    },
    [autosave, setFormData],
  );

  // Group fields by section
  const sections: Record<string, FormField[]> = {};
  for (const field of config.detailFields) {
    // Skip contact fields — already captured in step 1
    if (['fullName', 'email', 'phone'].includes(field.name)) continue;
    const section = field.section || 'Details';
    if (!sections[section]) sections[section] = [];
    sections[section].push(field);
  }

  const handleNext = () => {
    setFormError(null);
    const newErrors: Record<string, string> = {};

    // Validate required fields
    for (const field of config.detailFields) {
      if (['fullName', 'email', 'phone'].includes(field.name)) continue;
      if (field.required && (!formData[field.name] || formData[field.name].trim() === '')) {
        newErrors[field.name] = `${field.label} is required`;
      }
    }

    // Date/time for slot-based services
    if (config.requiresSlot) {
      if (!scheduledDate) newErrors.scheduledDate = 'Date is required';
      if (!scheduledSlot) newErrors.scheduledSlot = 'Time is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      setFormError('Please fix the highlighted errors.');
      return;
    }

    // Final save before moving on
    autosave({ ...formData, scheduledDate, scheduledSlot });
    setFieldErrors({});
    onNext();
  };

  // Clean up debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className="p-6 sm:p-8">
      <button
        onClick={onBack}
        className="text-sm text-[#8B6914] hover:text-[#C99411] font-medium mb-6 flex items-center gap-1 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Contact
      </button>

      <div className="mb-8">
        <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#1E1A16]">
          Tell Us About Your Needs
        </h2>
        <p className="text-[#6B5F52] text-sm mt-2">
          Fill in the details for your <span className="font-semibold text-[#1E1A16]">{config.solutionName}</span> consultation.
        </p>
        <p className="text-[10px] text-[#9CA3AF] mt-1 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
          Your progress is saved automatically
        </p>
      </div>

      <div className="space-y-8 max-w-2xl">
        {Object.entries(sections).map(([sectionName, fields]) => (
          <div key={sectionName}>
            <h3 className="text-xs font-bold text-[#8B6914] uppercase tracking-[0.15em] mb-4 font-poppins">
              {sectionName}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {fields.map((field) => {
                if (field.type === 'file') {
                  return (
                    <div key={field.name} className="sm:col-span-2">
                      <label className="block text-sm text-[#4B5563] mb-1.5 font-medium">
                        {field.label} {field.required && <span className="text-[#C8A04A]">*</span>}
                      </label>
                      <div className="w-full px-4 py-3 bg-[#FAFAF8] border border-dashed border-[#EFEBE1] rounded-xl text-sm text-[#9CA3AF] text-center cursor-not-allowed">
                        File upload coming soon — share via email after booking
                      </div>
                    </div>
                  );
                }

                return (
                  <FormFieldComponent
                    key={field.name}
                    label={field.label}
                    name={field.name}
                    type={field.type as any}
                    value={formData[field.name] || ''}
                    onChange={(val) => updateField(field.name, val)}
                    required={field.required}
                    placeholder={field.placeholder}
                    options={field.options}
                    error={fieldErrors[field.name]}
                    className={field.type === 'textarea' ? 'sm:col-span-2' : ''}
                  />
                );
              })}
            </div>
          </div>
        ))}

        {/* Date/Time for slot-based services */}
        {config.requiresSlot && (
          <div>
            <h3 className="text-xs font-bold text-[#8B6914] uppercase tracking-[0.15em] mb-4 font-poppins">
              Preferred Schedule
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormFieldComponent
                label="Preferred Date"
                name="scheduledDate"
                type="date"
                required
                value={scheduledDate}
                onChange={(val) => { setScheduledDate(val); setFieldErrors((p) => ({ ...p, scheduledDate: '' })); }}
                min={new Date().toISOString().split('T')[0]}
                error={fieldErrors.scheduledDate}
              />
              <FormFieldComponent
                label="Preferred Time"
                name="scheduledSlot"
                type="select"
                value={scheduledSlot}
                onChange={(val) => { setScheduledSlot(val); setFieldErrors((p) => ({ ...p, scheduledSlot: '' })); }}
                error={fieldErrors.scheduledSlot}
                options={[
                  '10:00-11:00 AM',
                  '11:00-12:00 PM',
                  '02:00-03:00 PM',
                  '03:00-04:00 PM',
                  '04:00-05:00 PM',
                  '05:00-06:00 PM',
                ]}
              />
            </div>
          </div>
        )}
      </div>

      {/* Next Button */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-end gap-4">
        {formError && (
          <p className="text-sm font-semibold text-rose-500 animate-fade-in text-center sm:text-right">
            {formError}
          </p>
        )}
        <button
          onClick={handleNext}
          className="px-8 py-3 bg-[#1E1A16] text-white rounded-full text-sm font-semibold hover:bg-[#C8A04A] transition-all duration-300"
        >
          Review Booking →
        </button>
      </div>
    </div>
  );
}

// ── Review Step ──────────────────────────────────────────────────────────────

function ReviewStepInner({
  config,
  sessionId,
  contactData,
  formData,
  scheduledDate,
  scheduledSlot,
  onBack,
  onPay,
  isPaymentLoading,
}: {
  config: BookingContentConfig;
  sessionId: string;
  contactData: { name: string; phone: string; email: string };
  formData: Record<string, string>;
  scheduledDate: string;
  scheduledSlot: string;
  onBack: () => void;
  onPay: (priceData: PriceRevealResponse) => void;
  isPaymentLoading: boolean;
}) {
  const [priceData, setPriceData] = useState<PriceRevealResponse | null>(null);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [isLoadingPrice, setIsLoadingPrice] = useState(true);

  // Fetch price on mount — this is the ONLY place price appears
  useEffect(() => {
    let cancelled = false;
    const fetchPrice = async () => {
      setIsLoadingPrice(true);
      setPriceError(null);
      try {
        const data = await apiClient.get<PriceRevealResponse>(
          `/leads/${sessionId}/price`,
        );
        if (!cancelled) setPriceData(data);
      } catch (err: any) {
        if (!cancelled) setPriceError(err.message || 'Failed to load pricing');
      } finally {
        if (!cancelled) setIsLoadingPrice(false);
      }
    };
    fetchPrice();
    return () => { cancelled = true; };
  }, [sessionId]);

  const displayFields = Object.entries(formData).filter(
    ([key, value]) => value && value.trim() !== '' && !['fullName', 'email', 'phone'].includes(key),
  );

  return (
    <div className="p-6 sm:p-8">
      <button
        onClick={onBack}
        className="text-sm text-[#8B6914] hover:text-[#C99411] font-medium mb-6 flex items-center gap-1 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Details
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
          {/* Service */}
          <div className="bg-white rounded-xl border border-[#EFEBE1] p-5">
            <h3 className="text-xs font-bold text-[#8B6914] uppercase tracking-[0.15em] mb-3 font-poppins">
              Service
            </h3>
            <p className="text-sm font-semibold text-[#1E1A16]">{config.solutionName}</p>
          </div>

          {/* Contact Info */}
          <div className="bg-white rounded-xl border border-[#EFEBE1] p-5">
            <h3 className="text-xs font-bold text-[#8B6914] uppercase tracking-[0.15em] mb-3 font-poppins">
              Contact Information
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-[#6B5F52]">Name</span>
                <span className="text-sm font-semibold text-[#1E1A16]">{contactData.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[#6B5F52]">Phone</span>
                <span className="text-sm font-semibold text-[#1E1A16]">+91 {contactData.phone}</span>
              </div>
              {contactData.email && (
                <div className="flex justify-between">
                  <span className="text-sm text-[#6B5F52]">Email</span>
                  <span className="text-sm font-semibold text-[#1E1A16]">{contactData.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Schedule */}
          {config.requiresSlot && scheduledDate && (
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
              </div>
            </div>
          )}

          {/* Form Details */}
          {displayFields.length > 0 && (
            <div className="bg-white rounded-xl border border-[#EFEBE1] p-5">
              <h3 className="text-xs font-bold text-[#8B6914] uppercase tracking-[0.15em] mb-3 font-poppins">
                Your Details
              </h3>
              <div className="space-y-2">
                {displayFields.map(([key, value]) => {
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
        </div>

        {/* Right — Payment Summary */}
        <div className="lg:col-span-2">
          <div className="bg-[#FAFAF8] rounded-xl border border-[#EFEBE1] p-6 sticky top-[140px]">
            <h3 className="font-heading text-xl font-bold text-[#1E1A16] mb-6">
              Payment Summary
            </h3>

            {isLoadingPrice ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-[#C8A04A] animate-spin" />
                <span className="ml-2 text-sm text-[#6B5F52]">Loading pricing…</span>
              </div>
            ) : priceError ? (
              <div className="py-4 text-center">
                <p className="text-sm text-rose-600">{priceError}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="text-xs text-[#8B6914] underline mt-2"
                >
                  Retry
                </button>
              </div>
            ) : priceData ? (
              <>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6B5F52]">{config.solutionName}</span>
                    <span className="text-[#1E1A16]">{priceData.priceLabel}</span>
                  </div>
                  <div className="border-t border-[#EFEBE1] pt-3 flex justify-between">
                    <span className="font-semibold text-[#1E1A16]">Total</span>
                    <span className="font-heading text-xl font-bold text-[#1E1A16]">
                      {priceData.priceLabel}
                    </span>
                  </div>
                </div>

                <button
                  disabled={isPaymentLoading}
                  onClick={() => onPay(priceData)}
                  className="w-full bg-gradient-to-r from-[#C8A04A] to-[#A6832E] text-white py-3.5 rounded-full font-semibold text-sm hover:from-[#D4AC5A] hover:to-[#B8933E] shadow-[0_4px_20px_rgba(200,160,74,0.25)] hover:shadow-[0_6px_28px_rgba(200,160,74,0.35)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isPaymentLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing…
                    </>
                  ) : (
                    `Confirm & Pay ${priceData.priceLabel}`
                  )}
                </button>

                <p className="text-xs text-[#9CA3AF] mt-4 text-center leading-relaxed">
                  By proceeding, you agree to our Terms of Service.
                  All consultations are confidential.
                </p>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Success Step ─────────────────────────────────────────────────────────────

function SuccessStep({
  config,
  bookingId,
}: {
  config: BookingContentConfig;
  bookingId: string;
}) {
  return (
    <div className="p-6 sm:p-8 text-center max-w-lg mx-auto py-16">
      <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
      </div>
      <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#1E1A16] mb-3">
        Booking Confirmed!
      </h2>
      <p className="text-[#6B5F52] text-sm mb-2">
        Your <span className="font-semibold text-[#1E1A16]">{config.solutionName}</span> consultation has been booked.
      </p>
      <p className="text-xs text-[#9CA3AF] mb-8">
        Booking ID: <span className="font-mono">{bookingId}</span>
      </p>
      <div className="bg-[#FAFAF8] border border-[#EFEBE1] rounded-xl p-5 text-left space-y-3">
        <h3 className="text-xs font-bold text-[#8B6914] uppercase tracking-[0.15em] font-poppins">
          What Happens Next
        </h3>
        <ul className="space-y-2 text-sm text-[#6B5F52]">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#C8A04A] shrink-0 mt-0.5" />
            <span>You&apos;ll receive a confirmation SMS and email shortly.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#C8A04A] shrink-0 mt-0.5" />
            <span>Our team will reach out to confirm your appointment details.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#C8A04A] shrink-0 mt-0.5" />
            <span>Prepare any documents or questions for your session.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

// ── Main Engine ──────────────────────────────────────────────────────────────

interface BookingFormEngineProps {
  config: BookingContentConfig;
}

export default function BookingFormEngine({ config }: BookingFormEngineProps) {
  const { sessionId, resetSession } = useBookingSession(config.solutionSlug);

  const [step, setStep] = useState<BookingStep>('contact');
  const [contactData, setContactData] = useState({ name: '', phone: '', email: '' });
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledSlot, setScheduledSlot] = useState('');
  const [confirmedBookingId, setConfirmedBookingId] = useState<string | null>(null);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);

  // ── Razorpay Payment ───────────────────────────────────────────────────────
  const handlePay = async (priceData: PriceRevealResponse) => {
    setIsPaymentLoading(true);

    // Load Razorpay SDK
    const loadRazorpay = () =>
      new Promise((resolve) => {
        if (typeof window !== 'undefined' && (window as any).Razorpay) return resolve(true);
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });

    const isLoaded = await loadRazorpay();
    if (!isLoaded) {
      alert('Razorpay SDK failed to load. Are you offline?');
      setIsPaymentLoading(false);
      return;
    }

    try {
      // Determine the service slug for the booking API
      const data = await apiClient.post<any>('/bookings/initiate', {
        serviceCategory: 'CONSULTATION',
        serviceSlug: config.solutionSlug,
        serviceName: config.solutionName,
        urgencyTier: 'STANDARD',
        fullName: contactData.name,
        email: contactData.email || `${contactData.phone}@placeholder.tsp`,
        phone: contactData.phone,
        scheduledDate: scheduledDate || undefined,
        scheduledSlot: scheduledSlot || undefined,
        notes: formData.notes || formData.concerns || formData.businessProblems || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        timeOfBirth: formData.timeOfBirth || undefined,
        placeOfBirth: formData.placeOfBirth || undefined,
        businessName: formData.businessName || undefined,
        businessAddress: formData.businessAddress || undefined,
        spaceType: formData.spaceType || undefined,
        leadSessionId: sessionId,
      });

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: 'INR',
        name: 'Time Space & Planets',
        description: config.solutionName,
        image: '/images/logo.png',
        order_id: data.razorpayOrderId,
        prefill: {
          name: contactData.name,
          email: contactData.email,
          contact: contactData.phone,
        },
        theme: { color: '#1E1A16' },
        handler: async (response: any) => {
          try {
            await apiClient.post('/bookings/verify-payment', {
              bookingId: data.bookingId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              leadSessionId: sessionId,
            });
            setConfirmedBookingId(data.bookingId);
            resetSession(); // Clear session for next attempt
            setStep('success');
          } catch {
            alert('Payment verification failed. Please contact support.');
          } finally {
            setIsPaymentLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsPaymentLoading(false);
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        console.error('Payment failed:', response?.error?.description);
      });
      rzp.open();
    } catch (err: any) {
      alert(err.message ?? 'Failed to initiate booking.');
      setIsPaymentLoading(false);
    }
  };

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <div className="w-full">
        {step !== 'success' && <StepIndicator currentStep={step} />}

        <AnimatePresence mode="wait">
          {step === 'contact' && (
            <motion.div key="contact" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
              <ContactStep
                config={config}
                sessionId={sessionId}
                onSuccess={(data) => {
                  setContactData(data);
                  setStep('details');
                }}
              />
            </motion.div>
          )}

          {step === 'details' && (
            <motion.div key="details" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
              <DetailsStep
                config={config}
                sessionId={sessionId}
                formData={formData}
                setFormData={setFormData}
                scheduledDate={scheduledDate}
                setScheduledDate={setScheduledDate}
                scheduledSlot={scheduledSlot}
                setScheduledSlot={setScheduledSlot}
                onBack={() => setStep('contact')}
                onNext={() => setStep('review')}
              />
            </motion.div>
          )}

          {step === 'review' && (
            <motion.div key="review" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
              <ReviewStepInner
                config={config}
                sessionId={sessionId}
                contactData={contactData}
                formData={formData}
                scheduledDate={scheduledDate}
                scheduledSlot={scheduledSlot}
                onBack={() => setStep('details')}
                onPay={handlePay}
                isPaymentLoading={isPaymentLoading}
              />
            </motion.div>
          )}

          {step === 'success' && confirmedBookingId && (
            <motion.div key="success" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
              <SuccessStep config={config} bookingId={confirmedBookingId} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
