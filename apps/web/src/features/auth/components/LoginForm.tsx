"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mail, Lock, Phone, ShieldCheck, Eye, EyeOff, Loader2, Smartphone, CheckCircle2, AlertCircle, } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { auth } from "@/lib/firebase";
import { signInWithPopup, GoogleAuthProvider, signInWithPhoneNumber, RecaptchaVerifier, ConfirmationResult, } from "firebase/auth";
import { apiClient } from "@/lib/http/client";
import { ENDPOINTS } from "@/lib/constants/http/endpoints";
import { useAuth } from "@/providers/AuthProvider";
import type { AuthTokenResponse, User } from "@/types/user";
import { filterPhoneInput, validatePhone } from "@/lib/validations/validators";

interface LoginFormProps {
  /** Called after a successful login with user data. */
  onSuccess?: (user: User) => void;
  /** Called when the user clicks "Sign Up Now" to switch to signup mode. */
  onSwitchToSignup?: () => void;
}

export default function LoginForm({ onSuccess, onSwitchToSignup }: LoginFormProps) {

  const { login } = useAuth();
  const [mode, setMode] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // OTP States
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  // Generic states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  // Clean up recaptcha verifier on unmount
  useEffect(() => {
    return () => {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
      }
      // Also clean up any dynamic iframes/badges that Google ReCAPTCHA might have appended to the body
      const recaptchaBadge = document.querySelector(".grecaptcha-badge");
      if (recaptchaBadge && recaptchaBadge.parentNode) {
        recaptchaBadge.parentNode.removeChild(recaptchaBadge);
      }
    };
  }, []);

  // OTP resend timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendTimer]);

  const handleAuthSuccess = (response: AuthTokenResponse) => {
    login(response.user, Number(response.walletBalance ?? 0), response.accessToken);
    setSuccess("Login successful!");
    setTimeout(() => {
      onSuccess?.(response.user);
    }, 500);
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const response = await apiClient.post<AuthTokenResponse>(ENDPOINTS.AUTH.LOGIN, {
        email,
        password,
      });

      handleAuthSuccess(response);
    } catch (err: unknown) {
      const error = err as Error & { message?: string };
      console.error(error);
      setError(error.message || "Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!phone) {
      setError("Please enter a phone number");
      return;
    }
    const phoneError = validatePhone(phone);
    if (phoneError) {
      setError(phoneError);
      return;
    }

    try {
      setOtpLoading(true);
      setError(null);
      setSuccess(null);

      if (!recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current = new RecaptchaVerifier(auth, "recaptcha-container", {
          size: "invisible",
          callback: () => {
            console.log("reCAPTCHA solved");
          },
        });
      }

      let formattedPhone = phone.trim();
      if (!formattedPhone.startsWith("+")) {
        if (formattedPhone.length === 10) {
          formattedPhone = `+91${formattedPhone}`; // Defaults to India (+91)
        } else {
          throw new Error("Enter phone with country code (e.g. +919999999999)");
        }
      }

      const confirmation = await signInWithPhoneNumber(
        auth,
        formattedPhone,
        recaptchaVerifierRef.current,
      );

      setConfirmationResult(confirmation);
      setOtpSent(true);
      setResendTimer(60);
      setSuccess("Verification code sent to " + formattedPhone);
    } catch (err: unknown) {
      const error = err as Error & { message?: string };
      console.error(error);
      setError(error.message || "Failed to send verification code. Please check your number.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || !confirmationResult) return;

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const result = await confirmationResult.confirm(otp);
      const idToken = await result.user.getIdToken();

      const response = await apiClient.post<AuthTokenResponse>(ENDPOINTS.AUTH.FIREBASE_PHONE, {
        idToken,
      });

      handleAuthSuccess(response);
    } catch (err: unknown) {
      const error = err as Error & { message?: string };
      console.error(error);
      setError(error.message || "Invalid OTP code. Please enter the correct code.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();

      const response = await apiClient.post<AuthTokenResponse>(ENDPOINTS.AUTH.FIREBASE_GOOGLE, {
        idToken,
      });

      handleAuthSuccess(response);
    } catch (err: unknown) {
      const error = err as Error & { message?: string };
      console.error(error);
      setError(error.message || "Google sign-in was cancelled or failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* Tab Switcher */}
      <div className="flex bg-slate-100/80 p-1 rounded-xl border border-slate-200">
        <button
          onClick={() => {
            setMode("email");
            setError(null);
            setSuccess(null);
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${mode === "email"
            ? "bg-white text-slate-900 shadow-sm"
            : "text-slate-600 hover:text-slate-900"
            }`}
        >
          <Mail className="w-4 h-4" />
          Email / Password
        </button>
        <button
          onClick={() => {
            setMode("phone");
            setError(null);
            setSuccess(null);
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${mode === "phone"
            ? "bg-white text-slate-900 shadow-sm"
            : "text-slate-600 hover:text-slate-900"
            }`}
        >
          <Smartphone className="w-4 h-4" />
          Phone OTP
        </button>
      </div>

      {/* Error & Success Messages */}
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

      {/* Forms */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
        {mode === "email" ? (
          <form onSubmit={handleEmailLogin} className="space-y-4">
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

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4.5 h-4.5" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-11 py-3 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-3 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Sign In
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            {!otpSent ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Phone Number
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-4.5 h-4.5" />
                    </span>
                    <input
                      type="tel"
                      placeholder="e.g. 9999999999"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(filterPhoneInput(e.target.value))}
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all text-sm"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={otpLoading || !phone}
                  className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-3 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2"
                >
                  {otpLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Send Verification OTP
                </button>
              </div>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Enter OTP Code
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <ShieldCheck className="w-4.5 h-4.5" />
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="6-digit verification code"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all text-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !otp}
                  className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-3 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Verify & Sign In
                </button>

                <div className="text-center text-xs text-slate-500">
                  {resendTimer > 0 ? (
                    <p>Resend OTP in <span className="font-semibold text-slate-700">{resendTimer}s</span></p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      className="text-slate-900 font-bold hover:underline"
                    >
                      Resend OTP Code
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        )}

        {/* ReCAPTCHA container anchor */}
        <div id="recaptcha-container"></div>

        {/* Divider */}
        <div className="relative my-6 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <span className="relative px-3 bg-white text-xs font-semibold uppercase tracking-wider text-slate-400">
            Or Continue With
          </span>
        </div>

        {/* Social Logins */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="flex items-center justify-center gap-2 py-3 px-8 border border-slate-200 rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-all duration-300 text-sm font-bold text-slate-700 disabled:opacity-50"
          >
            {/* Google Icon SVG */}
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.9h6.6c-.28 1.48-1.11 2.73-2.36 3.58v2.98h3.8c2.23-2.05 3.5-5.07 3.5-8.39z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.8-2.98c-1.05.7-2.4 1.12-4.13 1.12-3.18 0-5.88-2.15-6.84-5.04H1.28v3.08C3.26 21.3 7.37 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.16 14.19c-.25-.76-.39-1.57-.39-2.41s.14-1.65.39-2.41V6.29H1.28C.46 7.92 0 9.75 0 11.78s.46 3.86 1.28 5.49l3.88-3.08z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.26 2.7 1.28 6.29l3.88 3.08c.96-2.89 3.66-5.04 6.84-5.04z"
              />
            </svg>
            Google
          </button>
        </div>

        {/* Switch to Signup */}
        <p className="pt-4 text-sm text-center text-slate-600">
          Don&apos;t have an account?{" "}
          <button
            type="button"
            onClick={onSwitchToSignup}
            className="text-md font-bold text-blue-600 hover:underline"
          >
            Sign Up Now
          </button>
        </p>
      </div>
    </div>
  );
}
