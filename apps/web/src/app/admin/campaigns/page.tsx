"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Loader2, Megaphone, ToggleLeft, ToggleRight } from "lucide-react";
import { apiClient } from "@/lib/http/client";
import { ENDPOINTS } from "@/lib/constants/http/endpoints";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface Campaign {
  id: string;
  title: string;
  bannerText: string;
  ratePerMinute: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
  createdAt: string;
}

interface CampaignForm {
  title: string;
  bannerText: string;
  ratePerMinute: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

const DEFAULT_FORM: CampaignForm = {
  title: "Skip the Queue with Dr. Pradeep",
  bannerText: "Get instant consultation with Dr. Pradeep Sharma at just ₹19/min! Live every ${DAY_NAME[dayOfWeek]}.",
  ratePerMinute: "19.00",
  dayOfWeek: 3,
  startTime: "10:00",
  endTime: "15:00",
  isActive: true,
};

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CampaignForm>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaigns = async () => {
    try {
      const data = await apiClient.get<Campaign[]>(ENDPOINTS.ADMIN.CAMPAIGNS);
      setCampaigns(data);
    } catch (err: any) {
      console.error("Failed to load campaigns:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchCampaigns();
  }, []);

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);

    try {
      if (editingId) {
        await apiClient.patch(ENDPOINTS.ADMIN.CAMPAIGN(editingId), form);
      } else {
        await apiClient.post(ENDPOINTS.ADMIN.CAMPAIGNS, form);
      }

      setShowForm(false);
      setEditingId(null);
      setForm(DEFAULT_FORM);
      await fetchCampaigns();
    } catch (err: any) {
      setError(err.message || "Failed to save campaign");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (campaign: Campaign) => {
    setEditingId(campaign.id);
    setForm({
      title: campaign.title,
      bannerText: campaign.bannerText,
      ratePerMinute: campaign.ratePerMinute,
      dayOfWeek: campaign.dayOfWeek,
      startTime: campaign.startTime,
      endTime: campaign.endTime,
      isActive: campaign.isActive,
    });
    setShowForm(true);
  };

  const handleToggleActive = async (campaign: Campaign) => {
    try {
      await apiClient.patch(ENDPOINTS.ADMIN.CAMPAIGN(campaign.id), {
        isActive: !campaign.isActive,
      });
      await fetchCampaigns();
    } catch (err: any) {
      console.error("Failed to toggle campaign:", err);
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
            Campaigns
          </h1>
          <p className="mt-1 text-sm text-[#4B5563]">
            Manage promotional campaigns and queue-based consultation offers.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setForm(DEFAULT_FORM);
            setShowForm(true);
          }}
          className="flex items-center gap-2 bg-[#071B8D] hover:bg-[#05156e] text-white rounded-lg px-5 py-2.5 text-sm font-bold font-poppins transition-colors shadow-sm self-start"
        >
          <Plus className="w-4 h-4" />
          New Campaign
        </button>
      </div>

      {/* Campaign Form Modal */}
      {showForm && (
        <div className="mb-8 bg-white border border-[#EFEBE1] rounded-xl shadow-sm p-6">
          <h2 className="font-heading text-lg font-bold text-[#1E1A16] mb-4">
            {editingId ? "Edit Campaign" : "Create Campaign"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#4B5563] mb-1">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full border border-[#EFEBE1] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#071B8D]"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#4B5563] mb-1">Banner Text</label>
              <textarea
                value={form.bannerText}
                onChange={(e) => setForm({ ...form, bannerText: e.target.value })}
                rows={2}
                className="w-full border border-[#EFEBE1] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#071B8D] resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#4B5563] mb-1">Rate per Minute (₹)</label>
              <input
                type="text"
                value={form.ratePerMinute}
                onChange={(e) => setForm({ ...form, ratePerMinute: e.target.value })}
                className="w-full border border-[#EFEBE1] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#071B8D]"
                placeholder="19.00"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#4B5563] mb-1">Day of Week</label>
              <select
                value={form.dayOfWeek}
                onChange={(e) => setForm({ ...form, dayOfWeek: parseInt(e.target.value) })}
                className="w-full border border-[#EFEBE1] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#071B8D] bg-white"
              >
                {DAY_NAMES.map((name, i) => (
                  <option key={i} value={i}>{name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#4B5563] mb-1">Start Time</label>
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                className="w-full border border-[#EFEBE1] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#071B8D]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#4B5563] mb-1">End Time</label>
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                className="w-full border border-[#EFEBE1] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#071B8D]"
              />
            </div>
          </div>
          {error && <p className="mt-3 text-xs text-rose-500 font-medium">{error}</p>}
          <div className="flex items-center gap-3 mt-5">
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="bg-[#071B8D] hover:bg-[#05156e] text-white rounded-lg px-5 py-2 text-sm font-bold font-poppins transition-colors disabled:opacity-60"
            >
              {saving ? "Saving..." : editingId ? "Update Campaign" : "Create Campaign"}
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
                setError(null);
              }}
              className="text-sm text-[#4B5563] hover:text-[#1E1A16] font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Campaign List */}
      {campaigns.length === 0 ? (
        <div className="text-center py-16 bg-white border border-[#EFEBE1] rounded-xl">
          <Megaphone className="w-12 h-12 text-[#EFEBE1] mx-auto mb-3" />
          <p className="text-[#4B5563] text-sm">No campaigns yet. Create your first one!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {campaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="bg-white border border-[#EFEBE1] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-heading font-bold text-[#1E1A16] text-base truncate">
                    {campaign.title}
                  </h3>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${campaign.isActive
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-gray-50 text-gray-400 border border-gray-200"
                      }`}
                  >
                    {campaign.isActive ? "ACTIVE" : "INACTIVE"}
                  </span>
                </div>
                <p className="text-xs text-[#4B5563] line-clamp-1 mb-1">{campaign.bannerText}</p>
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#9CA3AF] font-medium">
                  <span>₹{campaign.ratePerMinute}/min</span>
                  <span>•</span>
                  <span>{DAY_NAMES[campaign.dayOfWeek]}</span>
                  <span>•</span>
                  <span>{campaign.startTime} — {campaign.endTime}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleToggleActive(campaign)}
                  className="p-2 rounded-lg hover:bg-[#FDFBF7] transition-colors"
                  title={campaign.isActive ? "Deactivate" : "Activate"}
                >
                  {campaign.isActive ? (
                    <ToggleRight className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <ToggleLeft className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                <button
                  onClick={() => handleEdit(campaign)}
                  className="p-2 rounded-lg hover:bg-[#FDFBF7] transition-colors"
                  title="Edit"
                >
                  <Pencil className="w-4 h-4 text-[#4B5563]" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
