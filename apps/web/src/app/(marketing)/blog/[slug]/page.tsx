import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Calendar, Clock, PenLine } from "lucide-react";
import { Markdown } from "@/components/shared/Markdown";
import { categoryLabel, fetchPost, formatBlogDate } from "@/lib/blog/blog";

interface Props {
  params: Promise<{ slug: string }>;
}

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://timespaceplanets.com";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchPost(slug);
  if (!post) return { title: "Article not found | Time Space & Planets" };
  const url = `${SITE}/blog/${post.slug}`;
  return {
    title: `${post.title} | Time Space & Planets`,
    description: post.excerpt,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: post.title,
      description: post.excerpt,
      publishedTime: post.publishedAt ?? undefined,
      authors: [post.byline],
      ...(post.coverImageUrl && { images: [{ url: post.coverImageUrl }] }),
    },
  };
}

export default async function BlogArticlePage({ params }: Props) {
  const { slug } = await params;
  const post = await fetchPost(slug);
  if (!post) notFound();

  return (
    <div className="min-h-screen bg-cream">
      <section className="relative overflow-hidden bg-gradient-navy pt-[125px] pb-0 text-white lg:pt-[140px]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gold via-transparent to-transparent opacity-10" />
        <div className="relative z-10 mx-auto max-w-4xl px-4 pb-12 sm:px-6 lg:px-8">
          <Link href="/blog" className="mb-8 inline-flex items-center gap-2 font-poppins text-sm text-white/60 transition-colors hover:text-gold">
            <ArrowLeft className="h-4 w-4" />
            All articles
          </Link>
          <span className="mb-5 block font-cinzel text-[11px] font-semibold tracking-[0.28em] text-gold uppercase">{categoryLabel(post.category)}</span>
          <h1 className="mb-6 font-heading text-3xl leading-tight font-bold tracking-tight text-white md:text-4xl lg:text-5xl">{post.title}</h1>
          <div className="flex flex-wrap items-center gap-5 font-poppins text-sm text-white/60">
            <span className="flex items-center gap-1.5">
              <PenLine className="h-4 w-4" />
              {post.byline}
            </span>
            {post.publishedAt && (
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {formatBlogDate(post.publishedAt)}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {post.readMinutes} min read
            </span>
          </div>
        </div>
      </section>

      {post.coverImageUrl && (
        <div className="mx-auto -mt-1 max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Cover images can come from any https host, so a plain <img>. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.coverImageUrl}
            alt={post.title}
            className="h-64 w-full rounded-2xl border border-border object-cover shadow-card-hover sm:h-80 md:h-[420px]"
          />
        </div>
      )}

      <article className="mx-auto max-w-[720px] px-5 py-14 sm:px-6">
        {post.excerpt && <p className="mb-10 font-playfair text-[22px] leading-relaxed text-ink italic">{post.excerpt}</p>}
        <Markdown>{post.content}</Markdown>

        <div aria-hidden className="my-14 h-px bg-gradient-to-r from-transparent via-champagne/60 to-transparent" />

        <div className="flex flex-col items-center gap-4 rounded-2xl border border-hairline bg-ivory px-8 py-10 text-center">
          <p className="font-cinzel text-[11px] font-semibold tracking-[0.28em] text-bronze uppercase">A private consultation</p>
          <h2 className="font-playfair text-2xl font-semibold text-ink">Want guidance on your own chart?</h2>
          <p className="max-w-md text-[15px] text-ink-2">Book a session with Dr. Pradeep Sharma for a personal reading.</p>
          <Link
            href="/book"
            className="mt-2 inline-flex items-center gap-2 rounded-full bg-midnight px-6 py-3 text-[14px] font-semibold text-champagne-light transition hover:bg-midnight-2"
          >
            Book a consultation
          </Link>
        </div>
      </article>
    </div>
  );
}
