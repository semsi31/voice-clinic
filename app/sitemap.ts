import type { MetadataRoute } from "next";
import { blogPosts } from "@/app/(site)/blog/blog-posts";
import { getSiteUrl } from "@/lib/site-seo";

const staticRoutes = [
  "/",
  "/kurumsal",
  "/hizmetlerimiz",
  "/isitme-cihazlari",
  "/teknik-servis",
  "/blog",
  "/iletisim",
  "/kvkk-gizlilik",
  "/cerez-politikasi",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getSiteUrl();

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((path) => ({
    url: path === "/" ? baseUrl : `${baseUrl}${path}`,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : path === "/iletisim" || path === "/blog" ? 0.8 : 0.7,
  }));

  const blogEntries: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticEntries, ...blogEntries];
}
