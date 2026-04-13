"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  MapPin,
  Truck,
  Shield,
  Share2,
  Package,
  MessageCircle,
  UserCheck,
  Factory,
  ChevronLeft,
  ChevronRight,
  Play,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { QuantitySelector } from "@/components/retailer/quantity-selector";
import { formatPrice, getStockInfo, buildWhatsAppLink, getCategoryIcon } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import type { Product, ProductUnitOption, ProductMedia } from "@/types/database";

interface ProductDetailClientProps {
  product: Product & {
    wholesalers: {
      id: string;
      name: string;
      location: string | null;
      phone: string | null;
      sales_rep_id: string | null;
      sales_reps: {
        id: string;
        name: string;
        phone: string;
        whatsapp_phone: string;
        bio: string | null;
        avatar_url: string | null;
      } | null;
    } | null;
    manufacturers: {
      id: string;
      name: string;
    } | null;
    product_unit_options?: ProductUnitOption[];
    product_media?: ProductMedia[];
  };
}

interface UnitChoice {
  slug: string;
  price: number;
  stock: number;
  moq: number;
  piecesPerUnit?: number | null;
}

export default function ProductDetailClient({ product }: ProductDetailClientProps) {
  const router = useRouter();
  const { user } = useAuth();

  // Build media gallery from product_media or fallback to image_url
  const mediaList = (product.product_media ?? [])
    .sort((a, b) => a.sort_order - b.sort_order);
  if (mediaList.length === 0 && product.image_url) {
    mediaList.push({
      id: "fallback",
      product_id: product.id,
      url: product.image_url,
      type: "image",
      sort_order: 0,
      created_at: "",
    });
  }

  // Build unit choices: default unit + additional unit options
  const unitChoices: UnitChoice[] = [
    { slug: product.unit, price: product.price, stock: product.stock, moq: product.min_order_qty ?? 1, piecesPerUnit: product.pieces_per_unit },
    ...(product.product_unit_options ?? []).map((o) => ({
      slug: o.unit_slug,
      price: o.price,
      stock: o.stock,
      moq: o.min_order_qty,
      piecesPerUnit: o.pieces_per_unit,
    })),
  ];
  const hasMultipleUnits = unitChoices.length > 1;

  const [mediaIdx, setMediaIdx] = useState(0);
  const [selectedUnitIdx, setSelectedUnitIdx] = useState(0);
  const activeUnit = unitChoices[selectedUnitIdx];
  const moq = activeUnit.moq;
  const [quantity, setQuantity] = useState(moq);

  const wholesaler = product.wholesalers;
  const salesRep = wholesaler?.sales_reps ?? null;
  const stockInfo = getStockInfo(activeUnit.stock, activeUnit.slug);
  const displayPrice =
    product.is_flash_deal && product.flash_deal_price && selectedUnitIdx === 0
      ? product.flash_deal_price
      : activeUnit.price;
  const totalPrice = displayPrice * quantity;

  function handleOrderClick() {
    if (!user) {
      const returnUrl = `/products/${product.id}?qty=${quantity}&unit=${selectedUnitIdx}`;
      router.push("/login?next=" + encodeURIComponent(returnUrl));
      return;
    }
    const params = new URLSearchParams({
      product: product.id,
      qty: String(quantity),
      unit: activeUnit.slug,
      unitPrice: String(displayPrice),
    });
    router.push(`/orders/confirm?${params.toString()}`);
  }

  const shareMessage = `Check out ${product.name} on Ristoka!\n\nWholesale Price: KSh ${displayPrice.toLocaleString()} per ${activeUnit.slug}\nMin Order: ${moq} ${activeUnit.slug}s\n${activeUnit.stock > 0 ? "✅ In Stock" : "❌ Out of Stock"}`;

  function handleUnitChange(idx: number) {
    setSelectedUnitIdx(idx);
    setQuantity(unitChoices[idx].moq);
  }
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

      {/* Product media gallery */}
      <div className="relative h-64 bg-muted sm:h-80">
        {mediaList.length > 0 ? (
          <>
            {mediaList[mediaIdx].type === "video" ? (
              <video
                key={mediaList[mediaIdx].url}
                src={mediaList[mediaIdx].url}
                controls
                playsInline
                className="h-full w-full object-contain bg-black"
              />
            ) : (
              <Image
                key={mediaList[mediaIdx].url}
                src={mediaList[mediaIdx].url}
                alt={product.name}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 768px"
                priority={mediaIdx === 0}
              />
            )}
            {/* Gallery navigation arrows */}
            {mediaList.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-card/80 backdrop-blur-sm"
                  onClick={() => setMediaIdx((prev) => (prev === 0 ? mediaList.length - 1 : prev - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-14 top-1/2 -translate-y-1/2 rounded-full bg-card/80 backdrop-blur-sm"
                  onClick={() => setMediaIdx((prev) => (prev === mediaList.length - 1 ? 0 : prev + 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                {/* Dots indicator */}
                <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                  {mediaList.map((m, i) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMediaIdx(i)}
                      className={`h-2 w-2 rounded-full transition-colors ${
                        i === mediaIdx ? "bg-primary" : "bg-card/60"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-7xl">
              {getCategoryIcon(product.category)}
            </span>
          </div>
        )}

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
              per {activeUnit.slug}
            </span>
          </div>
        </div>

        {/* Unit selector (when multiple units available) */}
        {hasMultipleUnits && (
          <div className="space-y-2">
            <p className="text-sm font-semibold">Select Unit</p>
            <div className="flex flex-wrap gap-2">
              {unitChoices.map((uc, idx) => (
                <button
                  key={uc.slug}
                  type="button"
                  onClick={() => handleUnitChange(idx)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    selectedUnitIdx === idx
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-foreground hover:border-primary/40"
                  }`}
                >
                  <span className="capitalize">{uc.slug}</span>
                  <span className="ml-1.5 text-xs text-muted-foreground">
                    {formatPrice(uc.price)}
                  </span>
                  {uc.piecesPerUnit && (
                    <span className="ml-1 text-[10px] text-muted-foreground">
                      ({uc.piecesPerUnit}pcs)
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Stock, MOQ, Manufacturer & Location */}
        <div className="flex flex-wrap gap-2">
          <Badge variant={stockInfo.variant}>{stockInfo.label}</Badge>
          <Badge variant="outline" className="gap-1">
            <Package className="h-3 w-3" />
            Min. {moq} {activeUnit.slug}s
          </Badge>
          {activeUnit.piecesPerUnit && (
            <Badge variant="outline" className="gap-1">
              <Package className="h-3 w-3" />
              {activeUnit.piecesPerUnit} pcs per {activeUnit.slug}
            </Badge>
          )}
          {product.manufacturers?.name && (
            <Badge variant="outline" className="gap-1">
              <Factory className="h-3 w-3" />
              {product.manufacturers.name}
            </Badge>
          )}
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

        {/* Sales rep card */}
        {salesRep && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="flex items-center gap-3 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {salesRep.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1">
                  <UserCheck className="h-3.5 w-3.5 text-primary" />
                  <p className="text-xs font-semibold text-primary">Your Sales Rep</p>
                </div>
                <p className="text-sm font-medium">{salesRep.name}</p>
                {salesRep.bio && (
                  <p className="text-[10px] text-muted-foreground line-clamp-1">{salesRep.bio}</p>
                )}
              </div>
              <a
                href={buildWhatsAppLink(`Hi ${salesRep.name}! 👋 I have a question about ${product.name}.`, salesRep.whatsapp_phone)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#25D366] text-white shadow-sm hover:bg-[#128C7E] transition-colors"
                aria-label={`Chat with ${salesRep.name}`}
              >
                <MessageCircle className="h-4 w-4" />
              </a>
            </CardContent>
          </Card>
        )}

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
            <p className="text-sm font-semibold">Quantity ({activeUnit.slug}s)</p>
            <p className="text-xs text-muted-foreground">
              Total: {formatPrice(totalPrice)}
            </p>
            <p className="text-[10px] text-muted-foreground">
              Minimum order: {moq} {activeUnit.slug}s
            </p>
          </div>
          <QuantitySelector
            value={quantity}
            onChange={setQuantity}
            min={moq}
            max={activeUnit.stock > 0 ? activeUnit.stock : moq}
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
            <Button
              size="lg"
              className="flex-1 gap-2 bg-[#25D366] font-semibold text-white shadow-md hover:bg-[#128C7E]"
              onClick={handleOrderClick}
            >
              <MessageCircle className="h-5 w-5" />
              {salesRep ? `Order with ${salesRep.name.split(" ")[0]}` : "Order via WhatsApp"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
