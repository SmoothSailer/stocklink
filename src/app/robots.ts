import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://ristoka.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/orders/",
          "/orders/confirm",
          "/auth/",
          "/affiliate/dashboard",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
