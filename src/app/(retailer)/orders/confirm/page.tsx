"use client";

import { useState } from "react";
import { CheckCircle2, MapPin, CreditCard, UserCheck, MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { WhatsAppButton } from "@/components/shared/whatsapp-button";
import { PAYMENT_METHODS } from "@/lib/constants";
import { cn, formatPrice, buildWhatsAppLink } from "@/lib/utils";
import { mockProducts, mockWholesalers, mockSalesReps } from "@/lib/mock-data";

export default function OrderConfirmPage() {
  const [selectedPayment, setSelectedPayment] = useState("mpesa");
  const [confirmed, setConfirmed] = useState(false);

  // Demo order: first product with MOQ
  const product = mockProducts[0];
  const wholesaler = mockWholesalers.find((w) => w.id === product.wholesaler_id);
  const salesRep = wholesaler?.sales_rep_id
    ? mockSalesReps.find((r) => r.id === wholesaler.sales_rep_id)
    : undefined;
  const moq = product.min_order_qty ?? 1;
  const quantity = moq * 2; // demo: double the minimum order
  const totalPrice = product.price * quantity;

  const repName = salesRep?.name ?? "StockLink";
  const orderMessage = `🛒 *Bulk Order Confirmation — StockLink*\n\nHi ${repName}! 👋\n\n📦 ${product.name} × ${quantity} ${product.unit}s\n💰 Unit Price: KSh ${product.price.toLocaleString()} per ${product.unit}\n💵 Total: KSh ${totalPrice.toLocaleString()}\n💳 Payment: ${PAYMENT_METHODS.find((m) => m.value === selectedPayment)?.label}\n📍 Delivery: Shop 12, Gikomba Market, Nairobi\n🏬 Supplier: ${wholesaler?.name ?? "StockLink Wholesale"}\n\nPlease confirm order.`;

  if (confirmed) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-xl font-bold text-foreground">
          Order Confirmed! 🎉
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your order has been sent via WhatsApp. You&apos;ll receive updates on the
          delivery status.
        </p>

        {/* WhatsApp-style confirmation bubble */}
        <div className="mx-auto mt-6 max-w-sm">
          <div className="rounded-2xl rounded-bl-sm bg-green-50 p-4 text-left shadow-sm">
            <p className="text-xs font-semibold text-primary">StockLink</p>
            <p className="mt-1 text-sm text-foreground">
              ✅ Order #{Math.random().toString(36).slice(2, 8).toUpperCase()}{" "}
              confirmed!
            </p>
            <p className="mt-1 text-sm text-foreground">
              📦 {product.name} × {quantity} {product.unit}s
            </p>
            <p className="text-sm text-foreground">
              💵 {formatPrice(totalPrice)}
            </p>
            <p className="mt-2 text-sm text-foreground">
              🚚 Estimated delivery: Today by 5:00 PM
            </p>
            <p className="mt-1 text-[10px] text-muted-foreground">
              {new Date().toLocaleTimeString("en-KE", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>

        <a
          href="/orders"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "mt-6"
          )}
        >
          View My Orders
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 px-4 py-4">
      <h1 className="text-xl font-bold">Confirm Order</h1>

      {/* Order summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-2xl">
                🍚
              </div>
              <div>
                <p className="text-sm font-medium">{product.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatPrice(product.price)}/{product.unit} × {quantity} {product.unit}s
                </p>
              </div>
            </div>
            <p className="font-semibold">{formatPrice(totalPrice)}</p>
          </div>

          <Separator />

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Delivery</span>
            <span className="text-primary font-medium">Free</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold">Total</span>
            <span className="text-lg font-bold text-primary">
              {formatPrice(totalPrice)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Delivery address */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <MapPin className="h-4 w-4 text-primary" />
            Delivery Address
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground">Shop 12, Gikomba Market</p>
          <p className="text-xs text-muted-foreground">Nairobi, Kenya</p>
        </CardContent>
      </Card>

      {/* Payment method */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <CreditCard className="h-4 w-4 text-primary" />
            Payment Method
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {PAYMENT_METHODS.map((method) => (
            <button
              key={method.value}
              type="button"
              onClick={() => setSelectedPayment(method.value)}
              className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                selectedPayment === method.value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted/50"
              }`}
            >
              <span className="text-xl">{method.icon}</span>
              <span className="text-sm font-medium">{method.label}</span>
              {selectedPayment === method.value && (
                <Badge className="ml-auto" variant="default">
                  Selected
                </Badge>
              )}
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Confirm CTA */}
      <div className="space-y-2 pt-2">
        {/* Sales rep card */}
        {salesRep && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="flex items-center gap-3 p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {salesRep.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1">
                  <UserCheck className="h-3 w-3 text-primary" />
                  <p className="text-[10px] font-semibold text-primary">Your Sales Rep</p>
                </div>
                <p className="text-sm font-medium">{salesRep.name}</p>
              </div>
              <a
                href={buildWhatsAppLink(`Hi ${salesRep.name}! 👋 I have a question about my order.`, salesRep.whatsapp_phone)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#25D366] text-white hover:bg-[#128C7E] transition-colors"
                aria-label={`Chat with ${salesRep.name}`}
              >
                <MessageCircle className="h-3.5 w-3.5" />
              </a>
            </CardContent>
          </Card>
        )}

        <WhatsAppButton
          message={orderMessage}
          phone={salesRep?.whatsapp_phone}
          label={salesRep ? `Confirm with ${salesRep.name.split(" ")[0]} — ${formatPrice(totalPrice)}` : `Confirm & Pay ${formatPrice(totalPrice)}`}
          className="w-full"
        />
        <Button
          variant="ghost"
          className="w-full text-sm text-muted-foreground"
          onClick={() => setConfirmed(true)}
        >
          Preview confirmation
        </Button>
      </div>
    </div>
  );
}
