"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { OrderTimeline } from "@/components/retailer/order-timeline";
import { WhatsAppButton } from "@/components/shared/whatsapp-button";
import { formatPrice, getCategoryIcon } from "@/lib/utils";
import { PAYMENT_STATUSES } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import type { Order, OrderStatusHistory, BnplPlan, BnplInstallment } from "@/types/database";

interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  unit: string | null;
  products: {
    id: string;
    name: string;
    category: string;
    unit: string;
    image_url: string | null;
  } | null;
}

interface OrderDetailClientProps {
  order: Order;
  items: OrderItem[];
  statusHistory: OrderStatusHistory[];
  bnplPlan?: (BnplPlan & { bnpl_installments: BnplInstallment[] }) | null;
}

const STATUS_MESSAGES: Record<string, string> = {
  placed: "📦 Your order has been placed! We're processing it now.",
  confirmed: "✅ Your order is confirmed! Preparing for dispatch.",
  out_for_delivery: "🚚 Your order is on the way! Rider will contact you shortly.",
  delivered: "🎉 Your order has been delivered! Thank you for shopping with us.",
  cancelled: "❌ This order has been cancelled.",
};

export default function OrderDetailClient({
  order: initialOrder,
  items,
  statusHistory: initialHistory,
  bnplPlan,
}: OrderDetailClientProps) {
  const [order, setOrder] = useState(initialOrder);
  const [statusHistory, setStatusHistory] = useState(initialHistory);

  // Subscribe to real-time order updates
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`order-${order.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${order.id}`,
        },
        (payload) => {
          setOrder((prev) => ({ ...prev, ...payload.new } as Order));
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "order_status_history",
          filter: `order_id=eq.${order.id}`,
        },
        (payload) => {
          setStatusHistory((prev) => [...prev, payload.new as OrderStatusHistory]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [order.id]);

  const updateMessage = `Hi Ristoka, I have a question about order #${order.id.slice(0, 6).toUpperCase()}.`;

  return (
    <div className="mx-auto max-w-lg space-y-4 px-4 py-4">
      {/* Back */}
      <Link
        href="/orders"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to orders
      </Link>

      {/* Order header */}
      <div>
        <h1 className="text-xl font-bold">
          Order #{order.id.slice(0, 6).toUpperCase()}
        </h1>
        <p className="text-sm text-muted-foreground">
          {new Date(order.created_at).toLocaleDateString("en-KE", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Order Status</CardTitle>
        </CardHeader>
        <CardContent>
          <OrderTimeline
            currentStatus={order.status}
            createdAt={order.created_at}
            updatedAt={order.updated_at}
            statusHistory={statusHistory}
          />
        </CardContent>
      </Card>

      {/* WhatsApp-style status bubble */}
      <div className="rounded-2xl rounded-bl-sm bg-green-50 p-4 shadow-sm">
        <p className="text-xs font-semibold text-primary">Ristoka Update</p>
        <p className="mt-1 text-sm text-foreground">
          {STATUS_MESSAGES[order.status] ?? ""}
        </p>
        <p className="mt-1 text-[10px] text-muted-foreground">
          {new Date(order.updated_at).toLocaleTimeString("en-KE", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>

      {/* Order items */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Order Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map((item) => {
            const product = item.products;
            return (
              <div key={item.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-lg">
                    {getCategoryIcon(product?.category ?? "")}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {product?.name ?? "Product"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatPrice(item.unit_price)} × {item.quantity}
                    </p>
                  </div>
                </div>
                <p className="text-sm font-semibold">
                  {formatPrice(item.total_price)}
                </p>
              </div>
            );
          })}

          <Separator />

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Payment</span>
            <span className="text-sm capitalize">{order.payment_method}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Payment Status</span>
            <Badge className={`text-[10px] ${PAYMENT_STATUSES[order.payment_status as keyof typeof PAYMENT_STATUSES]?.color ?? ""}`}>
              {PAYMENT_STATUSES[order.payment_status as keyof typeof PAYMENT_STATUSES]?.label ?? order.payment_status}
            </Badge>
          </div>
          {order.amount_paid > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Paid</span>
              <span className="text-sm font-medium text-primary">{formatPrice(order.amount_paid)} / {formatPrice(order.total)}</span>
            </div>
          )}
          {order.delivery_address && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Delivery</span>
              <span className="text-sm">{order.delivery_address}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="font-semibold">Total</span>
            <span className="text-lg font-bold text-primary">
              {formatPrice(order.total)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* BNPL Installment Schedule */}
      {bnplPlan && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">🕌 Murabaha Payment Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg bg-muted/50 p-3 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cost Price</span>
                <span>{formatPrice(bnplPlan.cost_price)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Agreed Markup</span>
                <span>{formatPrice(bnplPlan.markup_amount)}</span>
              </div>
              <div className="flex justify-between font-semibold text-sm">
                <span>Total</span>
                <span>{formatPrice(bnplPlan.total_with_markup)}</span>
              </div>
              {bnplPlan.down_payment > 0 && (
                <div className="flex justify-between text-primary font-medium border-t pt-1 mt-1">
                  <span>⬇ Down Payment ({Math.round(bnplPlan.down_payment_rate * 100)}%)</span>
                  <span>{formatPrice(bnplPlan.down_payment)}</span>
                </div>
              )}
            </div>

            <p className="text-xs font-semibold text-muted-foreground">
              {bnplPlan.num_installments} Installments (remaining {Math.round((1 - bnplPlan.down_payment_rate) * 100)}%)
            </p>

            {(bnplPlan.bnpl_installments ?? [])
              .sort((a, b) => a.installment_number - b.installment_number)
              .map((inst) => (
              <div key={inst.id} className="flex items-center justify-between rounded border p-2.5 text-xs">
                <div>
                  <p className="font-medium">Installment #{inst.installment_number}</p>
                  <p className="text-muted-foreground">
                    Due: {new Date(inst.due_date).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatPrice(inst.amount)}</p>
                  <Badge className={`text-[10px] ${
                    inst.status === "paid" ? "bg-green-100 text-green-800" :
                    inst.status === "overdue" ? "bg-red-100 text-red-800" :
                    inst.status === "due" ? "bg-yellow-100 text-yellow-800" :
                    "bg-gray-100 text-gray-800"
                  }`}>
                    {inst.status === "paid" ? "Paid" : inst.status === "overdue" ? "Overdue" : inst.status === "due" ? "Due" : "Upcoming"}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Contact */}
      <WhatsAppButton
        message={updateMessage}
        label="Contact Support"
        variant="outline"
        size="default"
        className="w-full"
      />
    </div>
  );
}
