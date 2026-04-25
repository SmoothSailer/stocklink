import type { Metadata } from "next";
import Link from "next/link";
import { getProductById, getWaitlistStatus } from "../../actions";
import ProductDetailClient from "./product-detail-client";
import { ProductJsonLd, BreadcrumbJsonLd } from "@/components/seo/json-ld";

export const dynamic = "force-dynamic";
import { CURRENCY } from "@/lib/constants";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://ristoka.com";

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    return { title: "Product Not Found" };
  }

  const title = `${product.name} — ${CURRENCY} ${product.price}/${product.unit}`;
  const description =
    product.description ??
    `Buy ${product.name} wholesale at ${CURRENCY} ${product.price} per ${product.unit}. ${product.stock > 0 ? "In stock" : "Out of stock"} on Ristoka.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      ...(product.image_url ? { images: [{ url: product.image_url, alt: product.name }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(product.image_url ? { images: [product.image_url] } : {}),
    },
  };
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

  const waitlistStatus = product.is_coming_soon
    ? await getWaitlistStatus(product.id)
    : null;

  return (
    <>
      <ProductJsonLd product={product} />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: siteUrl },
          { name: "Products", url: `${siteUrl}/products` },
          { name: product.name, url: `${siteUrl}/products/${product.id}` },
        ]}
      />
      <ProductDetailClient product={product} waitlistStatus={waitlistStatus} />
    </>
  );
}
