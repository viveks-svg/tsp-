"use client";

import React, { useState, useMemo } from "react";
import { Search, Calendar, Clock, User, ArrowRight, BookOpen, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string; // 'vedic' | 'matchmaking' | 'gemstones' | 'horoscope'
  categoryLabel: string;
  image: string;
  publishedAt: string;
  readTime: string;
  author: {
    name: string;
    avatar: string;
    role: string;
  };
}

const BLOG_POSTS: BlogPost[] = [
  {
    id: "post-1",
    title: "Saturn Transit 2026: Impact on All 12 Moon Signs & Remedial Puja Guide",
    slug: "saturn-transit-2026-impact-moon-signs",
    excerpt: "Shani Dev transitions planetary houses this year. Discover how this major transit influences your career, wealth, health, and relationship prospects, along with critical remedies.",
    content: "",
    category: "vedic",
    categoryLabel: "Vedic Astrology",
    image: "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?auto=format&fit=crop&w=800&q=80",
    publishedAt: "June 10, 2026",
    readTime: "8 min read",
    author: {
      name: "Acharya Kumar",
      avatar: "AK",
      role: "Lead Vedic Astrologer"
    }
  },
  {
    id: "post-2",
    title: "The Science of Gun Milan: Why 36 Gunas Determine Vedic Marriage Harmony",
    slug: "science-of-gun-milan-vedic-marriage",
    excerpt: "Kundli matchmaking is more than just matching stars. Understand how the Ashtakoot Milan points influence health, mind, children, and destiny compatibility in a marriage.",
    content: "",
    category: "matchmaking",
    categoryLabel: "Kundli Matching",
    image: "https://images.unsplash.com/photo-1604871000636-074fa5117945?auto=format&fit=crop&w=500&q=80",
    publishedAt: "June 08, 2026",
    readTime: "6 min read",
    author: {
      name: "Dr. Priya Sharma",
      avatar: "PS",
      role: "Relationship Consultant"
    }
  },
  {
    id: "post-3",
    title: "Gemstone Therapy: How to Choose the Right Planetary Gem for Career Growth",
    slug: "gemstone-therapy-planetary-gems-career",
    excerpt: "Wearing the wrong gemstone can trigger negative energies. Learn the correct rules for testing Yellow Sapphire (Pukhraj), Blue Sapphire (Neelam), and Emeralds (Panna).",
    content: "",
    category: "gemstones",
    categoryLabel: "Gemology",
    image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=500&q=80",
    publishedAt: "May 28, 2026",
    readTime: "5 min read",
    author: {
      name: "Acharya Guru",
      avatar: "AG",
      role: "Gemologist Expert"
    }
  },
  {
    id: "post-4",
    title: "Understanding Sade Sati: Myths, Realities, and How to Defuse Shani's Wrath",
    slug: "understanding-sade-sati-myths-remedies",
    excerpt: "Is Sade Sati always harmful? Vedic scriptures reveal that this 7.5-year planetary transit can actually become the most transformative and successful phase of your life.",
    content: "",
    category: "vedic",
    categoryLabel: "Vedic Astrology",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=500&q=80",
    publishedAt: "May 15, 2026",
    readTime: "10 min read",
    author: {
      name: "Acharya Kumar",
      avatar: "AK",
      role: "Lead Vedic Astrologer"
    }
  },
  {
    id: "post-5",
    title: "Vastu Tips for Your Home Office: Aligning Directions to Double Focus and Wealth",
    slug: "vastu-tips-home-office-focus-wealth",
    excerpt: "Struggling with concentration and stagnant business? Check if your work desk faces the South-West or North-East. Simple corrections that trigger fast prosperity.",
    content: "",
    category: "horoscope",
    categoryLabel: "Lifestyle & Vastu",
    image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=500&q=80",
    publishedAt: "May 02, 2026",
    readTime: "4 min read",
    author: {
      name: "Astro Ananya",
      avatar: "AA",
      role: "Vastu Shastra Guide"
    }
  },
  {
    id: "post-6",
    title: "How Mercury Retrograde Affects Your Communication and Tech Devices",
    slug: "mercury-retrograde-affects-communication-tech",
    excerpt: "Mercury controls contract negotiations, documents, and technology. Learn how to sail smoothly through the upcoming retrograde cycle without communication breakdowns.",
    content: "",
    category: "horoscope",
    categoryLabel: "Horoscopes",
    image: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=500&q=80",
    publishedAt: "April 20, 2026",
    readTime: "7 min read",
    author: {
      name: "Dr. Priya Sharma",
      avatar: "PS",
      role: "Relationship Consultant"
    }
  }
];

