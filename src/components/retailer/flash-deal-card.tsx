"use client";

import { Share2, Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Product } from "@/types/database";
import { formatPrice, getCountdown, buildWhatsAppLink } from "@/lib/utils";
import Link from "next/link";

interface FlashDealCardProps {
  product: Product;
}

export function FlashDealCard({ product }: FlashDealCardProps) {
  const dealPrice = product.flash_deal_price ?? product.price;
  const savings = product.price - dealPrice;
  const countdown = product.flash_deal_expires_at
    ? getCountdown(product.flash_deal_expires_at)
    : null;

  const shareMessage = `🔥 Bulk Deal on ${product.name}!\n\nWas: KSh ${product.price.toLocaleString()} per ${product.unit}\nNow: KSh ${dealPrice.toLocaleString()} per ${product.unit}\nSave: KSh ${savings.toLocaleString()} per unit\nMin Order: ${product.min_order_qty ?? 1} ${product.unit}s\n\nOrder in bulk on StockLink!`;

  const handleShare = () => {
    const url = buildWhatsAppLink(shareMessage);
    window.open(url, "_blank");
  };

  return (
    <Card className="min-w-[240px] overflow-hidden border-accent/30 bg-gradient-to-br from-orange-50 to-white snap-start">
      <Link href={`/products/${product.id}`}>
        <div className="relative flex h-28 items-center justify-center bg-gradient-to-br from-accent/10 to-accent/5">
          <span className="text-5xl">
            {product.category === "rice" && "🍚"}
            {product.category === "oil" && "🫒"}
            {product.category === "sugar" && "🍬"}
            {product.category === "flour" && "🌾"}
            {product.category === "lpg" && "🔥"}
            {product.category === "beverages" && "🥤"}
            {product.category === "dairy" && "🥛"}
            {product.category === "cleaning" && "🧴"}
          </span>
          {countdown && (
            <Badge className="absolute right-2 top-2 bg-accent text-accent-foreground animate-pulse">
              ⏰ {countdown}
            </Badge>
          )}
        </div>
      </Link>

      <CardContent className="p-3">
        <h4 className="line-clamp-1 text-sm font-semibold text-foreground">
          {product.name}
        </h4>

        <div className="mt-1 flex items-center gap-2">
          <span className="text-lg font-bold text-accent">
            {formatPrice(dealPrice)}
          </span>
          <span className="text-xs text-muted-foreground line-through">
            {formatPrice(product.price)}
          </span>
          <span className="text-[10px] text-muted-foreground">
            /{product.unit}
          </span>
        </div>

        <div className="mt-1 flex flex-wrap gap-1">
          <Badge variant="secondary" className="text-[10px] bg-green-50 text-green-700">
            Save {formatPrice(savings)}/unit
          </Badge>
          {product.min_order_qty && (
            <Badge variant="outline" className="text-[10px] gap-0.5">
              <Package className="h-2.5 w-2.5" />
              Min. {product.min_order_qty}
            </Badge>
          )}
        </div>

        <Button
          onClick={handleShare}
          size="sm"
          variant="ghost"
          className="mt-2 h-8 w-full gap-1.5 text-xs text-muted-foreground hover:text-accent"
        >
          <Share2 className="h-3.5 w-3.5" />
          Share Deal
        </Button>
      </CardContent>
    </Card>
  );
}
