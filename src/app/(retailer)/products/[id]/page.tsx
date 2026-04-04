import Link from "next/link";
import { getProductById } from "../../actions";
import ProductDetailClient from "./product-detail-client";

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params;
  const product = await getProductById(id);

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

  return <ProductDetailClient product={product} />;
}
