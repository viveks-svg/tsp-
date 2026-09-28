'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Script from 'next/script';
import { apiClient } from '@/lib/http/client';
import { useBookingSession } from '@/lib/booking/useBookingSession';
import {
  getServiceById,
  type ServiceDefinition,
  type ServicePlan,
} from '@/lib/data/service-catalog';
import { useAuth } from '@/providers/AuthProvider';

import ServiceSelectStep from './ServiceSelectStep';
import PlanSelectStep from './PlanSelectStep';
import ReviewStep from './ReviewStep';
import BookingSuccess from './BookingSuccess';
import FormField from '@/components/ui/FormField';
import { validateEmail } from '@/lib/validations/validators';
import { formatCalendarDate, formatSlot, formatTime24, istDateString } from './booking-format';

// ── Types ────────────────────────────────────────────────────────────────────

export type BookingPageStep = 'service' | 'plan' | 'form' | 'review' | 'success';

// Legacy types kept for BookingCalendarStep & BookingFormStep compatibility
export type ServiceSlug = string;
export type BookingCategory = 'BUSINESS_VASTU' | 'CONSULTATION' | 'REPORT';

export interface BookingConfig {
  category: BookingCategory;
  slug: string;
  name: string;
  basePriceINR: number;
  requiresSlot: boolean;
  requiresBusinessDetails: boolean;
}

