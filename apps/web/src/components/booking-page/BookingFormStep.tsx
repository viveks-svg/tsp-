'use client';

import { useState } from 'react';
import { BookingFormData } from './BookingFlow';
import { ChevronLeft } from 'lucide-react';
import { apiClient } from '@/lib/http/client';
import Script from 'next/script';

interface Props {
  form: BookingFormData;
  updateForm: (patch: Partial<BookingFormData>) => void;
  onBack: () => void;
  onSuccess: (bookingId: string) => void;
}

export default function BookingFormStep({ form, updateForm, onBack, onSuccess }: Props) {
  const [isLoading, setIsLoading] = useState(false);

  const isVastu = form.config?.requiresBusinessDetails;
  
  // Calculate pricing
  const SURCHARGE: Record<string, number> = {
    STANDARD: 0,
    NEXT_DAY: 0.25,
    SAME_DAY: 0.50,
  };
  const basePrice = form.config?.basePriceINR ?? 0;
  const surchargeFactor = SURCHARGE[form.urgencyTier] ?? 0;
  const surchargeAmount = Math.round(basePrice * surchargeFactor);
  const total = basePrice + surchargeAmount;

  const isValid = form.fullName.trim() && form.email.trim() && form.phone.trim() 
    && (!isVastu || (form.businessName.trim() && form.spaceType.trim()));

  const handleBookNow = async () => {
    if (!form.config) return;
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
      const data = await apiClient.post<any>('/bookings/initiate', {
        serviceCategory: form.config.category,
        serviceSlug: form.config.slug,
        serviceName: form.config.name,
        urgencyTier: form.urgencyTier,
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        businessName: form.businessName || undefined,
        businessAddress: form.businessAddress || undefined,
        spaceType: form.spaceType || undefined,
        scheduledDate: form.scheduledDate || undefined,
        scheduledSlot: form.scheduledSlot || undefined,
        notes: form.notes || undefined,
      });

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: 'INR',
        name: 'Time Space & Planets',
        description: form.config.name,
        image: '/images/logo.png',
        order_id: data.razorpayOrderId,
        prefill: {
          name: form.fullName,
          email: form.email,
          contact: form.phone,
        },
        theme: { color: '#071B8D' },
        handler: async (response: any) => {
          await confirmPayment(data.bookingId, response.razorpay_order_id, response.razorpay_payment_id, response.razorpay_signature);
        },
        modal: {
          ondismiss: () => setIsLoading(false),
        },
      };
      const rzp = new (window as any).Razorpay(options);
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
      onSuccess(bookingId);
    } catch (err: any) {
      alert('Payment verification failed.');
      setIsLoading(false);
    }
  };

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      
      <div className="p-8 border-b border-[#EFEBE1]">
        <button onClick={onBack} className="flex items-center text-sm font-medium text-[#F6A000] hover:text-[#071B8D] transition">
          <ChevronLeft size={16} className="mr-1" /> Back
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 h-full">
        {/* Left Column: Form */}
        <div className="lg:col-span-3 p-8 border-b lg:border-b-0 lg:border-r border-[#EFEBE1]">
          <h2 className="text-2xl font-bold text-[#071B8D] font-playfair mb-6">Booking Form</h2>
          <h3 className="text-lg font-medium text-[#071B8D] font-inter mb-4">Client Details</h3>
          
          <div className="space-y-5 font-inter">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Full name *</label>
                <input 
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:border-[#071B8D] focus:outline-none"
                  value={form.fullName}
                  onChange={e => updateForm({ fullName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Phone *</label>
                <input 
                  type="tel"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:border-[#071B8D] focus:outline-none"
                  value={form.phone}
                  onChange={e => updateForm({ phone: e.target.value })}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm text-gray-700 mb-1">Email *</label>
              <input 
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:border-[#071B8D] focus:outline-none"
                value={form.email}
                onChange={e => updateForm({ email: e.target.value })}
              />
            </div>

            {isVastu && (
              <>
                <h3 className="text-lg font-medium text-[#071B8D] font-inter mb-2 mt-8">Business Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Business Name *</label>
                    <input 
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:border-[#071B8D] focus:outline-none"
                      value={form.businessName}
                      onChange={e => updateForm({ businessName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Space Type *</label>
                    <input 
                      type="text"
                      placeholder="e.g. Office, Factory"
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:border-[#071B8D] focus:outline-none"
                      value={form.spaceType}
                      onChange={e => updateForm({ spaceType: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Business Address</label>
                  <input 
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:border-[#071B8D] focus:outline-none"
                    value={form.businessAddress}
                    onChange={e => updateForm({ businessAddress: e.target.value })}
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm text-gray-700 mb-1">Add your message</label>
              <textarea 
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:border-[#071B8D] focus:outline-none resize-none"
                value={form.notes}
                onChange={e => updateForm({ notes: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Summary */}
        <div className="lg:col-span-2 p-8 bg-[#FAFAFA]">
          <h3 className="text-xl font-bold text-[#071B8D] font-playfair mb-6">Booking Details</h3>
          
          <div className="space-y-1 mb-8 border-b border-gray-200 pb-6">
            <p className="font-medium text-gray-800">{form.config?.name}</p>
            {form.config?.requiresSlot && (
              <p className="text-gray-600 text-sm mt-1">
                {new Date(form.scheduledDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })} at {form.scheduledSlot}
              </p>
            )}
            <p className="text-sm mt-2 text-[#071B8D] font-semibold bg-[#071B8D]/5 inline-block px-2 py-1 rounded">
              Online Consultation
            </p>
          </div>

          <div className="space-y-4 mb-8">
            <h4 className="text-[#F6A000] font-medium">Payment Details</h4>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Base Fee</span>
              <span>₹{basePrice.toLocaleString('en-IN')}</span>
            </div>
            {surchargeAmount > 0 && (
              <div className="flex justify-between text-sm text-[#071B8D]">
                <span>Priority Surcharge</span>
                <span>+ ₹{surchargeAmount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-200">
              <span>Total</span>
              <span>₹{total.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <button 
            disabled={!isValid || isLoading}
            onClick={handleBookNow}
            className="w-full bg-[#071B8D] text-white py-3 rounded font-medium hover:bg-[#071B8D]/90 transition disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : 'Book Now'}
          </button>
          <p className="text-xs text-gray-400 mt-4 text-center">
            By completing your booking, you agree to receive related notifications.
          </p>
        </div>
      </div>
    </>
  );
}
