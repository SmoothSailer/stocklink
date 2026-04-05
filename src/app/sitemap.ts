import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://ristoka.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/products`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/deals`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/signup`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/affiliate/join`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];

  // Dynamic product routes
  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const supabase = await createClient();
    const { data: products } = await supabase
      .from("products")
      .select("id, updated_at")
      .order("updated_at", { ascending: false });

    if (products) {
      productRoutes = products.map((product) => ({
        url: `${siteUrl}/products/${product.id}`,
        lastModified: new Date(product.updated_at),
        changeFrequency: "daily" as const,
        priority: 0.7,
      }));
    }
  } catch {
    // Silently skip dynamic routes if DB is unavailable
  }

  // Dynamic wholesaler routes
  let wholesalerRoutes: MetadataRoute.Sitemap = [];
  try {
    const supabase = await createClient();
    const { data: wholesalers } = await supabase
      .from("wholesalers")
      .select("id, created_at");

    if (wholesalers) {
      wholesalerRoutes = wholesalers.map((w) => ({
        url: `${siteUrl}/wholesaler/${w.id}`,
        lastModified: new Date(w.created_at),
        changeFrequency: "weekly" as const,
        priority: 0.6,
      }));
    }
  } catch {
    // Silently skip dynamic routes if DB is unavailable
  }

  return [...staticRoutes, ...productRoutes, ...wholesalerRoutes];
}
