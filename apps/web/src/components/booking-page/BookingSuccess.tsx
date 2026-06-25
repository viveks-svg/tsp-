'use client';

import { CheckCircle } from 'lucide-react';
import { BookingFormData, BookingConfig } from './BookingFlow';

interface Props {
  bookingId: string;
  config: BookingConfig;
  form: BookingFormData;
}

export default function BookingSuccess({ bookingId, config, form }: Props) {
  return (
    <div className="p-12 text-center flex flex-col items-center justify-center min-h-[500px]">
      <CheckCircle className="text-green-500 w-20 h-20 mb-6" />
      <h2 className="text-3xl font-bold text-[#071B8D] font-playfair mb-4">
        Booking Confirmed!
      </h2>
      <p className="text-gray-600 mb-8 max-w-md mx-auto font-inter">
        Thank you, {form.fullName.split(' ')[0]}! Your {config.name} has been successfully scheduled.
      </p>

      <div className="bg-[#FAFAFA] p-6 rounded-lg text-left max-w-md w-full mb-8 border border-gray-100">
        <p className="text-sm text-gray-500 mb-1">Booking ID</p>
        <p className="font-mono text-gray-800 font-medium mb-4">{bookingId}</p>

        {config.requiresSlot && (
          <>
            <p className="text-sm text-gray-500 mb-1">Date & Time</p>
            <p className="font-medium text-gray-800">
              {new Date(form.scheduledDate).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} at {form.scheduledSlot}
            </p>
          </>
        )}
      </div>

      <p className="text-sm text-gray-500 font-inter">
        A confirmation email has been sent to {form.email}.
      </p>
    </div>
  );
}
