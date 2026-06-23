"use client";

import { useState } from "react";
import { Clock, Calendar, Check, Save } from "lucide-react";

interface AvailabilityDay {
  day: string;
  enabled: boolean;
  startTime: string;
  endTime: string;
}

const INITIAL_DAYS: AvailabilityDay[] = [
  { day: "Monday", enabled: true, startTime: "09:00", endTime: "18:00" },
  { day: "Tuesday", enabled: true, startTime: "09:00", endTime: "18:00" },
  { day: "Wednesday", enabled: true, startTime: "09:00", endTime: "18:00" },
  { day: "Thursday", enabled: true, startTime: "09:00", endTime: "18:00" },
  { day: "Friday", enabled: true, startTime: "09:00", endTime: "18:00" },
  { day: "Saturday", enabled: false, startTime: "10:00", endTime: "16:00" },
  { day: "Sunday", enabled: false, startTime: "10:00", endTime: "16:00" },
];

export default function AstrologerAvailabilityPage() {
  const [schedule, setSchedule] = useState<AvailabilityDay[]>(INITIAL_DAYS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleToggle = (index: number) => {
    setSchedule((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, enabled: !item.enabled } : item))
    );
  };

  const handleTimeChange = (index: number, field: "startTime" | "endTime", value: string) => {
    setSchedule((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  const handleSave = () => {
    setSaving(true);
    setSaved(false);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 1000);
  };

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold font-poppins">
            Astrologer Panel
          </p>
          <h1 className="mt-1 font-heading text-3xl font-bold text-dark">
            Weekly Availability
          </h1>
          <p className="mt-1 text-sm text-paragraph">
            Configure the days and times you are available to receive calls and chats.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="self-start md:self-auto flex items-center gap-2 bg-navy hover:bg-navy-hover text-white rounded-button px-5 py-2.5 text-sm font-bold font-poppins transition-colors shadow-sm disabled:opacity-60"
        >
          {saving ? "Saving..." : saved ? (
            <>
              <Check className="w-4 h-4" />
              Saved
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Availability
            </>
          )}
        </button>
      </div>

      {/* Schedule Table Card */}
      <div className="bg-white border border-border rounded-card-lg shadow-card overflow-hidden">
        <div className="p-6 border-b border-border flex items-center gap-2">
          <Clock className="w-5 h-5 text-gold" />
          <h2 className="font-heading text-lg font-bold text-dark">Set Active Hours</h2>
        </div>
        <div className="divide-y divide-border">
          {schedule.map((item, index) => (
            <div key={item.day} className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-cream/15 transition-colors">
              <div className="flex items-center gap-4 min-w-[150px]">
                <button
                  onClick={() => handleToggle(index)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    item.enabled ? "bg-navy" : "bg-slate-200"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      item.enabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
                <span className={`text-base font-semibold ${item.enabled ? "text-dark" : "text-muted"}`}>
                  {item.day}
                </span>
              </div>

              {item.enabled ? (
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <input
                      type="time"
                      value={item.startTime}
                      onChange={(e) => handleTimeChange(index, "startTime", e.target.value)}
                      className="bg-white border border-border rounded-button px-3 py-2 text-sm text-dark font-poppins focus:outline-none focus:border-navy"
                    />
                  </div>
                  <span className="text-muted text-sm">—</span>
                  <div className="relative">
                    <input
                      type="time"
                      value={item.endTime}
                      onChange={(e) => handleTimeChange(index, "endTime", e.target.value)}
                      className="bg-white border border-border rounded-button px-3 py-2 text-sm text-dark font-poppins focus:outline-none focus:border-navy"
                    />
                  </div>
                </div>
              ) : (
                <span className="text-sm text-muted italic pl-1">Unavailable</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
