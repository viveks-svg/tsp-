"use client";

import { useAuth } from "@/providers/AuthProvider";
import { User, Mail, Shield, Phone, Sparkles } from "lucide-react";

export default function AstrologerProfilePage() {
  const { user } = useAuth();

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold font-poppins">
          Astrologer Panel
        </p>
        <h1 className="mt-1 font-heading text-3xl font-bold text-dark">
          My Profile
        </h1>
        <p className="mt-1 text-sm text-paragraph">
          View your profile details and credential settings.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Info Card */}
        <div className="bg-white border border-border rounded-card-lg p-6 shadow-card flex flex-col items-center text-center h-fit">
          <div className="w-20 h-20 rounded-full bg-navy text-white text-3xl font-bold flex items-center justify-center mb-4">
            {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
          </div>
          <h2 className="font-heading text-xl font-bold text-dark">{user?.name || "Astrologer"}</h2>
          <p className="text-sm text-muted mt-1">{user?.email}</p>
          <div className="mt-6 inline-flex items-center gap-1 bg-gold/15 border border-gold/30 rounded-full px-4 py-1.5 text-xs font-bold text-gold font-poppins">
            <Sparkles className="w-3.5 h-3.5" />
            Verified Astrologer
          </div>
        </div>

        {/* Settings Form Card */}
        <div className="md:col-span-2 bg-white border border-border rounded-card-lg p-6 shadow-card">
          <h2 className="font-heading text-lg font-bold text-dark mb-6 border-b border-border pb-4">
            Profile Details
          </h2>
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2 font-poppins">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4.5 w-4.5 text-muted" />
                  <input
                    type="text"
                    value={user?.name || ""}
                    disabled
                    className="w-full bg-cream/30 border border-border rounded-button pl-10 pr-4 py-2.5 text-sm text-dark font-medium focus:outline-none cursor-not-allowed"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2 font-poppins">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4.5 w-4.5 text-muted" />
                  <input
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="w-full bg-cream/30 border border-border rounded-button pl-10 pr-4 py-2.5 text-sm text-dark font-medium focus:outline-none cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2 font-poppins">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4.5 w-4.5 text-muted" />
                  <input
                    type="text"
                    value={user?.phone || "+91 98765 43210"}
                    disabled
                    className="w-full bg-cream/30 border border-border rounded-button pl-10 pr-4 py-2.5 text-sm text-dark font-medium focus:outline-none cursor-not-allowed"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2 font-poppins">
                  System Role
                </label>
                <div className="relative">
                  <Shield className="absolute left-3 top-3 h-4.5 w-4.5 text-muted" />
                  <input
                    type="text"
                    value={user?.role || "ASTROLOGER"}
                    disabled
                    className="w-full bg-cream/30 border border-border rounded-button pl-10 pr-4 py-2.5 text-sm text-dark font-medium focus:outline-none cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border mt-6">
              <p className="text-xs text-muted leading-relaxed">
                Contact administration to modify your registered email or phone number.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
