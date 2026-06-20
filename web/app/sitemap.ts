import type { MetadataRoute } from "next";

const baseUrl = "https://whiskora.pet";

const publicRoutes = [
  { path: "/th", priority: 1, changeFrequency: "weekly" },
  { path: "/th/pet-id-card", priority: 0.95, changeFrequency: "weekly" },
  { path: "/th/farm-hub", priority: 0.95, changeFrequency: "daily" },
  { path: "/th/pet-knowledge", priority: 0.85, changeFrequency: "weekly" },
  { path: "/th/pet-tools", priority: 0.8, changeFrequency: "monthly" },
  { path: "/th/marketplace", priority: 0.8, changeFrequency: "daily" },
  { path: "/th/service-hub", priority: 0.8, changeFrequency: "daily" },
  { path: "/th/community", priority: 0.75, changeFrequency: "daily" },
  { path: "/th/partner", priority: 0.7, changeFrequency: "monthly" },
  { path: "/th/about", priority: 0.65, changeFrequency: "monthly" },
  { path: "/th/privacy", priority: 0.35, changeFrequency: "yearly" },
  { path: "/en", priority: 0.6, changeFrequency: "monthly" },
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return publicRoutes.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
