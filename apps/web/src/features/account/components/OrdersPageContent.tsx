"use client";

import { useEffect, useState } from "react";
import { Loader2, ReceiptText } from "lucide-react";
import { apiClient } from "@/lib/http/client";
import { ENDPOINTS } from "@/lib/constants/http/endpoints";
import type { PaymentOrder } from "@/types/api";

const statusClasses: Record<PaymentOrder["status"], string> = {
  PENDING: "bg-amber-50 text-amber-700",
  SUCCESS: "bg-emerald-50 text-emerald-700",
  FAILED: "bg-rose-50 text-rose-700",
};

export default function OrdersPageContent() {
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiClient.get<PaymentOrder[]>(
          ENDPOINTS.PAYMENTS.ORDERS
        );
        if (!cancelled) setOrders(data);
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load payment orders."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void loadOrders();

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        void loadOrders();
      }
    };

    window.addEventListener("pageshow", handlePageShow);

    return () => {
      cancelled = true;
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

  return (
    <section className="py-12 md:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">
          Billing
        </p>
        <h1 className="mt-2 font-heading text-3xl font-bold text-dark">
          Payment Orders
        </h1>
        <p className="mt-2 text-sm text-paragraph">
          Track wallet top-up orders, payment attempts, and refunds.
        </p>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-navy" />
          </div>
        ) : error ? (
          <div className="mt-8 rounded-card border border-rose-200 bg-rose-50 p-6 text-rose-700">
            {error}
          </div>
        ) : orders.length === 0 ? (
          <div className="mt-8 rounded-card-lg border border-border bg-white px-6 py-14 text-center shadow-card">
            <ReceiptText className="mx-auto h-10 w-10 text-gold" />
            <h2 className="mt-4 font-heading text-xl font-bold text-dark">
              No payment orders yet
            </h2>
            <p className="mt-2 text-sm text-muted">
              Wallet top-up orders will appear here.
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {orders.map((order) => (
              <article
                key={order.id}
                className="rounded-card-lg border border-border bg-white p-6 shadow-card"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
                  <div>
                    <p className="break-all text-xs uppercase tracking-wide text-muted">
                      Order {order.id}
                    </p>
                    <p className="mt-2 font-heading text-2xl font-bold text-dark">
                      {new Intl.NumberFormat("en-IN", {
                        style: "currency",
                        currency: order.currency,
                      }).format(Number(order.amount))}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {order.gatewayProvider} ·{" "}
                      {new Date(order.createdAt).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <span
                    className={`h-fit w-fit rounded-button px-3 py-1 text-xs font-semibold ${statusClasses[order.status]}`}
                  >
                    {order.status}
                  </span>
                </div>

                {order.transactions.length > 0 && (
                  <div className="mt-5 border-t border-border pt-4">
                    <p className="text-sm font-semibold text-dark">
                      Payment attempts
                    </p>
                    {order.transactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="mt-3 flex flex-col justify-between gap-1 rounded-input bg-cream px-4 py-3 text-xs sm:flex-row"
                      >
                        <span className="break-all text-paragraph">
                          {transaction.gatewayTransactionId || transaction.id}
                        </span>
                        <span className="font-semibold text-dark">
                          {transaction.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
