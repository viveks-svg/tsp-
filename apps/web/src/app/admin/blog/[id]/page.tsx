"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, ExternalLink, Eye, Loader2, PenLine, Send, Trash2, Undo2 } from "lucide-react";
import { apiClient } from "@/lib/http/client";
import { cn } from "@/lib/cn";
import { Markdown } from "@/components/shared/Markdown";
import { Panel, Skeleton } from "@/features/admin/components/primitives";
import { Badge } from "@/features/admin/components/records";
import { BLOG_CATEGORIES, type BlogArticle } from "@/lib/blog/blog";

interface Form {
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  coverImageUrl: string;
  byline: string;
  content: string;
}

const EMPTY: Form = { title: "", slug: "", excerpt: "", category: "vedic", coverImageUrl: "", byline: "Dr. Pradeep Sharma", content: "" };

const inputClass =
  "w-full rounded-xl border border-hairline bg-ivory px-3.5 py-2.5 text-[14px] text-ink outline-none transition focus:border-champagne focus:ring-2 focus:ring-champagne/20";

const toForm = (a: BlogArticle): Form => ({
  title: a.title,
  slug: a.slug,
  excerpt: a.excerpt ?? "",
  category: a.category,
  coverImageUrl: a.coverImageUrl ?? "",
  byline: a.byline ?? "",
  content: a.content,
});

