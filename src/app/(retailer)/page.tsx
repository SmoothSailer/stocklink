import { Suspense } from "react";
import { SearchBar } from "@/components/shared/search-bar";
import { CategoryGrid } from "@/components/retailer/category-grid";
import { ProductCard } from "@/components/retailer/product-card";
import { FlashDealCard } from "@/components/retailer/flash-deal-card";

export const dynamic = "force-dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { getTrendingProducts, getFlashDeals, getBulkStockProducts, getCategories } from "./actions";
import { ChevronRight, Flame, Zap, MapPin } from "lucide-react";
import Link from "next/link";

function SectionHeader({
  icon: Icon,
  title,
  href,
}: {
  icon: React.ElementType;
  title: string;
  href: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
      </div>
      <Link
        href={href}
        className="flex items-center gap-0.5 text-sm font-medium text-primary hover:underline"
      >
        See all
        <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="aspect-square w-full rounded-lg" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export default async function HomePage() {
  const [trendingProducts, flashDeals, nearbyProducts, categories] = await Promise.all([
    getTrendingProducts(),
    getFlashDeals(),
    getBulkStockProducts(4),
    getCategories(),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-4">
      {/* Hero search area */}
      <div className="space-y-1">
        <h1 className="text-xl font-bold text-foreground">
          Welcome to <span className="text-primary">Ristoka</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Wholesale prices for retailers — buy in bulk, save more
        </p>
      </div>

      <SearchBar />

      {/* Categories */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Categories
        </h2>
        <CategoryGrid categories={categories} />
      </section>

      {/* Flash Deals */}
      {flashDeals.length > 0 && (
        <section className="space-y-3">
          <SectionHeader icon={Zap} title="Flash Deals" href="/deals" />
          <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-none">
            {flashDeals.map((product) => (
              <FlashDealCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* Trending Products */}
      <section className="space-y-3">
        <SectionHeader
          icon={Flame}
          title="Trending Products"
          href="/products?filter=trending"
        />
        <Suspense fallback={<ProductGridSkeleton />}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {trendingProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </Suspense>
      </section>

      {/* Nearby Stock */}
      <section className="space-y-3">
        <SectionHeader
          icon={MapPin}
          title="Bulk Stock Available"
          href="/products"
        />
        <Suspense fallback={<ProductGridSkeleton />}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {nearbyProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </Suspense>
      </section>
    </div>
  );
}
