"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Check, Copy, Download, KeyRound, Loader2, ShieldCheck, Smartphone } from "lucide-react";
import { apiClient } from "@/lib/http/client";
import type { AuthTokenResponse, TwoStepChallenge } from "@/types/user";

/**
 * Two-step verification (authenticator app) for staff and astrologer logins:
 * the second step of signing in, first-time set-up, and recovery codes.
 */

const codeInput =
  "w-full rounded-xl border border-hairline bg-white px-4 py-3 text-center font-inter text-[22px] tracking-[0.45em] text-ink outline-none transition focus:border-champagne focus:ring-2 focus:ring-champagne/25";
const primary =
  "flex w-full items-center justify-center gap-2 rounded-xl bg-midnight py-3 text-sm font-semibold text-champagne-light transition hover:bg-midnight-2 disabled:opacity-40";

const message = (e: unknown, fallback: string) => (e instanceof Error && e.message ? e.message : fallback);

/** The second step of signing in: a code from the app, or setting the app up first. */
export function TwoStepSignIn({
  challenge,
  onSignedIn,
  onCancel,
}: {
  challenge: TwoStepChallenge;
  onSignedIn: (response: AuthTokenResponse) => void;
  onCancel: () => void;
}) {
  if (challenge.twoStep === "SETUP") {
    return (
      <div className="space-y-5">
        <Heading
          title="Protect your account"
          text="The TSP office asks everyone on the team to use an authenticator app. It takes a minute, once."
        />
        <TwoStepSetup challengeToken={challenge.challengeToken} onEnabled={(r) => r.accessToken && onSignedIn(r as AuthTokenResponse)} />
        <BackLink onClick={onCancel} />
      </div>
    );
  }
  return <TwoStepVerify challenge={challenge} onSignedIn={onSignedIn} onCancel={onCancel} />;
}

function TwoStepVerify({
  challenge,
  onSignedIn,
  onCancel,
}: {
  challenge: TwoStepChallenge;
  onSignedIn: (response: AuthTokenResponse) => void;
  onCancel: () => void;
}) {
  const [code, setCode] = useState("");
  const [useRecovery, setUseRecovery] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      onSignedIn(await apiClient.post<AuthTokenResponse>("/auth/two-step/verify", { challengeToken: challenge.challengeToken, code }));
    } catch (err) {
      setError(message(err, "That code didn't match."));
      setCode("");
    } finally {
      setBusy(false);
    }
  };

  const ready = useRecovery ? code.replace(/[\s-]/g, "").length === 8 : /^\d{6}$/.test(code);

  return (
    <form onSubmit={submit} className="space-y-5">
      <Heading
        title={challenge.name ? `Welcome back, ${challenge.name.split(" ")[0]}` : "One more step"}
        text={
          useRecovery
            ? "Enter one of the recovery codes you saved when you set up two-step verification. Each works once."
            : "Open your authenticator app and enter the 6-digit code for Time Space & Planets."
        }
      />
      <input
        autoFocus
        inputMode={useRecovery ? "text" : "numeric"}
        autoComplete="one-time-code"
        aria-label={useRecovery ? "Recovery code" : "6-digit code"}
        maxLength={useRecovery ? 9 : 6}
        placeholder={useRecovery ? "XXXX-XXXX" : "••••••"}
        value={code}
        onChange={(e) => setCode(useRecovery ? e.target.value.toUpperCase() : e.target.value.replace(/\D/g, ""))}
        className={codeInput}
      />
      {error && <p className="text-center text-[13px] text-garnet">{error}</p>}
      <button type="submit" disabled={!ready || busy} className={primary}>
        {busy && <Loader2 className="h-4 w-4 animate-spin" />} Verify and sign in
      </button>
      <div className="flex items-center justify-between text-[13px]">
        <BackLink onClick={onCancel} />
        <button
          type="button"
          onClick={() => {
            setUseRecovery((v) => !v);
            setCode("");
            setError(null);
          }}
          className="font-medium text-bronze hover:text-ink"
        >
          {useRecovery ? "Use the app instead" : "Lost your phone? Use a recovery code"}
        </button>
      </div>
    </form>
  );
}

/**
 * Setting up the authenticator: scan the QR code, confirm the first code, save
 * the recovery codes. With `challengeToken` this also completes signing in.
 */