export interface BookingFormData {
  config: BookingConfig | null;
  scheduledDate: string;
  scheduledSlot: string;
  urgencyTier: 'STANDARD' | 'NEXT_DAY' | 'SAME_DAY';
  fullName: string;
  email: string;
  phone: string;
  notes: string;
  businessName: string;
  businessAddress: string;
  spaceType: string;
  // Dynamic form fields stored here too
  [key: string]: string | BookingConfig | null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function serviceCategoryFromCatalog(service: ServiceDefinition): BookingCategory {
  if (service.bookingCategory) return service.bookingCategory;
  if (service.category === 'business' || service.category === 'property') return 'BUSINESS_VASTU';
  return 'CONSULTATION';
}

/** Name shown on the booking, receipts and Razorpay. */
function bookingDisplayName(service: ServiceDefinition, plan: ServicePlan): string {
  return service.bookingCategory === 'REPORT' ? service.name : `${service.name} — ${plan.name}`;
}

// Same rule as the API: letters (any script), spaces, full stops, apostrophes, hyphens.
const PERSON_NAME_RE = /^[\p{L}][\p{L}\s.'\u2019-]*$/u;
const PERSON_NAME_FIELDS = new Set(['fullName', 'name', 'partnerName']);
const NOTES_MAX = 4000;

// Form fields the booking API accepts directly. Everything else the client
// tells us is folded into `notes` so Dr. Pradeep sees it.
const DTO_FIELDS = new Set([
  'fullName', 'email', 'phone', 'dateOfBirth', 'timeOfBirth', 'placeOfBirth',
  'businessName', 'businessAddress', 'spaceType', 'notes',
]);

function cleanLabel(label: string): string {
  return label.replace(/\s*\(optional\)\s*$/i, '').trim();
}

function buildNotes(service: ServiceDefinition, data: Record<string, string>): string | undefined {
  const lines: string[] = [];
  for (const field of service.formFields) {
    if (field.type === 'file' || DTO_FIELDS.has(field.name)) continue;
    const raw = (data[field.name] || '').trim();
    if (!raw) continue;
    const value =
      field.type === 'date' ? formatCalendarDate(raw)
        : field.type === 'time' ? formatTime24(raw)
          : raw;
    lines.push(`${cleanLabel(field.label)}: ${value}`);
  }
  const ownNotes = (data.notes || '').trim();
  if (ownNotes) {
    const notesField = service.formFields.find((f) => f.name === 'notes');
    lines.push(`${notesField ? cleanLabel(notesField.label) : 'Notes'}: ${ownNotes}`);
  }
  if (lines.length === 0) return undefined;
  const text = lines.join('\n');
  return text.length > NOTES_MAX ? `${text.slice(0, NOTES_MAX - 1)}…` : text;
}

// ── Steps indicator ──────────────────────────────────────────────────────────

const STEP_LABELS: { key: BookingPageStep; label: string }[] = [
  { key: 'service', label: 'Service' },
  { key: 'plan', label: 'Plan' },
  { key: 'form', label: 'Details' },
  { key: 'review', label: 'Review' },
  { key: 'success', label: 'Done' },
];

function StepIndicator({ currentStep }: { currentStep: BookingPageStep }) {
  const currentIndex = STEP_LABELS.findIndex((s) => s.key === currentStep);
  return (
    <div className="flex items-center justify-center gap-0 px-4 py-5 border-b border-[#EFEBE1]">
      {STEP_LABELS.filter(s => s.key !== 'success').map((step, i) => {
        const stepIndex = i;
        const isActive = stepIndex === currentIndex;
        const isCompleted = stepIndex < currentIndex;
        return (
          <div key={step.key} className="flex items-center">
            {i > 0 && (
              <div className={`w-8 sm:w-12 h-[2px] ${isCompleted ? 'bg-[#C8A04A]' : 'bg-[#EFEBE1]'}`} />
            )}
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${isActive
                  ? 'bg-[#C8A04A] text-white shadow-[0_0_0_3px_rgba(200,160,74,0.2)]'
                  : isCompleted
                    ? 'bg-[#C8A04A] text-white'
                    : 'bg-[#EFEBE1] text-[#9CA3AF]'
                  }`}
              >
                {isCompleted ? '✓' : stepIndex + 1}
              </div>
              <span className={`text-[10px] font-medium hidden sm:block ${isActive ? 'text-[#C8A04A]' : isCompleted ? 'text-[#8B6914]' : 'text-[#9CA3AF]'
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

// ── Dynamic Form Step (inline) ───────────────────────────────────────────────

function DynamicFormStep({
  sessionId,
  service,
  formData,
  updateFormField,
  scheduledDate,
  scheduledSlot,
  urgencyTier,
  setScheduledDate,
  setScheduledSlot,
  setUrgencyTier,
  onBack,
  onNext,
}: {
  sessionId?: string;
  service: ServiceDefinition;
  formData: Record<string, string>;
  updateFormField: (key: string, value: string) => void;
  scheduledDate: string;
  scheduledSlot: string;
  urgencyTier: string;
  setScheduledDate: (v: string) => void;
  setScheduledSlot: (v: string) => void;
  setUrgencyTier: (v: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  // After the first submit attempt, show every error — even on untouched fields.
  const [submitted, setSubmitted] = useState(false);

  const clearFieldError = (key: string) =>
    setFieldErrors((prev) => (prev[key] ? { ...prev, [key]: '' } : prev));

  // Sessions come from Dr. Pradeep's schedule (GET /slots), never a fixed list.
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  useEffect(() => {
    if (!service.requiresSlot || !scheduledDate) {
      setSlots([]);
      return;
    }
    let cancelled = false;
    setLoadingSlots(true);
    apiClient
      .get<{ slots?: string[] }>(`/slots?date=${scheduledDate}`)
      .then((data) => {
        if (cancelled) return;
        const next = data.slots ?? [];
        setSlots(next);
        if (scheduledSlot && !next.includes(scheduledSlot)) setScheduledSlot('');
      })
      .catch(() => !cancelled && setSlots([]))
      .finally(() => !cancelled && setLoadingSlots(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduledDate, service.requiresSlot]);

  // Standard bookings need two days' notice (enforced by the API too), in IST.
  // Dates are compared as YYYY-MM-DD strings so the client's timezone never matters.
  const earliestDate = istDateString(2);
  const todayIST = istDateString(0);

  // Group fields by section
  const sections: Record<string, typeof service.formFields> = {};
  for (const field of service.formFields) {
    const section = field.section || 'Details';
    if (!sections[section]) sections[section] = [];
    sections[section].push(field);
  }

  // Handle validation and proceed
  const handleNext = async () => {
    setFormError(null);
    const newErrors: Record<string, string> = {};

    // Check required fields
    const missingFields = service.formFields.filter(
      (f) => f.required && (!formData[f.name] || formData[f.name].trim() === '')
    );
    if (missingFields.length > 0) {
      missingFields.forEach((f) => {
        newErrors[f.name] = `${f.label} is required`;
      });
    }

    // check phone number 
    const phoneField = service.formFields.find(
      (f) => f.name.toLowerCase().includes('phone') || f.name.toLowerCase().includes('mobile')
    );
    if (phoneField && formData[phoneField.name]) {
      const phone = formData[phoneField.name].replace(/\D/g, "");
      if (phone.length !== 10) {
        newErrors[phoneField.name] = "Please enter a valid 10-digit phone number.";
      }
    }

    // check person names (not business names)
    for (const nameField of service.formFields.filter((f) => PERSON_NAME_FIELDS.has(f.name))) {
      const nameVal = (formData[nameField.name] || '').trim();
      if (!nameVal) continue;
      if (nameVal.length < 2) {
        newErrors[nameField.name] = "Name must be at least 2 characters long.";
      } else if (nameVal.length > 80) {
        newErrors[nameField.name] = "Name must be 80 characters or fewer.";
      } else if (!PERSON_NAME_RE.test(nameVal)) {
        newErrors[nameField.name] = "Please use letters only (spaces, full stops, apostrophes and hyphens are fine).";
      }
    }

    // Check email
    const emailField = service.formFields.find(
      (f) => f.type === 'email' || f.name.toLowerCase().includes('email')
    );
    if (emailField) {
      const email = formData[emailField.name];
      if (email) {
        const error = validateEmail(email);
        if (error) {
          newErrors[emailField.name] = error;
        }
      }
    }

    // Check date and time
    if (service.requiresSlot) {
      if (!scheduledDate) {
        newErrors['scheduledDate'] = 'Date is required.';
      }
      if (!scheduledSlot) {
        newErrors['scheduledSlot'] = 'Time is required.';
      }

      if (scheduledDate) {
        if (scheduledDate < todayIST) {
          newErrors['scheduledDate'] = 'Cannot select a past date for booking.';
        } else if (scheduledDate < earliestDate && urgencyTier === 'STANDARD') {
          newErrors['scheduledDate'] = 'Standard booking requires at least 2 days advance notice.';
        }
      }
    }

    if (!formData.consentToContact || formData.consentToContact !== 'true') {
      newErrors['consentToContact'] = 'You must consent to being contacted.';
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      setSubmitted(true);
      setFormError("Please fix the highlighted errors.");
      // Bring the first problem into view (in on-screen order) and focus it.
      const order = [
        ...service.formFields.map((f) => f.name),
        'scheduledDate',
        'scheduledSlot',
        'consentToContact',
      ];
      const first = order.find((k) => newErrors[k]);
      if (first) {
        requestAnimationFrame(() => {
          const wrapper = document.querySelector<HTMLElement>(`[data-field="${first}"]`);
          if (!wrapper) return;
          wrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
          wrapper.querySelector<HTMLElement>('input, select, textarea')?.focus({ preventScroll: true });
        });
      }
      return;
    }

    setFieldErrors({});
    if (!sessionId) {
      // Lead tracking isn't ready yet (storage just initialising) — don't block the client.
      onNext();
      return;
    }
    setIsSubmitting(true);
    try {
      await apiClient.post('/leads/contact', {
        sessionId,
        solutionSlug: service.id,
        solutionName: service.name,
        name: formData.fullName || formData.name || '',
        phone: formData.phone || '',
        email: formData.email || undefined,
        consentToContact: true,
      });

      await apiClient.patch(`/leads/${sessionId}/details`, {
        formData: formData
      });
      onNext();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 sm:p-8">
        <button
          onClick={onBack}
          className="text-sm text-[#8B6914] hover:text-[#C99411] font-medium mb-4 flex items-center gap-1 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {service.bookingCategory === 'REPORT' ? 'All Reports' : service.plans.length > 1 ? 'Change Plan' : 'Change Service'}
        </button>

        <div className="mb-5">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#1E1A16]">
            Tell Us About Your Needs
          </h2>
          <p className="text-[#6B5F52] text-sm mt-2">
            Fill in the details for your <span className="font-semibold text-[#1E1A16]">{service.name}</span>
            {service.bookingCategory === 'REPORT' ? ' report.' : ' consultation.'}
          </p>
        </div>

        {/* ── All form fields in ONE continuous 2-column grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
          {service.formFields.map((field) => {
            const value = formData[field.name] || '';

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
              <FormField
                key={field.name}
                label={field.label}
                name={field.name}
                type={field.type as any}
                value={value}
                onChange={(val) => { updateFormField(field.name, val); clearFieldError(field.name); }}
                required={field.required}
                placeholder={field.placeholder}
                options={field.options}
                error={fieldErrors[field.name]}
                forceShowError={submitted}
                maxLength={field.type === 'textarea' ? 2000 : undefined}
                rows={field.type === 'textarea' ? 2 : undefined}
                className={field.type === 'textarea' ? 'sm:col-span-2' : ''}
              />
            );
          })}
        </div>

        {/* Preferred Schedule — kept separate since slots are fetched dynamically */}
        {service.requiresSlot && (
          <div className="mt-5">
            <h3 className="text-xs font-bold text-[#8B6914] uppercase tracking-[0.15em] mb-3 font-poppins">
              Preferred Schedule
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
              <FormField
                label="Preferred Date"
                name="scheduledDate"
                type="date"
                required
                value={scheduledDate}
                onChange={(val) => { setScheduledDate(val); clearFieldError('scheduledDate'); }}
                min={earliestDate}
                error={fieldErrors['scheduledDate']}
                forceShowError={submitted}
              />
              <FormField
                label="Preferred Time"
                name="scheduledSlot"
                type="select"
                value={scheduledSlot}
                onChange={(val) => { setScheduledSlot(val); clearFieldError('scheduledSlot'); }}
                error={fieldErrors['scheduledSlot']}
                forceShowError={submitted}
                placeholder={
                  !scheduledDate
                    ? 'Choose a date first'
                    : loadingSlots
                      ? 'Finding available sessions…'
                      : slots.length === 0
                        ? 'No sessions available on this date'
                        : 'Select a session'
                }
                options={slots.map((slot) => ({ value: slot, label: formatSlot(slot) }))}
              />
            </div>
          </div>
        )}

        {/* Consent Checkbox */}
        <div className="mt-4 pt-4 border-t border-[#EFEBE1]" data-field="consentToContact">
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative flex items-center justify-center mt-0.5">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={formData.consentToContact === 'true'}
                onChange={(e) => { updateFormField('consentToContact', e.target.checked ? 'true' : 'false'); clearFieldError('consentToContact'); }}
              />
              <div className="w-5 h-5 border-2 border-[#EFEBE1] rounded bg-white transition-colors peer-checked:bg-[#C8A04A] peer-checked:border-[#C8A04A] group-hover:border-[#C8A04A]" />
              <svg className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-[#1E1A16]">I consent to being contacted</span>
              <span className="text-xs text-[#6B5F52]">
                We will only use this to discuss your {service.bookingCategory === 'REPORT' ? 'report' : 'consultation'}.
              </span>
            </div>
          </label>
          {fieldErrors['consentToContact'] && (
            <p className="text-xs text-rose-500 mt-2">{fieldErrors['consentToContact']}</p>
          )}
        </div>

        {/* Next Button */}
        <div className="mt-5 flex flex-col sm:flex-row items-center justify-end gap-4">
          {formError && (
            <p className="text-sm font-semibold text-rose-500 animate-fade-in text-center sm:text-right">
              {formError}
            </p>
          )}
          <button
            disabled={isSubmitting}
            onClick={handleNext}
            className="px-8 py-3 bg-[#1E1A16] text-white rounded-full text-sm font-semibold hover:bg-[#C8A04A] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? 'Saving...' : 'Review Booking →'}
          </button>
        </div>
    </div>
  );
}

// ── Background image per service ─────────────────────────────────────────────
const SERVICE_BG_MAP: Record<string, string> = {
  'relationship-guidance': '/images/booking-bg/relationship-guidance.jpg',
  'partnership-analysis': '/images/booking-bg/partnership-analysis.jpg',
  'residential-vastu': '/images/booking-bg/residential-vastu.jpg',
  'apartment-vastu': '/images/booking-bg/residential-vastu.jpg',
  'villa-planning': '/images/booking-bg/residential-vastu.jpg',
  'new-construction': '/images/booking-bg/residential-vastu.jpg',
  'career-guidance': '/images/booking-bg/career-guidance.jpg',
};

// ── Main Booking Flow ────────────────────────────────────────────────────────

export default function BookingFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceParam = searchParams.get('service');
  const planParam = searchParams.get('plan');

  const [step, setStep] = useState<BookingPageStep>('service');
  const [selectedService, setSelectedService] = useState<ServiceDefinition | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<ServicePlan | null>(null);
  const [dynamicFormData, setDynamicFormData] = useState<Record<string, string>>({});
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledSlot, setScheduledSlot] = useState('');
  const [urgencyTier, setUrgencyTier] = useState('STANDARD');
  const [confirmedBookingId, setConfirmedBookingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  // True when Razorpay charged the client but our verify call failed; the
  // webhook will still confirm the booking, so we must not offer Pay again.
  const [pendingConfirmation, setPendingConfirmation] = useState(false);

  // One lead session per service; empty until a service is chosen.
  const { sessionId, resetSession } = useBookingSession(selectedService?.id ?? '');

  const { user } = useAuth();
  const [hasAutoFilled, setHasAutoFilled] = useState(false);

  useEffect(() => {
    if (user && !hasAutoFilled) {
      setDynamicFormData((prev) => ({
        ...prev,
        fullName: prev.fullName || user.name || '',
        email: prev.email || user.email || '',
        phone: prev.phone || user.phone || '',
      }));
      setHasAutoFilled(true);
    }
  }, [user, hasAutoFilled]);

  // Pre-select from URL params
  useEffect(() => {
    if (serviceParam) {
      const service = getServiceById(serviceParam);
      if (service) {
        setSelectedService(service);
        if (planParam) {
          const plan = service.plans.find((p) => p.slug === planParam);
          if (plan) {
            setSelectedPlan(plan);
            setStep('form');
            return;
          }
        }
        // If single plan, auto-select
        if (service.plans.length === 1) {
          setSelectedPlan(service.plans[0]);
          setStep('form');
        } else {
          setStep('plan');
        }
      }
    }
  }, [serviceParam, planParam]);

  const updateFormField = useCallback((key: string, value: string) => {
    let finalValue = value;
    // Person names: keep only what the API accepts (letters, spaces, . ' -).
    // Business names may legitimately contain digits, so they're left alone.
    if (PERSON_NAME_FIELDS.has(key)) {
      finalValue = value.replace(/[^\p{L}\s.'\u2019-]/gu, '');
    }
    setDynamicFormData((prev) => ({ ...prev, [key]: finalValue }));
  }, []);

  // ── Service Selection ──────────────────────────────────────────────────────
  const handleServiceSelect = (service: ServiceDefinition) => {
    setSelectedService(service);
    setSelectedPlan(null);
    setDynamicFormData({});
    if (service.plans.length === 1) {
      setSelectedPlan(service.plans[0]);
      setStep('form');
    } else {
      setStep('plan');
    }
  };

  // ── Plan Selection ─────────────────────────────────────────────────────────
  const handlePlanSelect = (plan: ServicePlan) => {
    setSelectedPlan(plan);
    setStep('form');
  };

  // ── Payment ────────────────────────────────────────────────────────────────
  const handlePayment = async () => {
    if (!selectedService || !selectedPlan || pendingConfirmation) return;
    setIsLoading(true);
    setPaymentError(null);

    const loadRazorpay = () => {
      return new Promise((resolve) => {
        if (typeof window !== "undefined" && (window as any).Razorpay) return resolve(true);
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });
    };

    const isLoaded = await loadRazorpay();
    if (!isLoaded) {
      setPaymentError("We couldn't load the secure payment window. Please check your connection and try again.");
      setIsLoading(false);
      return;
    }

    const service = selectedService;
    const plan = selectedPlan;
    const leadSessionId = sessionId || undefined;
    const displayName = bookingDisplayName(service, plan);

    try {
      // Build a composite slug for the API
      let serviceSlug = service.id;
      if (service.plans.length > 1) {
        // Backend maps 'standard' and 'basic' plans to the base service ID
        if (['standard', 'basic'].includes(plan.slug)) {
          serviceSlug = service.id;
        } else {
          serviceSlug = plan.slug;
        }
      }

      // Reports (and other no-slot services) never carry a date or slot.
      const withSlot = service.requiresSlot;

      const data = await apiClient.post<any>('/bookings/initiate', {
        leadSessionId,
        serviceCategory: serviceCategoryFromCatalog(service),
        serviceSlug,
        serviceName: displayName,
        urgencyTier: withSlot ? urgencyTier : 'STANDARD',
        fullName: (dynamicFormData.fullName || '').trim(),
        email: (dynamicFormData.email || '').trim(),
        phone: dynamicFormData.phone || '',
        businessName: dynamicFormData.businessName?.trim() || undefined,
        businessAddress: dynamicFormData.businessAddress?.trim() || undefined,
        spaceType: dynamicFormData.spaceType || undefined,
        dateOfBirth: dynamicFormData.dateOfBirth || undefined,
        timeOfBirth: dynamicFormData.timeOfBirth || undefined,
        placeOfBirth: dynamicFormData.placeOfBirth?.trim() || undefined,
        scheduledDate: withSlot ? scheduledDate || undefined : undefined,
        scheduledSlot: withSlot ? scheduledSlot || undefined : undefined,
        notes: buildNotes(service, dynamicFormData),
      });

      const options = {
        // The key of the Razorpay account that created this order (set in admin Settings).
        key: data.key || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: 'INR',
        name: 'Time Space & Planets',
        description: displayName,
        image: '/images/logo.png',
        order_id: data.razorpayOrderId,
        prefill: {
          name: dynamicFormData.fullName,
          email: dynamicFormData.email,
          contact: dynamicFormData.phone,
        },
        theme: { color: '#1E1A16' },
        handler: async (response: any) => {
          await confirmPayment(
            data.bookingId,
            response.razorpay_order_id,
            response.razorpay_payment_id,
            response.razorpay_signature,
            leadSessionId,
          );
        },
        modal: {
          ondismiss: () => {
            setIsLoading(false);
          },
        },
      };
      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        // Razorpay keeps its window open so the client can retry; just explain.
        setPaymentError(
          response?.error?.description
            ? `Payment failed: ${response.error.description}`
            : 'Payment failed. Please try again or use another method.'
        );
      });
      rzp.open();
    } catch (err: any) {
      setPaymentError(err?.message || "We couldn't start the payment. Please try again.");
      setIsLoading(false);
    }
  };

  const confirmPayment = async (
    bookingId: string,
    orderId: string,
    paymentId: string,
    signature: string,
    leadSessionId?: string,
  ) => {
    try {
      await apiClient.post('/bookings/verify-payment', {
        bookingId,
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: signature,
        leadSessionId,
      });
      setPendingConfirmation(false);
    } catch {
      // The money has been taken; the Razorpay webhook will confirm the booking.
      setPendingConfirmation(true);
    }
    // Either way this checkout is done: the next booking starts a fresh lead.
    resetSession();
    setPaymentError(null);
    setIsLoading(false);
    setConfirmedBookingId(bookingId);
    setStep('success');
  };

  // ── Build legacy config for BookingSuccess compatibility ────────────────────
  const legacyConfig: BookingConfig | null = selectedService && selectedPlan ? {
    category: serviceCategoryFromCatalog(selectedService),
    slug: selectedPlan.slug,
    name: bookingDisplayName(selectedService, selectedPlan),
    basePriceINR: selectedPlan.priceINR,
    requiresSlot: selectedService.requiresSlot,
    requiresBusinessDetails: selectedService.category === 'business' || selectedService.category === 'property',
  } : null;

  const legacyFormData: BookingFormData = {
    config: legacyConfig,
    scheduledDate,
    scheduledSlot,
    urgencyTier: urgencyTier as BookingFormData['urgencyTier'],
    fullName: dynamicFormData.fullName || '',
    email: dynamicFormData.email || '',
    phone: dynamicFormData.phone || '',
    notes: dynamicFormData.notes || '',
    businessName: dynamicFormData.businessName || '',
    businessAddress: dynamicFormData.businessAddress || '',
    spaceType: dynamicFormData.spaceType || '',
  };

  const bgImage = selectedService ? SERVICE_BG_MAP[selectedService.id] || null : null;
  const showBg = bgImage && (step === 'form' || step === 'review');

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <div className="w-full relative overflow-hidden">
        {/* Contextual background image — covers step indicator + form */}
        {showBg && (
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${bgImage})` }}
          >
            <div className="absolute inset-0 bg-white/75 backdrop-blur-[2px]" />
          </div>
        )}

        <div className="relative">
        {step !== 'success' && <StepIndicator currentStep={step} />}

        {step === 'service' && (
          <ServiceSelectStep
            selectedServiceId={selectedService?.id ?? null}
            onSelect={handleServiceSelect}
          />
        )}

        {step === 'plan' && selectedService && (
          <PlanSelectStep
            service={selectedService}
            selectedPlanSlug={selectedPlan?.slug ?? null}
            onSelect={handlePlanSelect}
            onBack={() => setStep('service')}
          />
        )}

        {step === 'form' && selectedService && selectedPlan && (
          <DynamicFormStep
            sessionId={sessionId}
            service={selectedService}
            formData={dynamicFormData}
            updateFormField={updateFormField}
            scheduledDate={scheduledDate}
            scheduledSlot={scheduledSlot}
            urgencyTier={urgencyTier}
            setScheduledDate={setScheduledDate}
            setScheduledSlot={setScheduledSlot}
            setUrgencyTier={setUrgencyTier}
            onBack={() => {
              if (selectedService.bookingCategory === 'REPORT') {
                router.push('/reports');
              } else if (selectedService.plans.length === 1) {
                setStep('service');
              } else {
                setStep('plan');
              }
            }}
            onNext={() => {
              setPaymentError(null);
              setStep('review');
            }}
          />
        )}

        {step === 'review' && selectedService && selectedPlan && (
          <ReviewStep
            service={selectedService}
            plan={selectedPlan}
            formData={dynamicFormData}
            scheduledDate={scheduledDate}
            scheduledSlot={scheduledSlot}
            urgencyTier={urgencyTier}
            onBack={() => setStep('form')}
            onConfirm={handlePayment}
            isLoading={isLoading}
            error={paymentError}
          />
        )}

        {step === 'success' && confirmedBookingId && legacyConfig && (
          <BookingSuccess
            bookingId={confirmedBookingId}
            config={legacyConfig}
            form={legacyFormData}
            pendingConfirmation={pendingConfirmation}
          />
        )}
        </div>
      </div>
    </>
  );
}
