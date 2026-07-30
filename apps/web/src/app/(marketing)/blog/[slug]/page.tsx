import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Calendar, Clock, User, Sparkles } from "lucide-react";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
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
    author: { name: "Acharya Kumar", avatar: "AK", role: "Lead Vedic Astrologer" }
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
    author: { name: "Dr. Priya Sharma", avatar: "PS", role: "Relationship Consultant" }
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
    author: { name: "Acharya Guru", avatar: "AG", role: "Gemologist Expert" }
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
    author: { name: "Acharya Kumar", avatar: "AK", role: "Lead Vedic Astrologer" }
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
    author: { name: "Astro Ananya", avatar: "AA", role: "Vastu Shastra Guide" }
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
    author: { name: "Dr. Priya Sharma", avatar: "PS", role: "Relationship Consultant" }
  }
];

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);

  if (!post) {
    return { title: "Article Not Found | TSP Blog" };
  }

  return {
    title: `${post.title} | TSP Blog`,
    description: post.excerpt,
  };
}

export default async function BlogArticlePage({ params }: Props) {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Hero with Image */}
      <section className="bg-gradient-navy text-white pt-[125px] pb-0 lg:pt-[140px] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gold via-transparent to-transparent" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pb-12">
          {/* Back link */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-gold transition-colors font-poppins mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Link>

          {/* Category badge */}
          <span className="inline-block bg-gold text-navy text-[10px] uppercase font-bold tracking-wider px-3 py-1.5 rounded-full shadow-sm mb-5">
            {post.categoryLabel}
          </span>

          <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-5 text-white leading-tight">
            {post.title}
          </h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-5 text-sm text-white/60 font-poppins">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {post.publishedAt}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {post.readTime}
            </span>
            <span className="flex items-center gap-1.5">
              <User className="w-4 h-4" />
              {post.author.name}
            </span>
          </div>
        </div>
      </section>

      {/* Cover Image */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-1">
        <div className="relative h-64 sm:h-80 md:h-96 rounded-2xl overflow-hidden shadow-card-hover border border-border">
          <Image
            src={post.image}
            alt={post.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      </div>

      {/* Article Body */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Excerpt */}
        <p className="text-paragraph text-base leading-relaxed mb-10 font-inter">
          {post.excerpt}
        </p>

        {/* Coming Soon Notice */}
        <div className="bg-white rounded-2xl border border-border p-10 shadow-card text-center">
          <Sparkles className="w-10 h-10 text-gold mx-auto mb-4 opacity-60" />
          <h2 className="font-heading text-xl font-bold text-dark mb-3">
            Full Article Coming Soon
          </h2>
          <p className="text-sm text-paragraph max-w-md mx-auto mb-6 leading-relaxed">
            Our team of Vedic scholars and astrologers is crafting this article
            with deep research and authentic insights. Check back soon for the complete read.
          </p>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#C8A04A] to-[#A6832E] text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:from-[#D4AC5A] hover:to-[#B8933E] shadow-[0_2px_16px_rgba(200,160,74,0.20)] hover:shadow-[0_4px_24px_rgba(200,160,74,0.30)] transition-all duration-300 font-poppins"
          >
            Explore Other Articles
          </Link>
        </div>

        {/* Author Card */}
        <div className="mt-10 bg-white rounded-2xl border border-border p-6 shadow-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-navy text-white flex items-center justify-center text-sm font-bold font-poppins shrink-0">
            {post.author.avatar}
          </div>
          <div>
            <h4 className="text-sm font-bold text-dark font-heading">{post.author.name}</h4>
            <p className="text-xs text-muted font-poppins">{post.author.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
