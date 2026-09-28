/** Blog data shared by the public pages and the admin editor. */

export interface BlogSummary {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  coverImageUrl: string | null;
  byline: string;
  published: boolean;
  publishedAt: string | null;
  readMinutes: number;
  createdAt: string;
  updatedAt: string;
}

export interface BlogArticle extends BlogSummary {
  content: string;
}

export const BLOG_CATEGORIES = [
  { id: "vedic", label: "Vedic Astrology" },
  { id: "matchmaking", label: "Kundli Matchmaking" },
  { id: "gemstones", label: "Gemstone Remedies" },
  { id: "horoscope", label: "Horoscopes & Vastu" },
] as const;

export const categoryLabel = (id: string) => BLOG_CATEGORIES.find((c) => c.id === id)?.label ?? "Insights";

export const formatBlogDate = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "long", year: "numeric" }).format(new Date(iso)) : "";

const API = (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL !== "undefined"
  ? process.env.NEXT_PUBLIC_API_URL
  : "http://127.0.0.1:3001/api/v1"
).replace(/\/$/, "");

/** Server-side fetches for the public blog (revalidated every minute). */
export async function fetchPublishedPosts(): Promise<BlogSummary[]> {
  try {
    const res = await fetch(`${API}/blogs`, { next: { revalidate: 60 } });
    return res.ok ? ((await res.json()) as BlogSummary[]) : [];
  } catch {
    return [];
  }
}

export async function fetchPost(slug: string): Promise<BlogArticle | null> {
  try {
    const res = await fetch(`${API}/blogs/${encodeURIComponent(slug)}`, { next: { revalidate: 60 } });
    return res.ok ? ((await res.json()) as BlogArticle) : null;
  } catch {
    return null;
  }
}
