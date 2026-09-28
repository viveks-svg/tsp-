"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { IndianRupee, Landmark, TrendingUp } from "lucide-react";
import { apiClient } from "@/lib/http/client";
import { ENDPOINTS } from "@/lib/constants/http/endpoints";
import { cn } from "@/lib/cn";
import { PageHeader, Panel, Skeleton, StatTile } from "@/features/admin/components/primitives";
import { formatDateTime, formatINR } from "@/features/admin/lib/format";

interface Earnings {
  balance: number;
  lifetime: number;
  entries: {
    id: string;
    amount: number;
    type: "CREDIT" | "DEBIT";
    purpose: string;
    description: string;
    balanceAfter: number;
    createdAt: string;
  }[];
}

/** The astrologer's real earnings — every credit and debit on their TSP balance. */
export default function EarningsPage() {
  const [data, setData] = useState<Earnings | null>(null);

  useEffect(() => {
    apiClient
      .get<Earnings>(ENDPOINTS.ASTROLOGER_PANEL.EARNINGS)
      .then(setData)
      .catch((e) => toast.error(e instanceof Error ? e.message : "Could not load earnings"));
  }, []);

  return (
    <div className="mx-auto max-w-[1100px] space-y-8 px-5 py-8 md:px-10 md:py-12">
      <PageHeader
        eyebrow="Practice"
        title="Earnings"
        description="What your consultations have earned. The TSP office settles your balance by bank transfer."
      />

      {!data ? (
        <Skeleton className="h-96" />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <StatTile label="Balance to be settled" icon={<Landmark className="h-4 w-4" />} value={formatINR(data.balance)} />
            <StatTile label="Earned from consultations" icon={<TrendingUp className="h-4 w-4" />} value={formatINR(data.lifetime)} detail="Since you joined" />
            <StatTile label="Entries" icon={<IndianRupee className="h-4 w-4" />} value={data.entries.length} detail="Most recent 100 shown" />
          </div>

          <Panel title="Statement" subtitle="Every change to your balance, newest first" bodyClassName="px-0 pb-2 md:px-0">
            {data.entries.length === 0 ? (
              <p className="px-6 pb-6 text-[14px] text-ink-3 md:px-7">No earnings yet. Completed consultations appear here.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-hairline text-[12px] text-ink-3">
                      <th className="px-6 py-3 font-medium md:px-7">Date</th>
                      <th className="px-3 py-3 font-medium">Details</th>
                      <th className="px-3 py-3 text-right font-medium">Amount</th>
                      <th className="px-6 py-3 text-right font-medium md:px-7">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline">
                    {data.entries.map((e) => (
                      <tr key={e.id}>
                        <td className="px-6 py-3.5 whitespace-nowrap text-ink-2 md:px-7">{formatDateTime(e.createdAt)}</td>
                        <td className="px-3 py-3.5 text-ink">{e.description}</td>
                        <td
                          className={cn(
                            "px-3 py-3.5 text-right font-semibold whitespace-nowrap tabular-nums",
                            e.type === "CREDIT" ? "text-emerald-deep" : "text-garnet",
                          )}
                        >
                          {e.type === "CREDIT" ? "+" : "−"}
                          {formatINR(e.amount)}
                        </td>
                        <td className="px-6 py-3.5 text-right whitespace-nowrap text-ink-2 tabular-nums md:px-7">{formatINR(e.balanceAfter)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </>
      )}
    </div>
  );
}
