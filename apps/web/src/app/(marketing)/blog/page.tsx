import type { Metadata } from "next";
import { BlogIndex } from "@/features/blog/BlogIndex";
import { fetchPublishedPosts } from "@/lib/blog/blog";

export const metadata: Metadata = {
  title: "Insights | Time Space & Planets",
  description: "Vedic astrology, Vastu, planetary transits and remedies — writings from Dr. Pradeep Sharma and Time Space & Planets.",
};

export default async function BlogPage() {
  const posts = await fetchPublishedPosts();
  return <BlogIndex posts={posts} />;
}
