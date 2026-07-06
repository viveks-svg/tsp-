"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { apiClient } from "@/lib/http/client";
import { ENDPOINTS } from "@/lib/constants/http/endpoints";
import type { UserProfile } from "@/types/api";
import { useAuth } from "@/providers/AuthProvider";
import FormField from "@/components/ui/FormField";
import { GENDERS, SUPPORTED_LANGUAGES } from "@/lib/validations/constants";
import { validateDateOfBirth, validateLocation } from "@/lib/validations/validators";

export default function ProfilePageContent() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setProfile(await apiClient.get<UserProfile>(ENDPOINTS.USERS.PROFILE));
      } catch (error) {
        setMessage({
          type: "error",
          text: error instanceof Error ? error.message : "Unable to load profile.",
        });
      } finally {
        setLoading(false);
      }
    };
    void loadProfile();
  }, []);

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!profile) return;

    // Validate inputs before saving
    const newErrors: Record<string, string> = {};
    if (profile.dob) {
      const dobError = validateDateOfBirth(profile.dob);
      if (dobError) newErrors.dob = dobError;
    }
    if (profile.pob) {
      const pobError = validateLocation(profile.pob);
      if (pobError) newErrors.pob = pobError;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

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
      setMessage({ type: "success", text: "Profile saved." });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Unable to save profile.",
      });
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
            <FormField
              label="Date of birth"
              name="dob"
              type="date"
              value={profile.dob?.slice(0, 10) || ""}
              onChange={(val) => setProfile({ ...profile, dob: val || null })}
              error={errors.dob}
              max={new Date().toISOString().split("T")[0]}
            />
            <FormField
              label="Time of birth"
              name="tob"
              type="time"
              value={profile.tob || ""}
              onChange={(val) => setProfile({ ...profile, tob: val || null })}
            />
            <FormField
              label="Place of birth"
              name="pob"
              type="places-autocomplete"
              value={profile.pob || ""}
              onChange={(val) => setProfile({ ...profile, pob: val || null })}
              className="sm:col-span-2"
              error={errors.pob}
            />
            <FormField
              label="Preferred language"
              name="preferredLanguage"
              type="select"
              options={SUPPORTED_LANGUAGES.map((l: any) => l.code)}
              value={profile.preferredLanguage || ""}
              onChange={(val) => setProfile({ ...profile, preferredLanguage: val })}
            />
            <FormField
              label="Gender"
              name="gender"
              type="select"
              options={[...GENDERS]}
              value={profile.gender || ""}
              onChange={(val) => setProfile({ ...profile, gender: val || null })}
            />
            <div className="sm:col-span-2 flex items-center gap-4 mt-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-button bg-navy px-6 py-3 text-sm font-semibold text-white hover:bg-navy-hover disabled:opacity-60 flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? "Saving..." : "Save profile"}
              </button>
              {message && (
                <span
                  className={`text-sm font-medium ${
                    message.type === "success" ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {message.text}
                </span>
              )}
            </div>
          </form>
        ) : (
          <p className="mt-8 text-sm text-rose-600">{message?.text}</p>
        )}
      </div>
    </section>
  );
}
