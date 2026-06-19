"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingCart,
  ArrowLeft,
  CreditCard,
  MapPin,
  MessageCircle,
  Loader2,
  Boxes,
  Eye,
  EyeOff,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { CartScene3D } from "@/components/retailer/cart-scene-3d";
import { useCart } from "@/hooks/use-cart";
import { formatPrice, getCategoryIcon } from "@/lib/utils";
import { PAYMENT_METHODS } from "@/lib/constants";
import { placeOrder } from "../actions";

interface BnplEligibility {
  eligible: boolean;
  reason?: string;
  credit_limit: number;
  credit_used: number;
  available_credit: number;
  verification_status: string;
}

interface CartClientProps {
  bnplEligibility: BnplEligibility;
}

export default function CartClient({ bnplEligibility }: CartClientProps) {
  const router = useRouter();
  const { items, total, itemCount, updateQuantity, removeItem, clearCart } = useCart();
  const [selectedPayment, setSelectedPayment] = useState<"mpesa" | "cash" | "card" | "bnpl">("mpesa");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<{ id: string } | null>(null);
  const [show3D, setShow3D] = useState(true);

  async function handlePlaceOrder() {
    if (!deliveryAddress.trim()) {
      setError("Please enter a delivery address");
      return;
    }

    setSubmitting(true);
    setError(null);

    const result = await placeOrder({
      items: items.map((i) => ({
        product_id: i.productId,
        quantity: i.quantity,
        unit_price: i.wholesalePrice ?? i.price,
        unit: i.unit,
      })),
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
    clearCart();
  }

  if (confirmedOrder) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <ShoppingCart className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-xl font-bold text-foreground">Order Placed!</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your order #{confirmedOrder.id.slice(0, 6).toUpperCase()} has been placed.
          A sales rep will contact you on WhatsApp to confirm.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Link
            href={`/orders/${confirmedOrder.id}`}
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Track Order
          </Link>
          <Link
            href="/orders"
            className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium"
          >
            View All Orders
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="flex flex-col items-center justify-center text-center">
          <Boxes className="h-16 w-16 text-muted-foreground/40" />
          <h1 className="mt-4 text-xl font-bold text-foreground">Your cart is empty</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Add items from our product catalog to start building your order
          </p>
          <Link
            href="/products"
            className="mt-6 inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-4">
      <div className="flex items-center gap-3">
        <Link
          href="/products"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Products
        </Link>
        <h1 className="text-xl font-bold">
          Cart ({itemCount} item{itemCount !== 1 ? "s" : ""})
        </h1>
      </div>

      {/* 3D Builder */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-semibold">3D Builder</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={() => setShow3D(!show3D)}
          >
            {show3D ? (
              <>
                <EyeOff className="h-3.5 w-3.5" /> Hide
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5" /> Show
              </>
            )}
          </Button>
        </CardHeader>
        {show3D && (
          <CardContent className="p-0">
            <CartScene3D items={items} />
          </CardContent>
        )}
      </Card>

      {/* Cart items */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map((item) => (
            <div
              key={`${item.productId}-${item.unit}`}
              className="flex items-center gap-3 rounded-lg border p-3"
            >
              {/* Product thumbnail */}
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted text-xl">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    sizes="48px"
                    className="rounded object-cover"
                  />
                ) : (
                  getCategoryIcon(item.category)
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatPrice(item.wholesalePrice ?? item.price)}/{item.unit}
                  {item.wholesalePrice && (
                    <span className="ml-1 text-muted-foreground/60 line-through">
                      {formatPrice(item.price)}
                    </span>
                  )}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {formatPrice((item.wholesalePrice ?? item.price) * item.quantity)}
                </p>
              </div>

              {/* Quantity controls */}
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => updateQuantity(item.productId, item.unit, item.quantity - 1)}
                  disabled={item.quantity <= item.minOrderQty}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-8 text-center text-sm font-bold tabular-nums">
                  {item.quantity}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => updateQuantity(item.productId, item.unit, item.quantity + 1)}
                  disabled={item.quantity >= item.maxStock}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              {/* Remove */}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-red-600"
                onClick={() => removeItem(item.productId, item.unit)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
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
          {PAYMENT_METHODS.map((method) => {
            const isBnpl = method.value === "bnpl";
            const bnplDisabled = isBnpl && !bnplEligibility.eligible;
            return (
              <button
                key={method.value}
                type="button"
                disabled={bnplDisabled}
                onClick={() =>
                  !bnplDisabled &&
                  setSelectedPayment(method.value as "mpesa" | "cash" | "card" | "bnpl")
                }
                className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                  bnplDisabled
                    ? "border-border opacity-50 cursor-not-allowed"
                    : selectedPayment === method.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50"
                }`}
              >
                <span className="text-xl">{method.icon}</span>
                <div className="flex-1">
                  <span className="text-sm font-medium">{method.label}</span>
                  {bnplDisabled && (
                    <p className="text-[10px] text-red-600 mt-0.5">
                      {bnplEligibility.reason}
                    </p>
                  )}
                </div>
                {selectedPayment === method.value && (
                  <Badge variant="default">Selected</Badge>
                )}
              </button>
            );
          })}
          {selectedPayment === "bnpl" && bnplEligibility.eligible && (
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 mt-1 space-y-1">
              <p className="text-xs font-semibold text-orange-800">
                Murabaha — Buy Now Pay Later
              </p>
              <p className="text-xs text-orange-700">
                Available credit:{" "}
                <span className="font-semibold">
                  KSh {bnplEligibility.available_credit.toLocaleString()}
                </span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Notes (optional)</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Any special instructions..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Order summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal ({itemCount} items)</span>
            <span>{formatPrice(total)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Delivery</span>
            <span className="text-primary font-medium">Free</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="font-semibold">Total</span>
            <span className="text-lg font-bold text-primary">{formatPrice(total)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {/* Submit */}
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
          : `Place Order — ${formatPrice(total)}`}
      </Button>

      {/* Clear cart */}
      <div className="text-center">
        <button
          type="button"
          onClick={clearCart}
          className="text-xs text-muted-foreground underline hover:text-foreground"
        >
          Clear cart
        </button>
      </div>
    </div>
  );
}
