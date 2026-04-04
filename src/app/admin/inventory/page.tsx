import { getProducts, getWholesalers } from "../actions";
import InventoryClient from "./inventory-client";

export default async function InventoryPage() {
  const [products, wholesalers] = await Promise.all([
    getProducts(),
    getWholesalers(),
  ]);

  return <InventoryClient products={products} wholesalers={wholesalers} />;
}
