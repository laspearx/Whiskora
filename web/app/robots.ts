import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://whiskora.pet";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/auth/",
          "/th/auth/",
          "/en/auth/",
          "/profile/",
          "/th/profile/",
          "/en/profile/",
          "/farm-dashboard/",
          "/th/farm-dashboard/",
          "/en/farm-dashboard/",
          "/service-dashboard/",
          "/th/service-dashboard/",
          "/en/service-dashboard/",
          "/shop-dashboard/",
          "/th/shop-dashboard/",
          "/en/shop-dashboard/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
