'use client';

import { useState, useEffect } from 'react';
import { BookingFormData } from './BookingFlow';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { apiClient } from '@/lib/http/client';

interface Props {
  form: BookingFormData;
  updateForm: (patch: Partial<BookingFormData>) => void;
  onNext: () => void;
}

export default function BookingCalendarStep({ form, updateForm, onNext }: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Generate calendar days
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  
  const today = new Date();
  today.setHours(0,0,0,0);

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const handleDateSelect = (day: number) => {
    const selected = new Date(year, month, day);
    if (selected < today) return; // Prevent past dates

    // Adjust for timezone offset to get YYYY-MM-DD local
    const offset = selected.getTimezoneOffset();
    const localDate = new Date(selected.getTime() - (offset*60*1000));
    const dateStr = localDate.toISOString().split('T')[0];

    updateForm({ scheduledDate: dateStr, scheduledSlot: '' });
  };

  useEffect(() => {
    if (!form.scheduledDate) {
      setSlots([]);
      return;
    }
    setLoadingSlots(true);
    apiClient.get<any>(`/slots?date=${form.scheduledDate}`)
      .then(data => {
        setSlots(data.slots ?? []);
        // Determine urgency
        const selected = new Date(form.scheduledDate);
        const diffTime = selected.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        let tier: 'STANDARD' | 'NEXT_DAY' | 'SAME_DAY' = 'STANDARD';
        if (diffDays === 0) tier = 'SAME_DAY';
        else if (diffDays === 1) tier = 'NEXT_DAY';
        
        updateForm({ urgencyTier: tier });
      })
      .catch(err => console.error(err))
      .finally(() => setLoadingSlots(false));
  }, [form.scheduledDate]);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2">
      {/* Left Column: Calendar */}
      <div className="p-8 border-b md:border-b-0 md:border-r border-[#EFEBE1]">
        <h2 className="text-xl font-bold text-[#071B8D] font-playfair mb-6">Select a Date and Time</h2>
        
        <div className="max-w-sm">
          <div className="flex items-center justify-between mb-6">
            <button onClick={prevMonth} className="p-1 text-gray-400 hover:text-[#071B8D] transition">
              <ChevronLeft size={20} />
            </button>
            <span className="font-inter font-medium text-gray-800">
              {monthNames[month]} {year}
            </span>
            <button onClick={nextMonth} className="p-1 text-gray-400 hover:text-[#071B8D] transition">
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-500 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d}>{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateObj = new Date(year, month, day);
              const isPast = dateObj < today;
              
              // format for comparison
              const offset = dateObj.getTimezoneOffset();
              const localDate = new Date(dateObj.getTime() - (offset*60*1000));
              const dateStr = localDate.toISOString().split('T')[0];
              const isSelected = form.scheduledDate === dateStr;

              return (
                <button
                  key={day}
                  onClick={() => handleDateSelect(day)}
                  disabled={isPast}
                  className={`
                    w-10 h-10 mx-auto rounded-full flex items-center justify-center text-sm transition-all
                    ${isPast ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-[#071B8D]/10 text-gray-700 cursor-pointer'}
                    ${isSelected ? 'bg-[#071B8D] text-white font-bold hover:bg-[#071B8D]' : ''}
                  `}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-6">India Standard Time (IST)</p>
      </div>

      {/* Right Column: Slots */}
      <div className="p-8 bg-[#FAFAFA]">
        {form.scheduledDate ? (
          <>
            <h3 className="font-inter font-medium text-gray-700 mb-6">
              Availability for {new Date(form.scheduledDate).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h3>

            {loadingSlots ? (
              <p className="text-gray-500">Loading slots...</p>
            ) : slots.length === 0 ? (
              <p className="text-gray-500">No slots available on this date.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 max-w-sm">
                {slots.map(slot => (
                  <button
                    key={slot}
                    onClick={() => updateForm({ scheduledSlot: slot })}
                    className={`py-3 px-4 border rounded-md text-sm font-medium transition-colors ${
                      form.scheduledSlot === slot 
                        ? 'border-[#071B8D] bg-[#071B8D] text-white' 
                        : 'border-[#071B8D] text-[#071B8D] bg-white hover:bg-[#071B8D]/5'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            )}

            {form.scheduledSlot && (
              <div className="mt-12 flex justify-end">
                <button
                  onClick={onNext}
                  className="bg-[#071B8D] text-white px-10 py-3 rounded text-sm font-medium hover:bg-[#071B8D]/90 transition"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400 font-inter">
            Select a date to view availability
          </div>
        )}
      </div>
    </div>
  );
}
