import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

const baseUrl = "https://whiskora.pet";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Capped so a very large catalog can't blow up sitemap generation time —
// this is a nice-to-have crawl aid, not a hard requirement.
const DYNAMIC_ROUTE_LIMIT = 500;

async function getDynamicRoutes(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const [{ data: farms }, { data: pets }] = await Promise.all([
    supabase.from("farms").select("id").limit(DYNAMIC_ROUTE_LIMIT),
    supabase.from("pets").select("id").eq("is_public", true).limit(DYNAMIC_ROUTE_LIMIT),
  ]);

  const now = new Date();
  return [
    ...(farms ?? []).map((f) => ({ url: `${baseUrl}/th/farm/${f.id}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.6 })),
    ...(pets ?? []).map((p) => ({ url: `${baseUrl}/th/p/${p.id}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.5 })),
  ];
}

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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes = publicRoutes.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  // Dynamic farm/pet URLs are best-effort — a Supabase hiccup at build time
  // shouldn't take down the whole sitemap, just fall back to static routes.
  try {
    return [...staticRoutes, ...(await getDynamicRoutes())];
  } catch {
    return staticRoutes;
  }
}
