"use client";

import { useState } from "react";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "@/lib/http/client";
import { ENDPOINTS } from "@/lib/constants/http/endpoints";
import { useAuth } from "@/providers/AuthProvider";
import type { AuthTokenResponse, User } from "@/types/user";
import PasswordStrengthIndicator from "@/components/ui/PasswordStrengthIndicator";
import { 
  filterNameInput, 
  filterPhoneInput, 
  validateName, 
  validateEmail, 
  validatePassword, 
  validatePhone 
} from "@/lib/validations/validators";

interface SignupFormProps {
  onSuccess?: (user: User) => void;
  onSwitchToLogin?: () => void;
}

export default function SignupForm({ onSuccess, onSwitchToLogin }: SignupFormProps) {
  const { login } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Client-side validations
    const nameError = validateName(name);
    if (nameError) return setError(nameError);

    const emailError = validateEmail(email);
    if (emailError) return setError(emailError);

    const passwordError = validatePassword(password);
    if (passwordError) return setError(passwordError);

    if (phone) {
      const phoneError = validatePhone(phone);
      if (phoneError) return setError(phoneError);
    }

    try {
      setLoading(true);
      const response = await apiClient.post<AuthTokenResponse>(ENDPOINTS.AUTH.SIGNUP, {
        name: name.trim(),
        email: email.trim(),
        password,
        ...(phone && { phone: phone.trim() }),
      });

      login(response.user, Number(response.walletBalance ?? 0), response.accessToken);
      setSuccess("Account created successfully!");
      setTimeout(() => {
        onSuccess?.(response.user);
      }, 500);
    } catch (err: unknown) {
      const error = err as Error & { message?: string };
      console.error(error);
      setError(error.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
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
            className="flex items-start gap-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-sm"
          >
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
            <span>{success}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label htmlFor="signup-name" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              id="signup-name"
              required
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(filterNameInput(e.target.value))}
            />
          </div>

          <div>
            <label htmlFor="signup-email" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              id="signup-email"
              required
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value.trim())}
            />
          </div>

          <div>
            <label htmlFor="signup-phone" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Phone <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              type="tel"
              id="signup-phone"
              maxLength={10}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
              placeholder="e.g. 9999999999"
              value={phone}
              onChange={(e) => setPhone(filterPhoneInput(e.target.value))}
            />
          </div>

          <div>
            <label htmlFor="signup-password" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Password
            </label>
            <input
              type="password"
              id="signup-password"
              required
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
              placeholder="Enter a strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {password.length > 0 && <PasswordStrengthIndicator password={password} />}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-3 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 mt-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Create Account
          </button>
        </form>

        <p className="pt-4 text-sm text-center text-slate-600">
          Already have an account?{" "}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-md font-bold text-blue-600 hover:underline"
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
}
