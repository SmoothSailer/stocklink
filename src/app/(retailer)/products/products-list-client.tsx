"use client";

import { useState, useMemo } from "react";
import { SearchBar } from "@/components/shared/search-bar";
import { ProductCard } from "@/components/retailer/product-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, X } from "lucide-react";
import type { Product, Category } from "@/types/database";

interface ProductsListClientProps {
  products: Product[];
  categories: Category[];
  initialCategory?: string;
  initialSearch?: string;
}

export default function ProductsListClient({ products, categories, initialCategory, initialSearch }: ProductsListClientProps) {
  const [search, setSearch] = useState(initialSearch ?? "");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory ?? null);
  const [showInStockOnly, setShowInStockOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        !search || p.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        !selectedCategory || p.category === selectedCategory;
      const matchesStock = !showInStockOnly || p.stock > 0;
      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, search, selectedCategory, showInStockOnly]);

  const activeFilters =
    (selectedCategory ? 1 : 0) + (showInStockOnly ? 1 : 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Products</h1>
          <p className="text-sm text-muted-foreground">
            {filteredProducts.length} products available
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeFilters > 0 && (
            <Badge className="ml-1 h-5 w-5 rounded-full bg-primary p-0 text-[10px] text-primary-foreground">
              {activeFilters}
            </Badge>
          )}
        </Button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <SearchBar value={search} onChange={setSearch} />
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="mb-4 space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm">
          {/* Category filter */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Category
            </p>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <Badge
                  key={cat.slug}
                  variant={
                    selectedCategory === cat.slug ? "default" : "outline"
                  }
                  className="cursor-pointer px-3 py-1.5 text-xs"
                  onClick={() =>
                    setSelectedCategory(
                      selectedCategory === cat.slug ? null : cat.slug
                    )
                  }
                >
                  {cat.icon} {cat.name}
                </Badge>
              ))}
            </div>
          </div>

          {/* Stock filter */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              In stock only
            </span>
            <Button
              variant={showInStockOnly ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setShowInStockOnly(!showInStockOnly)}
            >
              {showInStockOnly ? "On" : "Off"}
            </Button>
          </div>

          {/* Clear */}
          {activeFilters > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-xs text-muted-foreground"
              onClick={() => {
                setSelectedCategory(null);
                setShowInStockOnly(false);
              }}
            >
              <X className="h-3 w-3" />
              Clear all filters
            </Button>
          )}
        </div>
      )}

      {/* Product grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="text-5xl">🔍</span>
          <p className="mt-3 text-lg font-semibold">No products found</p>
          <p className="text-sm text-muted-foreground">
            Try adjusting your search or filters
          </p>
        </div>
      )}
    </div>
  );
}