export default function BlogEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const isNew = id === "new";
  const router = useRouter();
  const [article, setArticle] = useState<BlogArticle | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [saved, setSaved] = useState<Form>(EMPTY);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (isNew) return;
    apiClient
      .get<BlogArticle>(`/admin/blogs/${id}`)
      .then((a) => {
        setArticle(a);
        setForm(toForm(a));
        setSaved(toForm(a));
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Could not load the article"));
  }, [id, isNew]);

  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(saved), [form, saved]);

  // Don't lose an unsaved article by closing the tab.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const set = (k: keyof Form, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const words = form.content.split(/\s+/).filter(Boolean).length;
  const valid = form.title.trim().length >= 4 && form.content.trim().length > 0;

  const save = async (published?: boolean) => {
    setBusy(published === undefined ? "save" : published ? "publish" : "unpublish");
    const body = {
      title: form.title,
      ...(form.slug.trim() && { slug: form.slug.trim() }),
      excerpt: form.excerpt,
      category: form.category,
      coverImageUrl: form.coverImageUrl.trim() || undefined,
      byline: form.byline,
      content: form.content,
      ...(published !== undefined && { published }),
    };
    try {
      const a = isNew
        ? await apiClient.post<BlogArticle>("/admin/blogs", body)
        : await apiClient.patch<BlogArticle>(`/admin/blogs/${id}`, body);
      setArticle(a);
      setForm(toForm(a));
      setSaved(toForm(a));
      toast.success(published === true ? "Published — it's live on the Insights page." : published === false ? "Unpublished." : "Saved.");
      if (isNew) router.replace(`/admin/blog/${a.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    if (!confirm("Delete this article permanently?")) return;
    setBusy("delete");
    try {
      await apiClient.delete(`/admin/blogs/${id}`);
      toast.success("Article deleted.");
      router.replace("/admin/blog");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete");
      setBusy(null);
    }
  };

  if (!isNew && !article) {
    return (
      <div className="mx-auto max-w-[1320px] px-5 py-8 md:px-10 md:py-12">
        <Skeleton className="h-[600px]" />
      </div>
    );
  }

  const published = !!article?.published;

  return (
    <div className="mx-auto max-w-[1320px] space-y-6 px-5 py-8 md:px-10 md:py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/admin/blog" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-bronze hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> All articles
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          {published ? <Badge tone="good">Published</Badge> : <Badge tone="neutral">Draft</Badge>}
          {dirty && <Badge tone="waiting">Unsaved changes</Badge>}
          {published && article && (
            <a
              href={`/blog/${article.slug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-ivory px-3.5 py-2 text-[12px] font-medium text-ink-2 hover:border-champagne"
            >
              <ExternalLink className="h-3.5 w-3.5" /> View live
            </a>
          )}
          <button
            onClick={() => save()}
            disabled={!valid || !!busy || (!dirty && !isNew)}
            className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-ivory px-4 py-2 text-[13px] font-medium text-ink-2 hover:border-champagne disabled:opacity-40"
          >
            {busy === "save" && <Loader2 className="h-3.5 w-3.5 animate-spin" />} {published ? "Save changes" : "Save draft"}
          </button>
          {published ? (
            <button
              onClick={() => save(false)}
              disabled={!!busy}
              className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-ivory px-4 py-2 text-[13px] font-medium text-ink-2 hover:border-champagne disabled:opacity-40"
            >
              {busy === "unpublish" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Undo2 className="h-3.5 w-3.5" />} Unpublish
            </button>
          ) : (
            <button
              onClick={() => save(true)}
              disabled={!valid || !!busy}
              className="inline-flex items-center gap-1.5 rounded-full bg-midnight px-4 py-2 text-[13px] font-semibold text-champagne-light hover:bg-midnight-2 disabled:opacity-40"
            >
              {busy === "publish" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />} Publish
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_340px]">
        <Panel bodyClassName="space-y-5 pt-6">
          <input
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Title"
            aria-label="Title"
            className="w-full border-0 bg-transparent font-playfair text-3xl font-semibold text-ink outline-none placeholder:text-ink-3/50 md:text-4xl"
          />
          <div className="flex items-center gap-1.5 border-b border-hairline">
            {(["write", "preview"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "-mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-[13px] font-medium",
                  tab === t ? "border-champagne text-ink" : "border-transparent text-ink-3 hover:text-ink",
                )}
              >
                {t === "write" ? <PenLine className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                {t === "write" ? "Write" : "Preview"}
              </button>
            ))}
            <span className="ml-auto text-[12px] text-ink-3">
              {words} words · {Math.max(1, Math.round(words / 200))} min read
            </span>
          </div>
          {tab === "write" ? (
            <textarea
              value={form.content}
              onChange={(e) => set("content", e.target.value)}
              aria-label="Article text"
              placeholder={"Write in Markdown:\n\n## A heading\n\nA paragraph with **bold**, *italics* and a [link](https://…).\n\n- a list item\n\n> A quotation"}
              className="min-h-[560px] w-full resize-y rounded-xl border border-hairline bg-ivory p-4 font-mono text-[14px] leading-relaxed text-ink outline-none focus:border-champagne"
            />
          ) : form.content.trim() ? (
            <div className="min-h-[560px] rounded-xl border border-hairline bg-ivory px-6 py-2">
              {form.excerpt && <p className="mt-6 font-playfair text-[20px] text-ink italic">{form.excerpt}</p>}
              <Markdown>{form.content}</Markdown>
            </div>
          ) : (
            <p className="py-20 text-center text-[14px] text-ink-3">Nothing to preview yet.</p>
          )}
        </Panel>

        <div className="space-y-6">
          <Panel title="Details">
            <div className="space-y-4">
              <label className="block space-y-1.5">
                <span className="block text-[13px] font-medium text-ink-2">Category</span>
                <select value={form.category} onChange={(e) => set("category", e.target.value)} className={inputClass}>
                  {BLOG_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1.5">
                <span className="block text-[13px] font-medium text-ink-2">Written by</span>
                <input value={form.byline} onChange={(e) => set("byline", e.target.value)} placeholder="Time Space & Planets" className={inputClass} />
              </label>
              <label className="block space-y-1.5">
                <span className="block text-[13px] font-medium text-ink-2">Summary</span>
                <textarea
                  rows={4}
                  maxLength={300}
                  value={form.excerpt}
                  onChange={(e) => set("excerpt", e.target.value)}
                  placeholder="One or two sentences for the article card and search engines. Left empty, the opening lines are used."
                  className={cn(inputClass, "resize-none")}
                />
                <span className="block text-right text-[11px] text-ink-3">{form.excerpt.length}/300</span>
              </label>
              <label className="block space-y-1.5">
                <span className="block text-[13px] font-medium text-ink-2">Cover image link</span>
                <input value={form.coverImageUrl} onChange={(e) => set("coverImageUrl", e.target.value)} placeholder="https://…" className={inputClass} />
                {/^https:\/\//.test(form.coverImageUrl) && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.coverImageUrl} alt="" className="mt-2 h-32 w-full rounded-xl border border-hairline object-cover" />
                )}
              </label>
              <label className="block space-y-1.5">
                <span className="block text-[13px] font-medium text-ink-2">Web address</span>
                <div className="flex items-center rounded-xl border border-hairline bg-parchment/60 pl-3 text-[13px] text-ink-3 focus-within:border-champagne">
                  /blog/
                  <input
                    value={form.slug}
                    onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                    placeholder="made from the title"
                    className="w-full rounded-r-xl bg-ivory px-2 py-2.5 text-[13px] text-ink outline-none"
                  />
                </div>
                {published && <span className="block text-[11px] text-bronze">Changing the address of a published article breaks links shared to it.</span>}
              </label>
            </div>
          </Panel>

          {!isNew && (
            <button
              onClick={remove}
              disabled={!!busy}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-garnet/30 px-4 py-2.5 text-[13px] font-medium text-garnet hover:bg-garnet/5 disabled:opacity-40"
            >
              {busy === "delete" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Delete article
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
