import type { Metadata } from "next";
import { getPublicProducts, getCategories } from "../actions";
import ProductsListClient from "./products-list-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Wholesale Products — Browse & Order",
  description:
    "Browse wholesale products from verified suppliers in Kenya. Compare prices on rice, sugar, oil, flour, LPG, and more. Order via WhatsApp with real-time stock visibility.",
  openGraph: {
    title: "Wholesale Products — Browse & Order",
    description:
      "Browse wholesale products from verified suppliers in Kenya. Compare prices and order via WhatsApp.",
  },
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const { category, q } = await searchParams;
  const [products, categories] = await Promise.all([
    getPublicProducts(),
    getCategories(),
  ]);

  return <ProductsListClient products={products} categories={categories} initialCategory={category} initialSearch={q} />;
}
