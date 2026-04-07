import type { Metadata } from "next";
import { getPublicProducts } from "../actions";
import ProductsListClient from "./products-list-client";

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

export default async function ProductsPage() {
  const products = await getPublicProducts();

  return <ProductsListClient products={products} />;
}
