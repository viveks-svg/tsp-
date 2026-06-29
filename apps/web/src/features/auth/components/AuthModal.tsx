"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import Image from "next/image";
import { useAuthModal } from "@/hooks/useAuthModal";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";

/**
 * AuthModal — renders login/signup forms as a polished overlay
 * on top of the current page. Controlled via the useAuthModal hook.
 */
export default function AuthModal() {
  const { isOpen, mode, close, switchMode } = useAuthModal();

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleEscape);
    }
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, close]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4"
          onClick={close}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full sm:max-w-md max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-cream shadow-2xl z-10 mt-auto sm:mt-0"
          >
            {/* Close button */}
            <button
              onClick={close}
              className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 hover:bg-white text-slate-500 hover:text-slate-800 transition-all shadow-sm"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="pt-8 pb-2 px-6 text-center">
              <div className="inline-flex justify-center mb-3">
                <Image
                  src="/logo/Group 2.svg"
                  alt="TSP Logo"
                  width={56}
                  height={56}
                  className="w-14 h-14"
                  priority
                />
              </div>
              <h2 className="font-heading text-2xl font-bold text-slate-900 tracking-tight">
                {mode === "login" ? "Welcome Back" : "Create Account"}
              </h2>
              <p className="text-slate-500 text-sm mt-1 flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-gold" />
                {mode === "login"
                  ? "Sign in to continue your cosmic journey"
                  : "Join Time Space & Planets today"}
              </p>
            </div>

            {/* Form */}
            <div className="px-6 pb-8">
              {mode === "login" ? (
                <LoginForm
                  onSuccess={close}
                  onSwitchToSignup={switchMode}
                />
              ) : (
                <SignupForm
                  onSuccess={close}
                  onSwitchToLogin={switchMode}
                />
              )}

              {/* Footer */}
              <p className="text-center text-xs text-slate-400 mt-4">
                By continuing, you agree to our{" "}
                <a href="/terms" className="underline hover:text-slate-600">
                  Terms
                </a>{" "}
                and{" "}
                <a href="/privacy-policy" className="underline hover:text-slate-600">
                  Privacy Policy
                </a>
                .
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
