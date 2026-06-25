"use client";

import { useEffect, useState } from "react";
import { Loader2, ReceiptText, Package, Calendar } from "lucide-react";
import { apiClient } from "@/lib/http/client";

type ShopOrder = {
  id: string;
  status: string;
  totalAmount: string;
  createdAt: string;
  items: Array<{
    id: string;
    productName: string;
    quantity: number;
    price: string;
  }>;
};

type Booking = {
  id: string;
  serviceName: string;
  status: string;
  totalAmountPaise: number;
  scheduledDate?: string;
  createdAt: string;
};

type OrdersData = {
  shopOrders: ShopOrder[];
  bookings: Booking[];
};

const statusClasses: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  PAID: "bg-emerald-50 text-emerald-700",
  CONFIRMED: "bg-emerald-50 text-emerald-700",
  SHIPPED: "bg-blue-50 text-blue-700",
  DELIVERED: "bg-purple-50 text-purple-700",
  PENDING_PAYMENT: "bg-amber-50 text-amber-700",
  FAILED: "bg-rose-50 text-rose-700",
};

export default function OrdersPageContent() {
  const [data, setData] = useState<OrdersData>({ shopOrders: [], bookings: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        // Using any since we haven't typed this in the client ENDPOINTS yet
        const response = await apiClient.get<OrdersData>("/orders/my-orders");
        if (!cancelled) setData(response);
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load orders."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void loadOrders();

    return () => {
      cancelled = true;
    };
  }, []);

  const hasNoOrders = data.shopOrders.length === 0 && data.bookings.length === 0;

  return (
    <section className="py-12 md:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">
          Account
        </p>
        <h1 className="mt-2 font-heading text-3xl font-bold text-dark">
          My Orders & Bookings
        </h1>
        <p className="mt-2 text-sm text-paragraph">
          Track your shop orders and service consultations.
        </p>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-navy" />
          </div>
        ) : error ? (
          <div className="mt-8 rounded-card border border-rose-200 bg-rose-50 p-6 text-rose-700">
            {error}
          </div>
        ) : hasNoOrders ? (
          <div className="mt-8 rounded-card-lg border border-border bg-white px-6 py-14 text-center shadow-card">
            <ReceiptText className="mx-auto h-10 w-10 text-gold" />
            <h2 className="mt-4 font-heading text-xl font-bold text-dark">
              No orders found
            </h2>
            <p className="mt-2 text-sm text-muted">
              Your purchased products and booked services will appear here.
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-12">
            {/* Shop Orders */}
            {data.shopOrders.length > 0 && (
              <div className="space-y-4">
                <h2 className="font-heading text-xl font-bold text-dark flex items-center gap-2 border-b border-border pb-2">
                  <Package className="w-5 h-5 text-gold" /> Shop Orders
                </h2>
                {data.shopOrders.map((order) => (
                  <article
                    key={order.id}
                    className="rounded-card-lg border border-border bg-white p-6 shadow-card"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
                      <div>
                        <p className="break-all text-xs uppercase tracking-wide text-muted">
                          Order {order.id}
                        </p>
                        <p className="mt-2 font-heading text-xl font-bold text-dark">
                          {new Intl.NumberFormat("en-IN", {
                            style: "currency",
                            currency: "INR",
                          }).format(Number(order.totalAmount))}
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          {new Date(order.createdAt).toLocaleString("en-IN")}
                        </p>
                      </div>
                      <span
                        className={`h-fit w-fit rounded-button px-3 py-1 text-xs font-semibold ${statusClasses[order.status] || "bg-gray-50 text-gray-700"}`}
                      >
                        {order.status}
                      </span>
                    </div>

                    {order.items.length > 0 && (
                      <div className="mt-5 border-t border-border pt-4">
                        <p className="text-sm font-semibold text-dark mb-2">Items</p>
                        {order.items.map((item) => (
                          <div key={item.id} className="text-sm text-paragraph flex justify-between py-1">
                            <span>{item.quantity}x {item.productName}</span>
                            <span className="font-medium text-dark">₹{item.price}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}

            {/* Bookings */}
            {data.bookings.length > 0 && (
              <div className="space-y-4">
                <h2 className="font-heading text-xl font-bold text-dark flex items-center gap-2 border-b border-border pb-2">
                  <Calendar className="w-5 h-5 text-gold" /> Service Bookings
                </h2>
                {data.bookings.map((booking) => (
                  <article
                    key={booking.id}
                    className="rounded-card-lg border border-border bg-white p-6 shadow-card"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
                      <div>
                        <p className="break-all text-xs uppercase tracking-wide text-muted">
                          Booking {booking.id}
                        </p>
                        <p className="mt-2 font-heading text-lg font-bold text-navy">
                          {booking.serviceName}
                        </p>
                        <p className="mt-1 font-heading text-md font-semibold text-dark">
                          {new Intl.NumberFormat("en-IN", {
                            style: "currency",
                            currency: "INR",
                          }).format(booking.totalAmountPaise / 100)}
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          Booked on: {new Date(booking.createdAt).toLocaleString("en-IN")}
                        </p>
                        {booking.scheduledDate && (
                          <p className="mt-1 text-xs font-medium text-emerald-700">
                            Scheduled: {new Date(booking.scheduledDate).toLocaleDateString("en-IN")}
                          </p>
                        )}
                      </div>
                      <span
                        className={`h-fit w-fit rounded-button px-3 py-1 text-xs font-semibold ${statusClasses[booking.status] || "bg-gray-50 text-gray-700"}`}
                      >
                        {booking.status}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
