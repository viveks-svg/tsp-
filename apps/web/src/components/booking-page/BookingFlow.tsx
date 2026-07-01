'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Script from 'next/script';
import { apiClient } from '@/lib/http/client';
import {
  getServiceById,
  type ServiceDefinition,
  type ServicePlan,
} from '@/lib/data/service-catalog';

import ServiceSelectStep from './ServiceSelectStep';
import PlanSelectStep from './PlanSelectStep';
import BookingCalendarStep from './BookingCalendarStep';
import ReviewStep from './ReviewStep';
import BookingSuccess from './BookingSuccess';

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
  if (service.category === 'business' || service.category === 'property') return 'BUSINESS_VASTU';
  return 'CONSULTATION';
}

const SURCHARGE: Record<string, number> = {
  STANDARD: 0,
  NEXT_DAY: 0.25,
  SAME_DAY: 0.50,
};

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
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-[#C8A04A] text-white shadow-[0_0_0_3px_rgba(200,160,74,0.2)]'
                    : isCompleted
                      ? 'bg-[#C8A04A] text-white'
                      : 'bg-[#EFEBE1] text-[#9CA3AF]'
                }`}
              >
                {isCompleted ? '✓' : stepIndex + 1}
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

// ── Dynamic Form Step (inline) ───────────────────────────────────────────────

function DynamicFormStep({
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
  // Group fields by section
  const sections: Record<string, typeof service.formFields> = {};
  for (const field of service.formFields) {
    const section = field.section || 'Details';
    if (!sections[section]) sections[section] = [];
    sections[section].push(field);
  }

  // Handle validation and proceed
  const handleNext = () => {
    // Check required fields
    const missingFields = service.formFields.filter(
      (f) => f.required && (!formData[f.name] || formData[f.name].trim() === '')
    );
    if (missingFields.length > 0) {
      alert(`Please fill in required fields: ${missingFields.map((f) => f.label).join(', ')}`);
      return;
    }

    // Check email
    const emailField = service.formFields.find(
      (f) => f.type === 'email' || f.name.toLowerCase().includes('email')
    );
    if (emailField) {
      const email = formData[emailField.name];
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        alert('Please enter a valid email address.');
        return;
      }
    }

    // Check date and time
    if (service.requiresSlot) {
      if (!scheduledDate || !scheduledSlot) {
        alert('Date and Time are required.');
        return;
      }

      const selected = new Date(scheduledDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selected < today) {
        alert('Cannot select a past date for booking.');
        return;
      }

      const minDate = new Date();
      minDate.setDate(minDate.getDate() + 2);
      minDate.setHours(0, 0, 0, 0);

      if (selected < minDate && urgencyTier === 'STANDARD') {
        alert('Standard booking requires at least 2 days advance notice.');
        return;
      }
    }

    onNext();
  };

  return (
    <div className="p-6 sm:p-8">
      <button
        onClick={onBack}
        className="text-sm text-[#8B6914] hover:text-[#C99411] font-medium mb-6 flex items-center gap-1 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Change Plan
      </button>

      <div className="mb-8">
        <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#1E1A16]">
          Tell Us About Your Needs
        </h2>
        <p className="text-[#6B5F52] text-sm mt-2">
          Fill in the details for your <span className="font-semibold text-[#1E1A16]">{service.name}</span> consultation.
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
                const value = formData[field.name] || '';

                if (field.type === 'select' && field.options) {
                  return (
                    <div key={field.name}>
                      <label className="block text-sm text-[#4B5563] mb-1.5 font-medium">
                        {field.label} {field.required && <span className="text-[#C8A04A]">*</span>}
                      </label>
                      <select
                        value={value}
                        onChange={(e) => updateFormField(field.name, e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-[#EFEBE1] rounded-xl text-sm text-[#1E1A16] focus:border-[#C8A04A] focus:ring-1 focus:ring-[#C8A04A]/20 focus:outline-none transition-all"
                      >
                        <option value="">Select…</option>
                        {field.options.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  );
                }

                if (field.type === 'textarea') {
                  return (
                    <div key={field.name} className="sm:col-span-2">
                      <label className="block text-sm text-[#4B5563] mb-1.5 font-medium">
                        {field.label} {field.required && <span className="text-[#C8A04A]">*</span>}
                      </label>
                      <textarea
                        rows={2}
                        placeholder={field.placeholder}
                        value={value}
                        onChange={(e) => updateFormField(field.name, e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-[#EFEBE1] rounded-xl text-sm text-[#1E1A16] focus:border-[#C8A04A] focus:ring-1 focus:ring-[#C8A04A]/20 focus:outline-none transition-all resize-none"
                      />
                    </div>
                  );
                }

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
                  <div key={field.name}>
                    <label className="block text-sm text-[#4B5563] mb-1.5 font-medium">
                      {field.label} {field.required && <span className="text-[#C8A04A]">*</span>}
                    </label>
                    <input
                      type={field.type}
                      placeholder={field.placeholder}
                      value={value}
                      onChange={(e) => {
                        let val = e.target.value;
                        if (field.type === 'tel' || field.name.toLowerCase().includes('phone')) {
                          val = val.replace(/[^\d\s\+\-\(\)]/g, '');
                        }
                        updateFormField(field.name, val);
                      }}
                      className="w-full px-4 py-2.5 bg-white border border-[#EFEBE1] rounded-xl text-sm text-[#1E1A16] focus:border-[#C8A04A] focus:ring-1 focus:ring-[#C8A04A]/20 focus:outline-none transition-all"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Date/Time for slot-based services */}
        {service.requiresSlot && (
          <div>
            <h3 className="text-xs font-bold text-[#8B6914] uppercase tracking-[0.15em] mb-4 font-poppins">
              Preferred Schedule
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#4B5563] mb-1.5 font-medium">
                  Preferred Date <span className="text-[#C8A04A]">*</span>
                </label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0]}
                  className="w-full px-4 py-2.5 bg-white border border-[#EFEBE1] rounded-xl text-sm text-[#1E1A16] focus:border-[#C8A04A] focus:ring-1 focus:ring-[#C8A04A]/20 focus:outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm text-[#4B5563] mb-1.5 font-medium">
                  Preferred Time
                </label>
                <select
                  value={scheduledSlot}
                  onChange={(e) => setScheduledSlot(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#EFEBE1] rounded-xl text-sm text-[#1E1A16] focus:border-[#C8A04A] focus:ring-1 focus:ring-[#C8A04A]/20 focus:outline-none transition-all"
                >
                  <option value="">Select a time slot…</option>
                  <option value="10:00-11:00">10:00 AM – 11:00 AM</option>
                  <option value="11:00-12:00">11:00 AM – 12:00 PM</option>
                  <option value="14:00-15:00">2:00 PM – 3:00 PM</option>
                  <option value="15:00-16:00">3:00 PM – 4:00 PM</option>
                  <option value="16:00-17:00">4:00 PM – 5:00 PM</option>
                  <option value="17:00-18:00">5:00 PM – 6:00 PM</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Next Button */}
      <div className="mt-8 flex justify-end">
        <button
          onClick={handleNext}
          className="px-8 py-3 bg-[#1E1A16] text-white rounded-full text-sm font-semibold hover:bg-[#C8A04A] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Review Booking →
        </button>
      </div>
    </div>
  );
}

// ── Main Booking Flow ────────────────────────────────────────────────────────

export default function BookingFlow() {
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
    setDynamicFormData((prev) => ({ ...prev, [key]: value }));
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
    if (!selectedService || !selectedPlan) return;
    setIsLoading(true);

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
      alert("Razorpay SDK failed to load. Are you offline?");
      setIsLoading(false);
      return;
    }

    try {
      // Build a composite slug for the API
      const serviceSlug = selectedService.plans.length > 1
        ? selectedPlan.slug    // legacy: "rising", "celestial", "zenith" etc.
        : selectedService.id;  // single-plan services use service id

      const data = await apiClient.post<any>('/bookings/initiate', {
        serviceCategory: serviceCategoryFromCatalog(selectedService),
        serviceSlug,
        serviceName: `${selectedService.name} — ${selectedPlan.name}`,
        urgencyTier,
        fullName: dynamicFormData.fullName || '',
        email: dynamicFormData.email || '',
        phone: dynamicFormData.phone || '',
        businessName: dynamicFormData.businessName || undefined,
        businessAddress: dynamicFormData.businessAddress || undefined,
        spaceType: dynamicFormData.spaceType || undefined,
        dateOfBirth: dynamicFormData.dateOfBirth || undefined,
        timeOfBirth: dynamicFormData.timeOfBirth || undefined,
        placeOfBirth: dynamicFormData.placeOfBirth || undefined,
        scheduledDate: scheduledDate || undefined,
        scheduledSlot: scheduledSlot || undefined,
        notes: dynamicFormData.notes || undefined,
      });

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: 'INR',
        name: 'Time Space & Planets',
        description: `${selectedService.name} — ${selectedPlan.name}`,
        image: '/images/logo.png',
        order_id: data.razorpayOrderId,
        prefill: {
          name: dynamicFormData.fullName,
          email: dynamicFormData.email,
          contact: dynamicFormData.phone,
        },
        theme: { color: '#1E1A16' },
        handler: async (response: any) => {
          await confirmPayment(data.bookingId, response.razorpay_order_id, response.razorpay_payment_id, response.razorpay_signature);
        },
        modal: {
          ondismiss: () => {
            setIsLoading(false);
          },
        },
      };
      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        console.error("Payment failed:", response?.error?.description);
      });
      rzp.open();
    } catch (err: any) {
      alert(err.message ?? 'Failed to initiate booking.');
      setIsLoading(false);
    }
  };

  const confirmPayment = async (bookingId: string, orderId: string, paymentId: string, signature: string) => {
    try {
      await apiClient.post('/bookings/verify-payment', {
        bookingId,
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: signature,
      });
      setConfirmedBookingId(bookingId);
      setStep('success');
    } catch {
      alert('Payment verification failed.');
      setIsLoading(false);
    }
  };

  // ── Build legacy config for BookingSuccess compatibility ────────────────────
  const legacyConfig: BookingConfig | null = selectedService && selectedPlan ? {
    category: serviceCategoryFromCatalog(selectedService),
    slug: selectedPlan.slug,
    name: `${selectedService.name} — ${selectedPlan.name}`,
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

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <div className="w-full">
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
              if (selectedService.plans.length === 1) {
                setStep('service');
              } else {
                setStep('plan');
              }
            }}
            onNext={() => setStep('review')}
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
          />
        )}

        {step === 'success' && confirmedBookingId && legacyConfig && (
          <BookingSuccess
            bookingId={confirmedBookingId}
            config={legacyConfig}
            form={legacyFormData}
          />
        )}
      </div>
    </>
  );
}
