import { Suspense } from 'react';
import BookingFlow from '@/components/booking-page/BookingFlow';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Book a Session | Time Space & Planets',
  description: 'Schedule a premium consultation with Dr. Pradeep Sharma. Business Vastu, Strategic Consulting, Career Guidance, and more.',
};

export default function BookPage() {
  return (
    <div className="min-h-screen bg-[#F7F4EE] pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-[#EFEBE1] overflow-hidden min-h-[600px]">
          <Suspense fallback={
            <div className="p-8 text-center text-[#6B5F52]">
              <div className="animate-pulse">Loading booking…</div>
            </div>
          }>
            <BookingFlow />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
