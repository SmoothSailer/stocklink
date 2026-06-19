"use client";

import Link from "next/link";
import Image from "next/image";
import { MapPin, Package, Factory, Layers, Users, ShoppingCart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Product, ProductUnitOption, ProductMedia } from "@/types/database";
import { formatPrice, getStockInfo, getCategoryIcon } from "@/lib/utils";
import { useCart } from "@/hooks/use-cart";

interface ProductCardProps {
  product: Product & {
    manufacturers?: { id: string; name: string } | null;
    product_unit_options?: ProductUnitOption[];
    product_media?: ProductMedia[];
    product_waitlist?: { count: number }[];
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const stockInfo = getStockInfo(product.stock, product.unit);
  const waitlistCount = product.product_waitlist?.[0]?.count ?? 0;
  const displayPrice = product.is_flash_deal && product.flash_deal_price
    ? product.flash_deal_price
    : product.price;
  const originalPrice = product.is_flash_deal && product.flash_deal_price
    ? product.price
    : undefined;
  const coverImage = product.product_media?.sort((a, b) => a.sort_order - b.sort_order).find((m) => m.type === "image")?.url
    ?? product.image_url;

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      unit: product.unit,
      quantity: product.min_order_qty ?? 1,
      minOrderQty: product.min_order_qty ?? 1,
      maxStock: product.stock,
      imageUrl: product.image_url,
      category: product.category,
      piecesPerUnit: product.pieces_per_unit,
      wholesalePrice: product.is_flash_deal && product.flash_deal_price
        ? product.flash_deal_price
        : undefined,
    });
  }

  return (
    <Link href={`/products/${product.id}`}>
      <Card className="group relative overflow-hidden border-border/60 transition-all hover:shadow-md">
        {/* Image area */}
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {coverImage ? (
            <Image
              src={coverImage}
              alt={product.name}
              fill
              className="object-contain p-1 transition-transform group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-muted to-muted/60">
              <span className="text-4xl">
                {getCategoryIcon(product.category)}
              </span>
            </div>
          )}

          {/* Coming Soon badge */}
          {product.is_coming_soon && (
            <Badge className="absolute left-2 top-2 bg-amber-500 text-white shadow-sm">
              🕐 Coming Soon
            </Badge>
          )}

          {/* Flash deal badge */}
          {product.is_flash_deal && !product.is_coming_soon && (
            <Badge className="absolute left-2 top-2 bg-accent text-accent-foreground shadow-sm">
              ⚡ Bulk Deal
            </Badge>
          )}

          {/* Trending badge */}
          {product.is_trending && !product.is_flash_deal && !product.is_coming_soon && (
            <Badge className="absolute left-2 top-2 bg-primary text-primary-foreground shadow-sm">
              🔥 Trending
            </Badge>
          )}

          {/* Quick add-to-cart button */}
          {!product.is_coming_soon && product.stock > 0 && (
            <Button
              size="icon"
              variant="secondary"
              className="absolute bottom-2 right-2 h-8 w-8 rounded-full opacity-0 shadow-md transition-opacity group-hover:opacity-100"
              onClick={handleAddToCart}
              aria-label={`Add ${product.name} to cart`}
            >
              <ShoppingCart className="h-4 w-4" />
            </Button>
          )}
        </div>

        <CardContent className="p-3">
          {/* Product name */}
          <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-foreground group-hover:text-primary">
            {product.name}
          </h3>

          {/* Price per unit */}
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-base font-bold text-primary">
              {formatPrice(displayPrice)}
            </span>
            <span className="text-[10px] text-muted-foreground">
              /{product.unit}
            </span>
            {product.is_flash_deal && product.flash_deal_price && (
              <span className="text-xs text-muted-foreground line-through">
                {formatPrice(originalPrice ?? 0)}
              </span>
            )}
          </div>

          {/* MOQ badge */}
          <div className="mt-1.5 flex items-center gap-1">
            <Package className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] font-medium text-muted-foreground">
              Min. {product.min_order_qty} {product.unit}s
            </span>
            {(product.product_unit_options?.length ?? 0) > 0 && (
              <Badge variant="outline" className="ml-auto gap-0.5 px-1 py-0 text-[9px]">
                <Layers className="h-2.5 w-2.5" />
                {product.product_unit_options!.length + 1} units
              </Badge>
            )}
          </div>

          {/* Manufacturer */}
          {product.manufacturers?.name && (
            <div className="mt-1 flex items-center gap-1">
              <Factory className="h-3 w-3 text-muted-foreground" />
              <span className="truncate text-[10px] text-muted-foreground">
                {product.manufacturers.name}
              </span>
            </div>
          )}

          {/* Stock badge + location */}
          <div className="mt-2 flex items-center justify-between">
            {product.is_coming_soon ? (
              <div className="flex items-center gap-1.5">
                <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 border-amber-400 text-amber-600">
                  Join Waitlist
                </Badge>
                {waitlistCount > 0 && (
                  <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                    <Users className="h-3 w-3" />
                    {waitlistCount} waiting
                  </span>
                )}
              </div>
            ) : (
              <Badge variant={stockInfo.variant} className="text-[10px] px-1.5 py-0.5">
                {stockInfo.label}
              </Badge>
            )}
            {product.location && (
              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {product.location.split(",")[0]}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
