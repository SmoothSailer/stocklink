import Link from "next/link";
import { getProductById } from "../../actions";
import OrderConfirmClient from "./order-confirm-client";

interface OrderConfirmPageProps {
  searchParams: Promise<{ product?: string; qty?: string }>;
}

export default async function OrderConfirmPage({ searchParams }: OrderConfirmPageProps) {
  const { product: productId, qty } = await searchParams;

  if (!productId) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <span className="text-5xl">🛒</span>
        <p className="mt-3 text-lg font-semibold">No product selected</p>
        <Link href="/products" className="mt-2 text-sm text-primary hover:underline">
          Browse products
        </Link>
      </div>
    );
  }

  const product = await getProductById(productId);

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <span className="text-5xl">📦</span>
        <p className="mt-3 text-lg font-semibold">Product not found</p>
        <Link href="/products" className="mt-2 text-sm text-primary hover:underline">
          Browse products
        </Link>
      </div>
    );
  }

  const quantity = qty ? parseInt(qty, 10) : undefined;

  return <OrderConfirmClient product={product} quantity={quantity || undefined} />;
}
