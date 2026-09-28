"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Calendar, Clock, Search, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { BLOG_CATEGORIES, type BlogSummary, categoryLabel, formatBlogDate } from "@/lib/blog/blog";

const initials = (name: string) =>
  name.replace(/^Dr\.?\s+/i, "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "TSP";

/** Cover image, or a quiet navy-and-gold panel when an article has none. */
function Cover({ src, alt, className }: { src: string | null; alt: string; className?: string }) {
  if (!src) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-navy">
        <span className="font-heading text-4xl text-gold/70">✦</span>
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading="lazy" className={cn("absolute inset-0 h-full w-full object-cover transition-transform duration-500", className)} />;
}

export function BlogIndex({ posts }: { posts: BlogSummary[] }) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const categories = [{ id: "all", label: "All Insights" }, ...BLOG_CATEGORIES];

  // Filtering
  const filteredPosts = useMemo(() => {
    let result = [...posts];

    if (search.trim() !== "") {
      const q = search.toLowerCase();
      result = result.filter(
        (p) => p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q)
      );
    }

    if (activeCategory !== "all") {
      result = result.filter((p) => p.category === activeCategory);
    }

    return result;
  }, [posts, search, activeCategory]);

  // Separate the featured post (only when no filtering and active category is 'all')
  const isDefaultView = search.trim() === "" && activeCategory === "all";
  const featuredPost = isDefaultView ? posts[0] ?? null : null;
  const gridPosts = isDefaultView ? filteredPosts.slice(1) : filteredPosts;

  return (
    <div className="min-h-screen bg-cream pb-20">
      {/* Hero Header */}
      <section className="bg-gradient-navy text-white pt-[125px] pb-16 lg:pt-[140px] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gold via-transparent to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <p className="text-gold font-poppins text-xs font-semibold uppercase tracking-[0.25em] mb-3">
            Vedic Wisdom & Planetary Cycles
          </p>
          <h1 className="font-heading text-4xl md:text-5xl font-bold tracking-tight mb-4 text-gradient-gold">
            Inside Time Space & Planets
          </h1>
          <p className="text-cream/80 max-w-2xl mx-auto text-sm md:text-base font-inter">
            Deep dive into Vedic astronomy, relationship compatibility sciences, planetary transits, and ancient spiritual remedies written by seasoned masters.
          </p>
        </div>
      </section>

      {/* Filter and Search Panel */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="bg-white rounded-card border border-border p-4 mb-8 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "px-4 py-2 rounded-button text-xs font-semibold transition-all font-poppins border",
                  activeCategory === cat.id
                    ? "bg-navy text-white border-navy"
                    : "bg-cream/40 text-paragraph border-border hover:bg-cream hover:text-navy"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              placeholder="Search articles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-cream/50 rounded-lg border border-border focus:outline-none focus:border-gold transition-colors font-poppins"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-3.5 h-3.5 text-muted hover:text-dark" />
              </button>
            )}
          </div>
        </div>

        {/* Featured Post Card (Top Hero) */}
        {featuredPost && (
          <Link href={`/blog/${featuredPost.slug}`} className="mb-10 group bg-white rounded-card-lg border border-border overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 block">
            <div className="grid grid-cols-1 lg:grid-cols-12">
              {/* Image */}
              <div className="relative h-64 sm:h-96 lg:h-auto lg:col-span-7 bg-cream/50 overflow-hidden">
                <Cover src={featuredPost.coverImageUrl} alt={featuredPost.title} className="group-hover:scale-[1.01]" />
                <span className="absolute left-4 top-4 bg-gold text-navy text-[10px] uppercase font-bold tracking-wider px-3 py-1.5 rounded-full shadow-sm">
                  {categoryLabel(featuredPost.category)}
                </span>
              </div>

              {/* Details */}
              <div className="p-6 sm:p-10 lg:col-span-5 flex flex-col justify-between">
                <div className="space-y-4">
                  {/* Meta items */}
                  <div className="flex items-center gap-4 text-xs text-muted font-poppins">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatBlogDate(featuredPost.publishedAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {featuredPost.readMinutes} min read
                    </span>
                  </div>

                  <h2 className="font-heading text-2xl sm:text-3xl font-bold text-dark group-hover:text-navy transition-colors leading-tight">
                    {featuredPost.title}
                  </h2>
                  <p className="text-sm text-paragraph leading-relaxed">
                    {featuredPost.excerpt}
                  </p>
                </div>

                {/* Author & CTA */}
                <div className="mt-8 pt-6 border-t border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-navy text-white flex items-center justify-center text-xs font-bold font-poppins">
                      {initials(featuredPost.byline)}
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-dark">{featuredPost.byline}</h4>
                      
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 text-xs font-bold text-navy group-hover:text-gold transition-colors font-poppins">
                    Read Article
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* Regular Posts Grid */}
        {posts.length === 0 ? (
          <div className="bg-white rounded-card-lg border border-border p-14 text-center shadow-card">
            <BookOpen className="w-10 h-10 text-gold mx-auto mb-4 opacity-60" />
            <h2 className="font-heading text-2xl font-bold text-dark mb-2">Articles are on their way</h2>
            <p className="text-paragraph text-sm max-w-md mx-auto">
              Dr. Pradeep and the Time Space &amp; Planets team are preparing their first writings on Vedic astrology, Vastu and planetary cycles.
            </p>
          </div>
        ) : isDefaultView && gridPosts.length === 0 ? null : gridPosts.length === 0 ? (
          <div className="bg-white rounded-card-lg border border-border p-12 text-center shadow-card">
            <BookOpen className="w-10 h-10 text-gold mx-auto mb-3 opacity-40" />
            <p className="text-paragraph text-sm font-poppins">No articles found matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {gridPosts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="bg-white rounded-card border border-border overflow-hidden shadow-card card-hover flex flex-col justify-between group"
              >
                <div>
                  {/* Image container */}
                  <div className="relative h-48 w-full bg-cream/50 overflow-hidden">
                    <Cover src={post.coverImageUrl} alt={post.title} className="group-hover:scale-105" />
                    <span className="absolute left-3 top-3 bg-gold text-navy text-[9px] uppercase font-bold tracking-wider px-2.5 py-1.5 rounded-full shadow-sm">
                      {categoryLabel(post.category)}
                    </span>
                  </div>

                  {/* Details content */}
                  <div className="p-5 space-y-3">
                    <div className="flex items-center gap-3 text-[10px] text-muted font-poppins">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatBlogDate(post.publishedAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {post.readMinutes} min read
                      </span>
                    </div>

                    <h3 className="font-heading text-lg font-bold text-dark group-hover:text-navy transition-colors line-clamp-2 leading-snug">
                      {post.title}
                    </h3>

                    <p className="text-xs text-paragraph line-clamp-3 leading-relaxed">
                      {post.excerpt}
                    </p>
                  </div>
                </div>

                {/* Footer details */}
                <div className="p-5 pt-0 border-t border-border mt-4 flex items-center justify-between bg-cream/5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-navy/10 text-navy flex items-center justify-center text-[10px] font-bold font-poppins">
                      {initials(post.byline)}
                    </div>
                    <div>
                      <h4 className="text-[11px] font-semibold text-dark leading-none">{post.byline}</h4>
                      
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-navy group-hover:text-gold transition-colors font-poppins">
                    Read
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
