"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from "firebase/auth";
import { auth } from "@/lib/firebase";

/** Friendly words for the errors Firebase phone sign-in actually produces. */
const firebaseMessage = (e: unknown, fallback: string) => {
  const code = (e as { code?: string })?.code ?? "";
  if (code.includes("invalid-verification-code")) return "That code isn't right. Please check the SMS and try again.";
  if (code.includes("code-expired")) return "That code has expired. Please ask for a new one.";
  if (code.includes("too-many-requests")) return "Too many attempts from this device. Please wait a little and try again.";
  if (code.includes("invalid-phone-number")) return "Please enter a valid mobile number.";
  if (code.includes("quota-exceeded")) return "We can't send more codes right now. Please try email or Google.";
  return (e as Error)?.message || fallback;
};

/** +91 for 10-digit Indian numbers; numbers with a country code are kept as typed. */
export const toE164 = (raw: string) => {
  const digits = raw.trim();
  if (digits.startsWith("+")) return digits.replace(/\s+/g, "");
  if (/^\d{10}$/.test(digits)) return `+91${digits}`;
  throw new Error("Enter a 10-digit mobile number, or include the country code (e.g. +44…).");
};

/**
 * Sends an SMS code to a phone and confirms it, via Firebase. The result is a
 * Firebase ID token proving the number — used to sign in, or to add the number
 * to an account. Needs an element with id `containerId` for the invisible reCAPTCHA.
 */
export function usePhoneOtp(containerId: string) {
  const verifier = useRef<RecaptchaVerifier | null>(null);
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  useEffect(
    () => () => {
      verifier.current?.clear();
      verifier.current = null;
      document.querySelector(".grecaptcha-badge")?.parentElement?.remove();
    },
    [],
  );

  const send = useCallback(
    async (rawPhone: string) => {
      setBusy(true);
      try {
        const phone = toE164(rawPhone);
        if (!verifier.current) verifier.current = new RecaptchaVerifier(auth, containerId, { size: "invisible" });
        setConfirmation(await signInWithPhoneNumber(auth, phone, verifier.current));
        setSentTo(phone);
        setResendIn(60);
      } catch (e) {
        verifier.current?.clear();
        verifier.current = null;
        throw new Error(firebaseMessage(e, "We couldn't send the code. Please check the number."));
      } finally {
        setBusy(false);
      }
    },
    [containerId],
  );

  /** Confirms the SMS code; returns the Firebase ID token for our API. */
  const confirm = useCallback(
    async (code: string) => {
      if (!confirmation) throw new Error("Please ask for a code first.");
      setBusy(true);
      try {
        const result = await confirmation.confirm(code.trim());
        return await result.user.getIdToken();
      } catch (e) {
        throw new Error(firebaseMessage(e, "That code isn't right."));
      } finally {
        setBusy(false);
      }
    },
    [confirmation],
  );

  const reset = useCallback(() => {
    setConfirmation(null);
    setSentTo(null);
  }, []);

  return { send, confirm, reset, sentTo, codeSent: !!confirmation, resendIn, busy };
}
