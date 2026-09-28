"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, PenLine, Plus } from "lucide-react";
import { PageHeader, Panel } from "@/features/admin/components/primitives";
import { Badge, TableShell, td, th } from "@/features/admin/components/records";
import { useAdminList } from "@/features/admin/hooks/useAdminList";
import { formatDateTime } from "@/features/admin/lib/format";
import { categoryLabel, type BlogSummary } from "@/lib/blog/blog";

export default function AdminBlogPage() {
  const router = useRouter();
  const { data, loading } = useAdminList<(BlogSummary & { authorName: string | null })[]>("/admin/blogs", {});

  return (
    <div className="mx-auto max-w-[1320px] space-y-8 px-5 py-8 md:px-10 md:py-12">
      <PageHeader
        eyebrow="Growth"
        title="Blog"
        description="Articles for the Insights page. Drafts stay private until you publish them."
        actions={
          <Link
            href="/admin/blog/new"
            className="inline-flex items-center gap-2 rounded-full bg-midnight px-5 py-2.5 text-[13px] font-semibold text-champagne-light shadow-[0_10px_24px_-12px_rgba(11,18,51,0.7)] transition hover:bg-midnight-2"
          >
            <Plus className="h-4 w-4" /> New article
          </Link>
        }
      />

      <Panel bodyClassName="px-0 pb-0 pt-0 md:px-0">
        <TableShell loading={loading && !data} empty={data && data.length === 0 ? "No articles yet. Write the first one." : null}>
          <table className="w-full min-w-[820px]">
            <thead>
              <tr className="border-b border-hairline">
                <th className={th}>Article</th>
                <th className={th}>Category</th>
                <th className={th}>Status</th>
                <th className={th}>Last edited</th>
                <th className={th} aria-label="Actions" />
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {data?.map((b) => (
                <tr key={b.id} onClick={() => router.push(`/admin/blog/${b.id}`)} className="cursor-pointer transition-colors hover:bg-parchment/60">
                  <td className={td}>
                    <p className="font-medium text-ink">{b.title}</p>
                    <p className="text-[12px] text-ink-3">
                      /blog/{b.slug} · {b.readMinutes} min · {b.byline}
                    </p>
                  </td>
                  <td className={td}>{categoryLabel(b.category)}</td>
                  <td className={td}>{b.published ? <Badge tone="good">Published</Badge> : <Badge tone="neutral">Draft</Badge>}</td>
                  <td className={`${td} whitespace-nowrap`}>
                    {formatDateTime(b.updatedAt)}
                    {b.authorName && <span className="block text-[12px] text-ink-3">by {b.authorName}</span>}
                  </td>
                  <td className={`${td} text-right whitespace-nowrap`}>
                    <span className="inline-flex gap-3 text-[13px]">
                      <span className="inline-flex items-center gap-1 font-medium text-bronze">
                        <PenLine className="h-3.5 w-3.5" /> Edit
                      </span>
                      {b.published && (
                        <a
                          href={`/blog/${b.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-ink-2 hover:text-ink"
                        >
                          <ExternalLink className="h-3.5 w-3.5" /> View
                        </a>
                      )}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>
      </Panel>
    </div>
  );
}
