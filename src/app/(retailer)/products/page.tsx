import { getPublicProducts } from "../actions";
import ProductsListClient from "./products-list-client";

export default async function ProductsPage() {
  const products = await getPublicProducts();

  return <ProductsListClient products={products} />;
}
