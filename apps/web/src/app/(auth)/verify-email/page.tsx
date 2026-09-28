"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/http/client";
import { ENDPOINTS } from "@/lib/constants/http/endpoints";
import { useAuth } from "@/providers/AuthProvider";

/** Opened from the "Confirm your email" link. */
function VerifyEmail() {
  const token = useSearchParams().get("token") ?? "";
  const { isAuthenticated, revalidate } = useAuth();
  const [state, setState] = useState<{ status: "working" | "done" | "error"; text?: string }>({ status: "working" });
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // the link works once; don't send it twice in dev strict mode
    ran.current = true;
    if (!token) {
      setState({ status: "error", text: "This link is incomplete. Please open it again from the email." });
      return;
    }
    apiClient
      .post<{ email: string }>(ENDPOINTS.AUTH.VERIFY_EMAIL, { token })
      .then((r) => {
        setState({ status: "done", text: r.email });
        void revalidate();
      })
      .catch((e) => setState({ status: "error", text: e instanceof Error ? e.message : "This link didn't work." }));
  }, [token, revalidate]);

  return (
    <div className="space-y-6 text-center">
      <Link href="/" className="inline-flex justify-center">
        <Image src="/logo/Group 2.svg" alt="Time Space & Planets" width={64} height={64} className="h-16 w-16" priority />
      </Link>
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        {state.status === "working" && (
          <div className="flex flex-col items-center gap-3 py-6 text-slate-600">
            <Loader2 className="h-7 w-7 animate-spin text-slate-900" />
            Confirming your email…
          </div>
        )}
        {state.status === "done" && (
          <div className="space-y-3">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
            <h1 className="font-heading text-2xl font-bold text-slate-900">Email confirmed</h1>
            <p className="text-sm text-slate-600">
              <strong className="text-slate-900">{state.text}</strong> is now confirmed on your account.
            </p>
            <Link
              href={isAuthenticated ? "/profile" : "/login"}
              className="mt-2 inline-flex rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              {isAuthenticated ? "Go to my profile" : "Sign in"}
            </Link>
          </div>
        )}
        {state.status === "error" && (
          <div className="space-y-3">
            <AlertCircle className="mx-auto h-10 w-10 text-rose-600" />
            <h1 className="font-heading text-2xl font-bold text-slate-900">We couldn&apos;t confirm it</h1>
            <p className="text-sm text-slate-600">{state.text}</p>
            <Link href="/profile" className="mt-2 inline-flex rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50">
              Send a new link from my profile
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmail />
    </Suspense>
  );
}
