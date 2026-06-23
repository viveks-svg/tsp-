"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { apiClient } from "@/lib/http/client";
import { ENDPOINTS } from "@/lib/constants/http/endpoints";
import type { UserProfile } from "@/types/api";
import { useAuth } from "@/providers/AuthProvider";

export default function ProfilePageContent() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setProfile(
          await apiClient.get<UserProfile>(ENDPOINTS.USERS.PROFILE)
        );
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : "Unable to load profile."
        );
      } finally {
        setLoading(false);
      }
    };
    void loadProfile();
  }, []);

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!profile) return;

    try {
      setSaving(true);
      setMessage(null);
      setProfile(
        await apiClient.patch<UserProfile>(ENDPOINTS.USERS.UPDATE_PROFILE, {
          timezone: profile.timezone,
          preferredLanguage: profile.preferredLanguage,
          dob: profile.dob || undefined,
          tob: profile.tob || undefined,
          pob: profile.pob || undefined,
          gender: profile.gender || undefined,
        })
      );
      setMessage("Profile saved.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to save profile."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="py-12 md:py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">
          Account
        </p>
        <h1 className="mt-2 font-heading text-3xl font-bold text-dark">
          Profile
        </h1>
        <p className="mt-2 text-sm text-paragraph">
          {user?.name || "Your account"} · {user?.email || user?.phone}
        </p>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-navy" />
          </div>
        ) : profile ? (
          <form
            onSubmit={saveProfile}
            className="mt-8 grid gap-5 rounded-card-lg border border-border bg-white p-6 shadow-card sm:grid-cols-2"
          >
            <label className="text-sm font-medium text-dark">
              Date of birth
              <input
                type="date"
                value={profile.dob?.slice(0, 10) || ""}
                onChange={(event) =>
                  setProfile({ ...profile, dob: event.target.value || null })
                }
                className="mt-2 w-full rounded-input border border-border px-4 py-3"
              />
            </label>
            <label className="text-sm font-medium text-dark">
              Time of birth
              <input
                type="time"
                value={profile.tob || ""}
                onChange={(event) =>
                  setProfile({ ...profile, tob: event.target.value || null })
                }
                className="mt-2 w-full rounded-input border border-border px-4 py-3"
              />
            </label>
            <label className="text-sm font-medium text-dark sm:col-span-2">
              Place of birth
              <input
                value={profile.pob || ""}
                onChange={(event) =>
                  setProfile({ ...profile, pob: event.target.value || null })
                }
                className="mt-2 w-full rounded-input border border-border px-4 py-3"
              />
            </label>
            <label className="text-sm font-medium text-dark">
              Preferred language
              <input
                value={profile.preferredLanguage}
                onChange={(event) =>
                  setProfile({
                    ...profile,
                    preferredLanguage: event.target.value,
                  })
                }
                className="mt-2 w-full rounded-input border border-border px-4 py-3"
              />
            </label>
            <label className="text-sm font-medium text-dark">
              Gender
              <input
                value={profile.gender || ""}
                onChange={(event) =>
                  setProfile({ ...profile, gender: event.target.value || null })
                }
                className="mt-2 w-full rounded-input border border-border px-4 py-3"
              />
            </label>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-button bg-navy px-6 py-3 text-sm font-semibold text-white hover:bg-navy-hover disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save profile"}
              </button>
              {message && (
                <span className="ml-4 text-sm text-paragraph">{message}</span>
              )}
            </div>
          </form>
        ) : (
          <p className="mt-8 text-sm text-rose-600">{message}</p>
        )}
      </div>
    </section>
  );
}
