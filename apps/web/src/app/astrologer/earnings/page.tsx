"use client";

import { useAuth } from "@/providers/AuthProvider";
import { IndianRupee, TrendingUp, Calendar, ArrowUpRight, DollarSign, Wallet } from "lucide-react";

export default function AstrologerEarningsPage() {
  const { walletBalance } = useAuth();

  const mockTransactions = [
    { id: "TXN001", client: "Amit Patel", type: "Chat", date: "June 16, 2026", duration: "15 min", amount: 450.00 },
    { id: "TXN002", client: "Neha Sharma", type: "Call", date: "June 15, 2026", duration: "10 min", amount: 300.00 },
    { id: "TXN003", client: "Rajesh Kumar", type: "Chat", date: "June 14, 2026", duration: "25 min", amount: 750.00 },
    { id: "TXN004", client: "Priya Singh", type: "Call", date: "June 12, 2026", duration: "8 min", amount: 240.00 },
  ];

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold font-poppins">
          Astrologer Panel
        </p>
        <h1 className="mt-1 font-heading text-3xl font-bold text-dark">
          Earnings & Payouts
        </h1>
        <p className="mt-1 text-sm text-paragraph">
          Track your consultative earnings and payout history.
        </p>
      </div>

      {/* Cards Grid */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <div className="bg-white border border-border rounded-card p-6 shadow-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-navy/10 flex items-center justify-center shrink-0">
            <IndianRupee className="w-6 h-6 text-navy" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted">Current Balance</p>
            <h3 className="text-2xl font-bold text-dark font-poppins mt-0.5">
              ₹{Number(walletBalance).toFixed(2)}
            </h3>
          </div>
        </div>

        <div className="bg-white border border-border rounded-card p-6 shadow-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted">This Month</p>
            <h3 className="text-2xl font-bold text-dark font-poppins mt-0.5">
              ₹1,740.00
            </h3>
          </div>
        </div>

        <div className="bg-white border border-border rounded-card p-6 shadow-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6 text-gold" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted">Total Consultations</p>
            <h3 className="text-2xl font-bold text-dark font-poppins mt-0.5">
              4 Sessions
            </h3>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white border border-border rounded-card-lg shadow-card overflow-hidden">
        <div className="p-6 border-b border-border flex justify-between items-center">
          <h2 className="font-heading text-lg font-bold text-dark">Recent Transactions</h2>
          <span className="text-xs text-muted font-medium">Updated just now</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-cream/45 border-b border-border">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted font-poppins">Txn ID</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted font-poppins">Client</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted font-poppins">Type</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted font-poppins">Date</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted font-poppins">Duration</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted font-poppins text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {mockTransactions.map((txn) => (
                <tr key={txn.id} className="hover:bg-cream/20 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-dark font-mono">{txn.id}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-dark">{txn.client}</td>
                  <td className="px-6 py-4 text-sm text-paragraph">{txn.type}</td>
                  <td className="px-6 py-4 text-sm text-paragraph">{txn.date}</td>
                  <td className="px-6 py-4 text-sm text-paragraph">{txn.duration}</td>
                  <td className="px-6 py-4 text-sm font-bold text-navy text-right">₹{txn.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
