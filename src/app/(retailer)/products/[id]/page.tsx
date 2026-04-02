"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Truck,
  Shield,
  Share2,
  Package,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { WhatsAppButton } from "@/components/shared/whatsapp-button";
import { QuantitySelector } from "@/components/retailer/quantity-selector";
import { mockProducts, mockWholesalers } from "@/lib/mock-data";
import { formatPrice, getStockInfo, buildWhatsAppLink } from "@/lib/utils";

export default function ProductDetailPage() {
  const params = useParams();
  const product = mockProducts.find((p) => p.id === params.id);
  const moq = product?.min_order_qty ?? 1;
  const [quantity, setQuantity] = useState(moq);

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

  const wholesaler = mockWholesalers.find(
    (w) => w.id === product.wholesaler_id
  );
  const stockInfo = getStockInfo(product.stock, product.unit);
  const displayPrice =
    product.is_flash_deal && product.flash_deal_price
      ? product.flash_deal_price
      : product.price;
  const totalPrice = displayPrice * quantity;

  const orderMessage = `🛒 *Bulk Order from StockLink*\n\n📦 Product: ${product.name}\n📊 Quantity: ${quantity} ${product.unit}s\n💰 Unit Price: KSh ${displayPrice.toLocaleString()} per ${product.unit}\n💵 Total: KSh ${totalPrice.toLocaleString()}\n📦 Min Order: ${moq} ${product.unit}s\n\nPlease confirm availability and delivery.`;

  const shareMessage = `Check out ${product.name} on StockLink!\n\nWholesale Price: KSh ${displayPrice.toLocaleString()} per ${product.unit}\nMin Order: ${moq} ${product.unit}s\n${product.stock > 0 ? "✅ In Stock" : "❌ Out of Stock"}`;

  return (
    <div className="mx-auto max-w-3xl">
      {/* Back button */}
      <div className="px-4 py-3">
        <Link
          href="/products"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to products
        </Link>
      </div>

      {/* Product image */}
      <div className="relative flex h-64 items-center justify-center bg-gradient-to-br from-muted to-muted/60 sm:h-80">
        <span className="text-7xl">
          {product.category === "rice" && "🍚"}
          {product.category === "oil" && "🫒"}
          {product.category === "sugar" && "🍬"}
          {product.category === "flour" && "🌾"}
          {product.category === "lpg" && "🔥"}
          {product.category === "beverages" && "🥤"}
          {product.category === "dairy" && "🥛"}
          {product.category === "cleaning" && "🧴"}
        </span>

        {product.is_flash_deal && (
          <Badge className="absolute left-4 top-4 bg-accent text-accent-foreground">
            ⚡ Bulk Deal
          </Badge>
        )}
        {product.is_trending && !product.is_flash_deal && (
          <Badge className="absolute left-4 top-4 bg-primary text-primary-foreground">
            🔥 Trending
          </Badge>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 rounded-full bg-card/80 backdrop-blur-sm"
          onClick={() =>
            window.open(buildWhatsAppLink(shareMessage), "_blank")
          }
        >
          <Share2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Product details */}
      <div className="space-y-4 px-4 py-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">{product.name}</h1>
          <div className="mt-2 flex items-center gap-3">
            <span className="text-2xl font-bold text-primary">
              {formatPrice(displayPrice)}
            </span>
            {product.is_flash_deal && product.flash_deal_price && (
              <span className="text-base text-muted-foreground line-through">
                {formatPrice(product.price)}
              </span>
            )}
            <span className="text-sm text-muted-foreground">
              per {product.unit}
            </span>
          </div>
        </div>

        {/* Stock, MOQ & Location */}
        <div className="flex flex-wrap gap-2">
          <Badge variant={stockInfo.variant}>{stockInfo.label}</Badge>
          <Badge variant="outline" className="gap-1">
            <Package className="h-3 w-3" />
            Min. {moq} {product.unit}s
          </Badge>
          {product.location && (
            <Badge variant="outline" className="gap-1">
              <MapPin className="h-3 w-3" />
              {product.location}
            </Badge>
          )}
        </div>

        {/* Description */}
        {product.description && (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {product.description}
          </p>
        )}

        <Separator />

        {/* Trust indicators */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-border/60">
            <CardContent className="flex items-center gap-2 p-3">
              <Truck className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs font-semibold">Fast Delivery</p>
                <p className="text-[10px] text-muted-foreground">
                  Same-day available
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardContent className="flex items-center gap-2 p-3">
              <Shield className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs font-semibold">Verified Supplier</p>
                <p className="text-[10px] text-muted-foreground">
                  {wholesaler?.name ?? "Quality assured"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Quantity selector */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Quantity ({product.unit}s)</p>
            <p className="text-xs text-muted-foreground">
              Total: {formatPrice(totalPrice)}
            </p>
            <p className="text-[10px] text-muted-foreground">
              Minimum order: {moq} {product.unit}s
            </p>
          </div>
          <QuantitySelector
            value={quantity}
            onChange={setQuantity}
            min={moq}
            max={product.stock > 0 ? product.stock : moq}
          />
        </div>

        {/* CTA */}
        <div className="fixed bottom-16 left-0 right-0 z-30 border-t border-border bg-card p-4 shadow-lg md:static md:border-0 md:bg-transparent md:p-0 md:shadow-none">
          <div className="mx-auto flex max-w-3xl items-center gap-3">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-lg font-bold text-primary">
                {formatPrice(totalPrice)}
              </p>
            </div>
            <WhatsAppButton
              message={orderMessage}
              label="Order via WhatsApp"
              size="lg"
              className="flex-1"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
