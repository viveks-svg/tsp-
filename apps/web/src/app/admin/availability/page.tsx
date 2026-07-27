"use client";

import { useState, useEffect } from "react";
import { Clock, Check, Save, Loader2, Wifi, WifiOff } from "lucide-react";
import { apiClient } from "@/lib/http/client";
import { ENDPOINTS } from "@/lib/constants/http/endpoints";

interface AvailabilityDay {
  dayOfWeek: number;
  day: string;
  enabled: boolean;
  startTime: string;
  endTime: string;
}

const INITIAL_DAYS: AvailabilityDay[] = [
  { dayOfWeek: 1, day: "Monday",    enabled: true,  startTime: "09:00", endTime: "18:00" },
  { dayOfWeek: 2, day: "Tuesday",   enabled: true,  startTime: "09:00", endTime: "18:00" },
  { dayOfWeek: 3, day: "Wednesday", enabled: true,  startTime: "09:00", endTime: "18:00" },
  { dayOfWeek: 4, day: "Thursday",  enabled: true,  startTime: "09:00", endTime: "18:00" },
  { dayOfWeek: 5, day: "Friday",    enabled: true,  startTime: "09:00", endTime: "18:00" },
  { dayOfWeek: 6, day: "Saturday",  enabled: false, startTime: "10:00", endTime: "16:00" },
  { dayOfWeek: 0, day: "Sunday",    enabled: false, startTime: "10:00", endTime: "16:00" },
];

export default function AdminAvailabilityPage() {
  const [schedule, setSchedule] = useState<AvailabilityDay[]>(INITIAL_DAYS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liveStatus, setLiveStatus] = useState<{ isLive: boolean; nextWindow: string | null } | null>(null);

  // Fetch existing rules
  useEffect(() => {
    const fetchRules = async () => {
      try {
        const rules = await apiClient.get<any[]>(ENDPOINTS.ADMIN.AVAILABILITY);
        if (rules && rules.length > 0) {
          const updatedSchedule = [...INITIAL_DAYS].map((day) => {
            const rule = rules.find((r) => r.dayOfWeek === day.dayOfWeek);
            if (rule) {
              return { ...day, enabled: true, startTime: rule.startTime, endTime: rule.endTime };
            }
            return { ...day, enabled: false };
          });
          setSchedule(updatedSchedule);
        }
      } catch (err: any) {
        console.error("Failed to load availability rules:", err);
      } finally {
        setLoading(false);
      }
    };
    void fetchRules();
  }, []);

  // Fetch live status
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const status = await apiClient.get<{ isLive: boolean; nextWindow: string | null }>(
          ENDPOINTS.AVAILABILITY.DR_PRADEEP,
        );
        setLiveStatus(status);
      } catch {
        // Non-critical
      }
    };
    void fetchStatus();
    const interval = setInterval(fetchStatus, 30_000);
    return () => clearInterval(interval);
  }, []);

  const handleToggle = (index: number) => {
    setSchedule((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, enabled: !item.enabled } : item)),
    );
  };

  const handleTimeChange = (index: number, field: "startTime" | "endTime", value: string) => {
    setSchedule((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item)),
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setError(null);

    try {
      const activeRules = schedule
        .filter((day) => day.enabled)
        .map((day) => ({
          dayOfWeek: day.dayOfWeek,
          startTime: day.startTime,
          endTime: day.endTime,
          isActive: true,
        }));

      await apiClient.post(ENDPOINTS.ADMIN.AVAILABILITY, { rules: activeRules });

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to save availability rules");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#071B8D]" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#C8A04A] font-poppins">
            Admin Panel
          </p>
          <h1 className="mt-1 font-heading text-3xl font-bold text-[#1E1A16]">
            Weekly Availability
          </h1>
          <p className="mt-1 text-sm text-[#4B5563]">
            Configure the days and times Dr. Pradeep is available for consultations.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 self-start md:self-auto">
          {/* Live status indicator */}
          {liveStatus && (
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${
                liveStatus.isLive
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-gray-50 text-gray-500 border border-gray-200"
              }`}
            >
              {liveStatus.isLive ? (
                <>
                  <Wifi className="w-3.5 h-3.5" />
                  Currently Live
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5" />
                  Offline
                  {liveStatus.nextWindow && (
                    <span className="text-gray-400">
                      · Next: {new Date(liveStatus.nextWindow).toLocaleDateString("en-IN", { weekday: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  )}
                </>
              )}
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-[#071B8D] hover:bg-[#05156e] text-white rounded-lg px-5 py-2.5 text-sm font-bold font-poppins transition-colors shadow-sm disabled:opacity-60"
          >
            {saving ? (
              "Saving..."
            ) : saved ? (
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
          {error && <span className="text-xs text-rose-500 font-medium">{error}</span>}
        </div>
      </div>

      {/* Schedule Table Card */}
      <div className="bg-white border border-[#EFEBE1] rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#EFEBE1] flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#C8A04A]" />
          <h2 className="font-heading text-lg font-bold text-[#1E1A16]">Set Active Hours (IST)</h2>
        </div>
        <div className="divide-y divide-[#EFEBE1]">
          {schedule.map((item, index) => (
            <div
              key={item.day}
              className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-[#FDFBF7]/50 transition-colors"
            >
              <div className="flex items-center gap-4 min-w-[150px]">
                <button
                  onClick={() => handleToggle(index)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    item.enabled ? "bg-[#071B8D]" : "bg-slate-200"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      item.enabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
                <span className={`text-base font-semibold ${item.enabled ? "text-[#1E1A16]" : "text-[#9CA3AF]"}`}>
                  {item.day}
                </span>
              </div>

              {item.enabled ? (
                <div className="flex items-center gap-3">
                  <input
                    type="time"
                    value={item.startTime}
                    onChange={(e) => handleTimeChange(index, "startTime", e.target.value)}
                    className="bg-white border border-[#EFEBE1] rounded-lg px-3 py-2 text-sm text-[#1E1A16] font-poppins focus:outline-none focus:border-[#071B8D]"
                  />
                  <span className="text-[#9CA3AF] text-sm">—</span>
                  <input
                    type="time"
                    value={item.endTime}
                    onChange={(e) => handleTimeChange(index, "endTime", e.target.value)}
                    className="bg-white border border-[#EFEBE1] rounded-lg px-3 py-2 text-sm text-[#1E1A16] font-poppins focus:outline-none focus:border-[#071B8D]"
                  />
                </div>
              ) : (
                <span className="text-sm text-[#9CA3AF] italic pl-1">Unavailable</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
