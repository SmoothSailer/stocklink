import type { Metadata } from "next";
import { getFlashDeals, getTrendingProducts } from "../actions";
import DealsClient from "./deals-client";

export const metadata: Metadata = {
  title: "Deals & Flash Sales — Wholesale Discounts",
  description:
    "Discover flash deals and trending wholesale products at discounted prices. Limited-time offers on rice, sugar, oil, flour and more. Share deals via WhatsApp.",
  openGraph: {
    title: "Deals & Flash Sales — Wholesale Discounts",
    description:
      "Flash deals and trending wholesale products at discounted prices. Limited-time offers you don't want to miss.",
  },
};

export default async function DealsPage() {
  const [flashDeals, trendingProducts] = await Promise.all([
    getFlashDeals(),
    getTrendingProducts(),
  ]);

  return (
    <DealsClient flashDeals={flashDeals} trendingProducts={trendingProducts} />
  );
}
