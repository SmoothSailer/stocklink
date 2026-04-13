"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, MapPin, CreditCard, UserCheck, MessageCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { PAYMENT_METHODS } from "@/lib/constants";
import { cn, formatPrice, buildWhatsAppLink, getCategoryIcon } from "@/lib/utils";
import { placeOrder } from "../../actions";
import type { Product } from "@/types/database";

interface OrderConfirmClientProps {
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
  };
  quantity?: number;
  unit: string;
  unitPrice: number;
}

export default function OrderConfirmClient({
  product,
  quantity: initialQty,
  unit,
  unitPrice,
}: OrderConfirmClientProps) {
  const router = useRouter();
  const [selectedPayment, setSelectedPayment] = useState<"mpesa" | "cash" | "card" | "bnpl">("mpesa");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<{ id: string } | null>(null);

  const wholesaler = product.wholesalers;
  const salesRep = wholesaler?.sales_reps ?? null;
  const moq = product.min_order_qty ?? 1;
  const quantity = initialQty ?? moq;
  const totalPrice = unitPrice * quantity;

  async function handlePlaceOrder() {
    if (!deliveryAddress.trim()) {
      setError("Please enter a delivery address");
      return;
    }

    setSubmitting(true);
    setError(null);

    const result = await placeOrder({
      items: [
        {
          product_id: product.id,
          quantity,
          unit_price: unitPrice,
          unit,
        },
      ],
      delivery_address: deliveryAddress.trim(),
      payment_method: selectedPayment,
      notes: notes.trim() || undefined,
    });

    if (result.error) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    setConfirmedOrder({ id: result.order_id });

    // Build and open WhatsApp message with order reference
    const repName = salesRep?.name ?? "Ristoka";
    const orderRef = result.order_id.slice(0, 6).toUpperCase();
    const paymentLabel = PAYMENT_METHODS.find((m) => m.value === selectedPayment)?.label ?? selectedPayment;
    const orderMessage = `🛒 *Order Confirmation — Ristoka*\n\nHi ${repName}! 👋\n\n📋 Order #${orderRef}\n📦 ${product.name} × ${quantity} ${unit}s\n💰 Unit Price: KSh ${unitPrice.toLocaleString()} per ${unit}\n💵 Total: KSh ${totalPrice.toLocaleString()}\n💳 Payment: ${paymentLabel}\n📍 Delivery: ${deliveryAddress.trim()}\n🏬 Supplier: ${wholesaler?.name ?? "Ristoka Wholesale"}\n\nPlease confirm order.`;

    const waLink = buildWhatsAppLink(orderMessage, salesRep?.whatsapp_phone);
    window.open(waLink, "_blank");
  }

  if (confirmedOrder) {
    const orderRef = confirmedOrder.id.slice(0, 6).toUpperCase();
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-xl font-bold text-foreground">
          Order Placed! 🎉
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your order #{orderRef} has been placed and sent via WhatsApp.
          You&apos;ll receive updates on the delivery status.
        </p>

        {/* WhatsApp-style confirmation bubble */}
        <div className="mx-auto mt-6 max-w-sm">
          <div className="rounded-2xl rounded-bl-sm bg-green-50 p-4 text-left shadow-sm">
            <p className="text-xs font-semibold text-primary">Ristoka</p>
            <p className="mt-1 text-sm text-foreground">
              ✅ Order #{orderRef} placed!
            </p>
            <p className="mt-1 text-sm text-foreground">
              📦 {product.name} × {quantity} {unit}s
            </p>
            <p className="text-sm text-foreground">
              💵 {formatPrice(totalPrice)}
            </p>
            <p className="mt-2 text-sm text-foreground">
              📍 {deliveryAddress}
            </p>
            <p className="mt-1 text-[10px] text-muted-foreground">
              {new Date().toLocaleTimeString("en-KE", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <a
            href={`/orders/${confirmedOrder.id}`}
            className={cn(
              buttonVariants({ variant: "default" }),
            )}
          >
            Track Order
          </a>
          <a
            href="/orders"
            className={cn(
              buttonVariants({ variant: "outline" }),
            )}
          >
            View All Orders
          </a>
        </div>
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
                {getCategoryIcon(product.category)}
              </div>
              <div>
                <p className="text-sm font-medium">{product.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatPrice(unitPrice)}/{unit} × {quantity} {unit}s
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
        <CardContent className="space-y-2">
          <Input
            placeholder="e.g. Shop 12, Gikomba Market, Nairobi"
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Enter your shop or delivery location
          </p>
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
              onClick={() => setSelectedPayment(method.value as "mpesa" | "cash" | "card" | "bnpl")}
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
          {selectedPayment === "bnpl" && (
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 mt-1">
              <p className="text-xs font-semibold text-orange-800">🕌 Murabaha — Buy Now Pay Later</p>
              <p className="text-xs text-orange-700 mt-1">
                A 30% down payment is required upfront. The remaining 70% (plus agreed markup) will be split into equal installments. Your sales rep will set up the payment plan after order confirmation.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">
            Notes (optional)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Any special instructions..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Error message */}
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

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

        <Button
          className="w-full gap-2 bg-[#25D366] font-semibold text-white shadow-md hover:bg-[#128C7E]"
          size="lg"
          disabled={submitting}
          onClick={handlePlaceOrder}
        >
          {submitting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <MessageCircle className="h-5 w-5" />
          )}
          {submitting
            ? "Placing order..."
            : salesRep
              ? `Place Order with ${salesRep.name.split(" ")[0]} — ${formatPrice(totalPrice)}`
              : `Place Order — ${formatPrice(totalPrice)}`}
        </Button>
      </div>
    </div>
  );
}
