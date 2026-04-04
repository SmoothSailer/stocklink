import { getFlashDeals, getTrendingProducts } from "../actions";
import DealsClient from "./deals-client";

export default async function DealsPage() {
  const [flashDeals, trendingProducts] = await Promise.all([
    getFlashDeals(),
    getTrendingProducts(),
  ]);

  return (
    <DealsClient flashDeals={flashDeals} trendingProducts={trendingProducts} />
  );
}
