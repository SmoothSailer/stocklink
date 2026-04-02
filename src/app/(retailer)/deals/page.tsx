"use client";

import { Share2, Flame, Zap, Bell } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FlashDealCard } from "@/components/retailer/flash-deal-card";
import { ProductCard } from "@/components/retailer/product-card";
import { mockProducts } from "@/lib/mock-data";
import { buildWhatsAppLink } from "@/lib/utils";

export default function DealsPage() {
  const flashDeals = mockProducts.filter((p) => p.is_flash_deal);
  const trendingProducts = mockProducts.filter((p) => p.is_trending);

  const alerts = [
    {
      id: "a1",
      icon: "🔥",
      title: "Rice prices dropping this week!",
      description: "Pishori rice now available from KSh 3,200 per bag.",
      time: "2h ago",
    },
    {
      id: "a2",
      icon: "⚡",
      title: "New stock: LPG Gas 13kg",
      description: "Total LPG cylinders back in stock in Kisumu area.",
      time: "5h ago",
    },
    {
      id: "a3",
      icon: "🎉",
      title: "Weekend flash sale starting Friday!",
      description: "Up to 20% off on cooking oil and sugar.",
      time: "1d ago",
    },
  ];

  const handleShareFeed = () => {
    const message = `🛒 Check out the latest deals on StockLink!\n\n${flashDeals.map((p) => `⚡ ${p.name} - KSh ${(p.flash_deal_price ?? p.price).toLocaleString()}`).join("\n")}\n\nOrder now on StockLink!`;
    window.open(buildWhatsAppLink(message), "_blank");
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Deals & Alerts</h1>
          <p className="text-sm text-muted-foreground">
            Trending products, flash deals & stock alerts
          </p>
        </div>
        <Button
          onClick={handleShareFeed}
          size="sm"
          className="gap-1.5 bg-[#25D366] text-white hover:bg-[#128C7E]"
        >
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </div>

      {/* Flash Deals */}
      {flashDeals.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-bold">Flash Deals</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {flashDeals.map((product) => (
              <FlashDealCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* Alerts (WhatsApp-style) */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold">Stock Alerts</h2>
        </div>
        <div className="space-y-2">
          {alerts.map((alert) => (
            <Card
              key={alert.id}
              className="border-border/60 transition-all hover:shadow-sm"
            >
              <CardContent className="flex items-start gap-3 p-3">
                <span className="text-2xl">{alert.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{alert.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {alert.description}
                  </p>
                </div>
                <Badge variant="secondary" className="text-[10px] shrink-0">
                  {alert.time}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Trending */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold">Trending Products</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {trendingProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
