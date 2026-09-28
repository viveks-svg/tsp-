'use client';

import Link from 'next/link';
import { CheckCircle, Clock } from 'lucide-react';
import { BookingFormData, BookingConfig } from './BookingFlow';
import { formatCalendarDate, formatSlot } from './booking-format';

interface Props {
  bookingId: string;
  config: BookingConfig;
  form: BookingFormData;
  /**
   * The charge went through but our verify call failed. The Razorpay webhook
   * will still confirm the booking, so reassure the client instead of erroring.
   */
  pendingConfirmation?: boolean;
}

export default function BookingSuccess({ bookingId, config, form, pendingConfirmation = false }: Props) {
  const firstName = form.fullName.trim().split(/\s+/)[0] || 'there';
  const isReport = config.category === 'REPORT';

  return (
    <div className="p-12 text-center flex flex-col items-center justify-center min-h-[500px]">
      {pendingConfirmation ? (
        <Clock className="text-[#C8A04A] w-20 h-20 mb-6" />
      ) : (
        <CheckCircle className="text-green-500 w-20 h-20 mb-6" />
      )}
      <h2 className="text-3xl font-bold text-[#071B8D] font-playfair mb-4">
        {pendingConfirmation ? 'Payment Received' : isReport ? 'Order Confirmed!' : 'Booking Confirmed!'}
      </h2>
      {pendingConfirmation ? (
        <p className="text-gray-600 mb-8 max-w-md mx-auto font-inter">
          Thank you, {firstName}. Your payment for {config.name} has been received and we&apos;re
          confirming your booking now. You&apos;ll receive the confirmation by email and WhatsApp
          shortly — there&apos;s no need to pay again.
        </p>
      ) : (
        <p className="text-gray-600 mb-8 max-w-md mx-auto font-inter">
          Thank you, {firstName}! Your {config.name}{' '}
          {isReport
            ? 'has been ordered. Dr. Pradeep will prepare your report personally.'
            : 'has been successfully scheduled.'}
        </p>
      )}

      <div className="bg-[#FAFAFA] p-6 rounded-lg text-left max-w-md w-full mb-8 border border-gray-100">
        <p className="text-sm text-gray-500 mb-1">Booking ID</p>
        <p className="font-mono text-gray-800 font-medium mb-4 break-all">{bookingId}</p>

        {config.requiresSlot && form.scheduledDate && (
          <>
            <p className="text-sm text-gray-500 mb-1">Date & Time</p>
            <p className="font-medium text-gray-800">
              {formatCalendarDate(form.scheduledDate, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              {form.scheduledSlot ? ` at ${formatSlot(form.scheduledSlot)}` : ''}
            </p>
          </>
        )}
        {isReport && (
          <>
            <p className="text-sm text-gray-500 mb-1">Delivery</p>
            <p className="font-medium text-gray-800">Signed PDF by email within 7 working days</p>
          </>
        )}
      </div>

      {pendingConfirmation ? (
        <p className="text-sm text-gray-500 font-inter max-w-md">
          If it doesn&apos;t appear in{' '}
          <Link href="/orders" className="text-[#8B6914] underline underline-offset-2">My orders</Link>{' '}
          within a few minutes, please{' '}
          <Link href="/contact" className="text-[#8B6914] underline underline-offset-2">contact us</Link>{' '}
          with your booking ID and we&apos;ll sort it out.
        </p>
      ) : (
        <p className="text-sm text-gray-500 font-inter">
          A confirmation email has been sent to {form.email}.
        </p>
      )}
    </div>
  );
}
