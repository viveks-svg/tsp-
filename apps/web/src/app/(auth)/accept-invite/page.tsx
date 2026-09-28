"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { apiClient } from "@/lib/http/client";

/**
 * A teammate opens their invitation link, chooses a name and password, and is
 * sent to sign in. The token is checked by the server on both steps.
 */
export default function AcceptInvitePage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [invite, setInvite] = useState<{ email: string; name: string | null; roleLabel: string } | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("token") ?? "";
    setToken(t);
    apiClient
      .get<{ email: string; name: string | null; roleLabel: string }>(`/auth/invite?token=${encodeURIComponent(t)}`)
      .then((i) => {
        setInvite(i);
        setName(i.name ?? "");
      })
      .catch((e) => setProblem(e instanceof Error ? e.message : "This invitation link isn't valid."));
  }, []);

  const rules = [
    { ok: password.length >= 8, text: "8 or more characters" },
    { ok: /[a-z]/.test(password) && /[A-Z]/.test(password), text: "Upper and lower case letters" },
    { ok: /[0-9]/.test(password), text: "A number" },
    { ok: /[^A-Za-z0-9]/.test(password), text: "A symbol" },
  ];
  const valid = name.trim().length >= 2 && rules.every((r) => r.ok) && password === confirm;

  const accept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || !token) return;
    setBusy(true);
    try {
      await apiClient.post("/auth/invite/accept", { token, name: name.trim(), password });
      toast.success("Welcome to the team. Please sign in.");
      router.replace("/login");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not accept the invitation");
      setBusy(false);
    }
  };

  const input =
    "w-full rounded-xl border border-hairline bg-ivory px-3.5 py-2.5 text-[14px] text-ink outline-none transition focus:border-champagne focus:ring-2 focus:ring-champagne/20";

  return (
    <div className="overflow-hidden rounded-2xl border border-hairline bg-ivory shadow-[0_30px_80px_-30px_rgba(11,18,51,0.45)]">
      <div className="flex flex-col items-center gap-3 bg-midnight px-8 py-8 text-center">
        <Image src="/logo/tsp-logo-champagne.svg" alt="Time Space & Planets" width={134} height={88} className="h-auto w-[112px]" priority />
        <p className="font-cinzel text-[10px] font-semibold tracking-[0.34em] text-champagne/80 uppercase">The Private Office</p>
      </div>

      <div className="space-y-6 px-8 py-8">
        {problem ? (
          <div className="space-y-4 text-center">
            <h1 className="font-playfair text-2xl font-semibold text-ink">Invitation unavailable</h1>
            <p className="text-[14px] text-ink-2">{problem}</p>
            <Link href="/login" className="inline-block text-[14px] font-medium text-bronze hover:text-ink">
              Go to sign in →
            </Link>
          </div>
        ) : !invite ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-champagne" />
          </div>
        ) : (
          <form onSubmit={accept} className="space-y-5">
            <div className="space-y-1.5 text-center">
              <h1 className="font-playfair text-2xl font-semibold text-ink">Join the team</h1>
              <p className="text-[14px] text-ink-2">
                You’re invited as <strong className="font-semibold text-ink">{invite.roleLabel}</strong>. You’ll sign in with{" "}
                <strong className="font-semibold text-ink">{invite.email}</strong>.
              </p>
            </div>

            <label className="block space-y-1.5">
              <span className="block text-[13px] font-medium text-ink-2">Your name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className={input} />
            </label>

            <label className="block space-y-1.5">
              <span className="block text-[13px] font-medium text-ink-2">Choose a password</span>
              <div className="relative">
                <input
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  className={`${input} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  aria-label={show ? "Hide password" : "Show password"}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-ink-3 hover:text-ink"
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>
            <ul className="grid grid-cols-2 gap-1.5 text-[12px]">
              {rules.map((r) => (
                <li key={r.text} className={r.ok ? "text-emerald-deep" : "text-ink-3"}>
                  {r.ok ? "✓" : "·"} {r.text}
                </li>
              ))}
            </ul>

            <label className="block space-y-1.5">
              <span className="block text-[13px] font-medium text-ink-2">Confirm password</span>
              <input type={show ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" className={input} />
              {confirm && password !== confirm && <span className="block text-[12px] text-garnet">The passwords don’t match.</span>}
            </label>

            <button
              type="submit"
              disabled={!valid || busy}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-midnight px-5 py-3 text-[14px] font-semibold text-champagne-light transition hover:bg-midnight-2 disabled:opacity-40"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} Accept invitation
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