export function TwoStepSetup({
  challengeToken,
  onEnabled,
}: {
  challengeToken?: string;
  onEnabled: (result: Partial<AuthTokenResponse> & { recoveryCodes: string[] }) => void;
}) {
  const [setup, setSetup] = useState<{ secret: string; qrDataUrl: string } | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<(Partial<AuthTokenResponse> & { recoveryCodes: string[] }) | null>(null);

  useEffect(() => {
    apiClient
      .post<{ secret: string; qrDataUrl: string }>("/auth/two-step/setup", challengeToken ? { challengeToken } : {})
      .then(setSetup)
      .catch((e) => setError(message(e, "Could not start the set-up.")));
  }, [challengeToken]);

  const confirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      setResult(
        await apiClient.post<Partial<AuthTokenResponse> & { recoveryCodes: string[] }>("/auth/two-step/enable", {
          code,
          ...(challengeToken && { challengeToken }),
        }),
      );
    } catch (err) {
      setError(message(err, "That code didn't match."));
      setCode("");
    } finally {
      setBusy(false);
    }
  };

  if (result) return <RecoveryCodes codes={result.recoveryCodes} onDone={() => onEnabled(result)} doneLabel={challengeToken ? "Continue" : "Done"} />;

  return (
    <form onSubmit={confirm} className="space-y-5">
      <ol className="space-y-4 text-[14px] text-ink-2">
        <li className="flex gap-3">
          <Step n={1} />
          <span>
            Install an authenticator app on your phone — <strong className="text-ink">Google Authenticator</strong>,{" "}
            <strong className="text-ink">Microsoft Authenticator</strong> or <strong className="text-ink">1Password</strong>.
          </span>
        </li>
        <li className="flex gap-3">
          <Step n={2} />
          <span>In the app, add an account and scan this code.</span>
        </li>
      </ol>
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-hairline bg-white p-5">
        {setup ? (
          <>
            <Image src={setup.qrDataUrl} alt="QR code for your authenticator app" width={188} height={188} unoptimized />
            <p className="text-center text-[12px] text-ink-3">
              Can&apos;t scan? Enter this key in the app:
              <br />
              <code className="mt-1 inline-block select-all break-all rounded bg-parchment px-2 py-1 font-mono text-[12px] tracking-wider text-ink">
                {setup.secret}
              </code>
            </p>
          </>
        ) : error ? (
          <p className="py-10 text-center text-[13px] text-garnet">{error}</p>
        ) : (
          <Loader2 className="my-16 h-6 w-6 animate-spin text-champagne" />
        )}
      </div>
      <div className="flex gap-3 text-[14px] text-ink-2">
        <Step n={3} />
        <span>Enter the 6-digit code the app now shows.</span>
      </div>
      <input
        inputMode="numeric"
        autoComplete="one-time-code"
        aria-label="6-digit code"
        maxLength={6}
        placeholder="••••••"
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
        className={codeInput}
      />
      {error && setup && <p className="text-center text-[13px] text-garnet">{error}</p>}
      <button type="submit" disabled={!setup || !/^\d{6}$/.test(code) || busy} className={primary}>
        {busy && <Loader2 className="h-4 w-4 animate-spin" />} Turn on two-step verification
      </button>
    </form>
  );
}

/** Shown once: ten codes that each unlock the account if the phone is lost. */
export function RecoveryCodes({ codes, onDone, doneLabel = "Done" }: { codes: string[]; onDone: () => void; doneLabel?: string }) {
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const text = `Time Space & Planets — recovery codes\nEach code works once. Keep them somewhere safe.\n\n${codes.join("\n")}\n`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setSaved(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* the codes are on screen to write down */
    }
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "tsp-recovery-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
    setSaved(true);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 rounded-xl border border-emerald-deep/20 bg-emerald-deep/5 p-4 text-[14px] text-ink-2">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-deep" />
        <p>
          <strong className="text-ink">Two-step verification is on.</strong> Save these recovery codes now — if you lose your phone,
          each one lets you sign in once. They won&apos;t be shown again.
        </p>
      </div>
      <ul className="grid grid-cols-2 gap-2 rounded-2xl border border-hairline bg-white p-4 font-mono text-[14px] tracking-wider text-ink">
        {codes.map((c) => (
          <li key={c} className="text-center">
            {c}
          </li>
        ))}
      </ul>
      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={copy} className="flex items-center justify-center gap-2 rounded-xl border border-hairline bg-white py-2.5 text-[13px] font-medium text-ink-2 hover:border-champagne">
          {copied ? <Check className="h-4 w-4 text-emerald-deep" /> : <Copy className="h-4 w-4" />} {copied ? "Copied" : "Copy"}
        </button>
        <button type="button" onClick={download} className="flex items-center justify-center gap-2 rounded-xl border border-hairline bg-white py-2.5 text-[13px] font-medium text-ink-2 hover:border-champagne">
          <Download className="h-4 w-4" /> Download
        </button>
      </div>
      <label className="flex items-center gap-2.5 text-[13px] text-ink-2">
        <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} className="h-4 w-4 accent-[#0B1233]" />
        I&apos;ve saved my recovery codes
      </label>
      <button type="button" disabled={!saved} onClick={onDone} className={primary}>
        {doneLabel}
      </button>
    </div>
  );
}

function Heading({ title, text }: { title: string; text: string }) {
  return (
    <div className="space-y-2 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-midnight text-champagne-light">
        <Smartphone className="h-5 w-5" />
      </span>
      <h3 className="font-playfair text-xl font-semibold text-ink">{title}</h3>
      <p className="text-[14px] text-ink-2">{text}</p>
    </div>
  );
}

function Step({ n }: { n: number }) {
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-parchment font-inter text-[12px] font-semibold text-bronze">
      {n}
    </span>
  );
}

function BackLink({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-1.5 text-[13px] text-ink-3 hover:text-ink">
      <KeyRound className="h-3.5 w-3.5" /> Use a different account
    </button>
  );
}
