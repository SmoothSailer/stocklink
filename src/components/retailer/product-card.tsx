import Link from "next/link";
import { MapPin, Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/types/database";
import { formatPrice, getStockInfo, getCategoryIcon } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const stockInfo = getStockInfo(product.stock, product.unit);
  const displayPrice = product.is_flash_deal && product.flash_deal_price
    ? product.flash_deal_price
    : product.price;

  return (
    <Link href={`/products/${product.id}`}>
      <Card className="group overflow-hidden border-border/60 transition-all hover:shadow-md">
        {/* Image area */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-muted to-muted/60">
            <span className="text-4xl">
              {getCategoryIcon(product.category)}
            </span>
          </div>

          {/* Flash deal badge */}
          {product.is_flash_deal && (
            <Badge className="absolute left-2 top-2 bg-accent text-accent-foreground shadow-sm">
              ⚡ Bulk Deal
            </Badge>
          )}

          {/* Trending badge */}
          {product.is_trending && !product.is_flash_deal && (
            <Badge className="absolute left-2 top-2 bg-primary text-primary-foreground shadow-sm">
              🔥 Trending
            </Badge>
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
                {formatPrice(product.price)}
              </span>
            )}
          </div>

          {/* MOQ badge */}
          <div className="mt-1.5 flex items-center gap-1">
            <Package className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] font-medium text-muted-foreground">
              Min. {product.min_order_qty} {product.unit}s
            </span>
          </div>

          {/* Stock badge + location */}
          <div className="mt-2 flex items-center justify-between">
            <Badge variant={stockInfo.variant} className="text-[10px] px-1.5 py-0.5">
              {stockInfo.label}
            </Badge>
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
