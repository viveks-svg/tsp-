"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Loader2, WalletCards } from "lucide-react";
import { apiClient } from "@/lib/http/client";
import { ENDPOINTS } from "@/lib/constants/http/endpoints";
import type { WalletResponse } from "@/types/api";
import { useAuth } from "@/providers/AuthProvider";

const money = (value: string | number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(Number(value));

const dateTime = (value: string) =>
  new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

export default function WalletPageContent() {
  const { hydrate: hydrateAuth, user } = useAuth();
  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [amount, setAmount] = useState("500");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWallet = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setWallet(
        await apiClient.get<WalletResponse>(ENDPOINTS.WALLET.DETAIL)
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Unable to load wallet."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const initialLoad = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiClient.get<WalletResponse>(
          ENDPOINTS.WALLET.DETAIL
        );
        if (!cancelled) setWallet(data);
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load wallet."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void initialLoad();

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        void initialLoad();
      }
    };

    window.addEventListener("pageshow", handlePageShow);

    return () => {
      cancelled = true;
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (typeof window !== "undefined" && (window as any).Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const addFunds = async (event: React.FormEvent) => {
    event.preventDefault();
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount < 1) {
      setError("Enter an amount of at least ₹1.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      const orderData = await apiClient.post<any>(ENDPOINTS.PAYMENTS.ORDERS, {
        amount: numericAmount,
        currency: "INR",
      });

      if (orderData.mock || !process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
         await apiClient.post(ENDPOINTS.PAYMENTS.VERIFY, {
           orderId: orderData.id,
           gatewayTransactionId: "mock_txn_" + Math.random().toString(36).substring(7),
           signature: "mock_signature",
         });
         await Promise.all([loadWallet(), hydrateAuth()]);
         setSubmitting(false);
         return;
      }

      const isLoaded = await loadRazorpay();
      if (!isLoaded) {
        setError("Razorpay SDK failed to load. Are you offline?");
        setSubmitting(false);
        return;
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || orderData.key,
        amount: numericAmount * 100,
        currency: "INR",
        name: "TSP Wallet",
        description: "Add funds to your wallet",
        order_id: orderData.gatewayOrderId,
        handler: async (response: any) => {
          try {
            await apiClient.post(ENDPOINTS.PAYMENTS.VERIFY, {
              orderId: orderData.id,
              gatewayTransactionId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });
            await Promise.all([loadWallet(), hydrateAuth()]);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Payment verification failed.");
          } finally {
            setSubmitting(false);
          }
        },
        prefill: {
          name: user?.name || "User",
          email: user?.email || "",
          contact: user?.phone || "",
        },
        theme: {
          color: "#D4AF37",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        setError("Payment failed: " + response.error.description);
        setSubmitting(false);
      });
      rzp.open();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to add funds."
      );
      setSubmitting(false);
    }
  };

  return (
    <section className="py-12 md:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">
          Account
        </p>
        <h1 className="mt-2 font-heading text-3xl font-bold text-dark">
          Your Wallet
        </h1>
        <p className="mt-2 text-sm text-paragraph">
          View your balance and consultation or top-up entries.
        </p>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-navy" />
          </div>
        ) : error && !wallet ? (
          <div className="mt-8 rounded-card border border-rose-200 bg-rose-50 p-6 text-rose-700">
            {error}
          </div>
        ) : wallet ? (
          <>
            <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
              <div className="rounded-card-lg bg-navy p-7 text-white shadow-card">
                <WalletCards className="h-8 w-8 text-gold" />
                <p className="mt-8 text-sm text-white/70">Available balance</p>
                <p className="mt-1 font-heading text-4xl font-bold">
                  {money(wallet.balance)}
                </p>
              </div>

              <form
                onSubmit={addFunds}
                className="rounded-card-lg border border-border bg-white p-6 shadow-card"
              >
                <h2 className="font-heading text-xl font-bold text-dark">
                  Add funds to wallet
                </h2>
                <p className="mt-1 text-xs text-muted">
                  Secure payment processing via Razorpay.
                </p>
                <label className="mt-5 block text-sm font-medium text-dark">
                  Amount in INR
                </label>
                <input
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  className="mt-2 w-full rounded-input border border-border px-4 py-3 outline-none focus:border-gold"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-4 w-full rounded-button bg-gold px-5 py-3 text-sm font-semibold text-dark hover:bg-gold-hover disabled:opacity-60"
                >
                  {submitting ? "Adding funds..." : "Add funds"}
                </button>
                {error && <p className="mt-3 text-xs text-rose-600">{error}</p>}
              </form>
            </div>

            <div className="mt-8 overflow-hidden rounded-card-lg border border-border bg-white shadow-card">
              <h2 className="border-b border-border px-6 py-5 font-heading text-xl font-bold text-dark">
                Transaction history
              </h2>
              {wallet.ledgerEntries.length === 0 ? (
                <p className="px-6 py-10 text-center text-sm text-muted">
                  No wallet transactions yet.
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {wallet.ledgerEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={
                            entry.type === "CREDIT"
                              ? "rounded-full bg-emerald-50 p-2 text-emerald-600"
                              : "rounded-full bg-rose-50 p-2 text-rose-600"
                          }
                        >
                          {entry.type === "CREDIT" ? (
                            <ArrowDownLeft className="h-4 w-4" />
                          ) : (
                            <ArrowUpRight className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-dark">
                            {entry.description}
                          </p>
                          <p className="mt-1 text-xs text-muted">
                            {entry.purpose} · {dateTime(entry.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="sm:text-right">
                        <p
                          className={
                            entry.type === "CREDIT"
                              ? "font-semibold text-emerald-600"
                              : "font-semibold text-rose-600"
                          }
                        >
                          {entry.type === "CREDIT" ? "+" : "-"}
                          {money(entry.amount)}
                        </p>
                        <p className="text-xs text-muted">
                          Balance {money(entry.balanceAfter)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
