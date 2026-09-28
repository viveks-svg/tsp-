"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Mail, Loader2, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "@/lib/http/client";
import { ENDPOINTS } from "@/lib/constants/http/endpoints";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      setLoading(true);
      setError(null);
      
      await apiClient.post(ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
      setSuccess(true);
    } catch (err: unknown) {
      const error = err as Error & { message?: string };
      console.error(error);
      setError(error.message || "Failed to send reset link. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Logo and Header */}
      <div className="text-center">
        <Link href="/" className="inline-flex justify-center mb-4">
          <Image
            src="/logo/Group 2.svg"
            alt="TSP Logo"
            width={70}
            height={70}
            className="w-16 h-16 hover:scale-105 transition-transform duration-300"
            priority
          />
        </Link>
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
          Reset Password
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Enter your email and we'll send you a link to reset your password.
        </p>
      </div>

      <div className="w-full max-w-md mx-auto space-y-6">
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-start gap-2.5 bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl text-sm"
            >
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 p-6 rounded-xl text-sm text-center"
            >
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              <div>
                <p className="font-semibold text-lg text-emerald-900">Check your email</p>
                <p className="mt-1">We've sent a password reset link to <span className="font-semibold">{email}</span></p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!success && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4.5 h-4.5" />
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-3 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 mt-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Send Reset Link
              </button>
            </form>
          </div>
        )}

        <div className="text-center pt-2">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