export default function BlogPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const categories = [
    { id: "all", label: "All Insights" },
    { id: "vedic", label: "Vedic Astrology" },
    { id: "matchmaking", label: "Kundli Matchmaking" },
    { id: "gemstones", label: "Gemstone Remedies" },
    { id: "horoscope", label: "Horoscopes & Vastu" }
  ];

  // Filtering
  const filteredPosts = useMemo(() => {
    let result = [...BLOG_POSTS];

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
  }, [search, activeCategory]);

  // Separate the featured post (only when no filtering and active category is 'all')
  const isDefaultView = search.trim() === "" && activeCategory === "all";
  const featuredPost = isDefaultView ? BLOG_POSTS[0] : null;
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
          <div className="mb-10 group bg-white rounded-card-lg border border-border overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-12">
              {/* Image */}
              <div className="relative h-64 sm:h-96 lg:h-auto lg:col-span-7 bg-cream/50 overflow-hidden">
                <Image
                  src={featuredPost.image}
                  alt={featuredPost.title}
                  fill
                  className="object-cover group-hover:scale-[1.01] transition-transform duration-500"
                  priority
                />
                <span className="absolute left-4 top-4 bg-gold text-navy text-[10px] uppercase font-bold tracking-wider px-3 py-1.5 rounded-full shadow-sm">
                  {featuredPost.categoryLabel}
                </span>
              </div>

              {/* Details */}
              <div className="p-6 sm:p-10 lg:col-span-5 flex flex-col justify-between">
                <div className="space-y-4">
                  {/* Meta items */}
                  <div className="flex items-center gap-4 text-xs text-muted font-poppins">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {featuredPost.publishedAt}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {featuredPost.readTime}
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
                      {featuredPost.author.avatar}
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-dark">{featuredPost.author.name}</h4>
                      <p className="text-[10px] text-muted">{featuredPost.author.role}</p>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 text-xs font-bold text-navy group-hover:text-gold transition-colors font-poppins">
                    Read Article
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Regular Posts Grid */}
        {gridPosts.length === 0 ? (
          <div className="bg-white rounded-card-lg border border-border p-12 text-center shadow-card">
            <BookOpen className="w-10 h-10 text-gold mx-auto mb-3 opacity-40" />
            <p className="text-paragraph text-sm font-poppins">No articles found matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {gridPosts.map((post) => (
              <article
                key={post.id}
                className="bg-white rounded-card border border-border overflow-hidden shadow-card card-hover flex flex-col justify-between group"
              >
                <div>
                  {/* Image container */}
                  <div className="relative h-48 w-full bg-cream/50 overflow-hidden">
                    <Image
                      src={post.image}
                      alt={post.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute left-3 top-3 bg-gold text-navy text-[9px] uppercase font-bold tracking-wider px-2.5 py-1.5 rounded-full shadow-sm">
                      {post.categoryLabel}
                    </span>
                  </div>

                  {/* Details content */}
                  <div className="p-5 space-y-3">
                    <div className="flex items-center gap-3 text-[10px] text-muted font-poppins">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {post.publishedAt}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {post.readTime}
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
                      {post.author.avatar}
                    </div>
                    <div>
                      <h4 className="text-[11px] font-semibold text-dark leading-none">{post.author.name}</h4>
                      <p className="text-[9px] text-muted">{post.author.role}</p>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-navy group-hover:text-gold transition-colors font-poppins">
                    Read
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
