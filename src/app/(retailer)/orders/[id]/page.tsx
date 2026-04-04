import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { OrderTimeline } from "@/components/retailer/order-timeline";
import { WhatsAppButton } from "@/components/shared/whatsapp-button";
import { getOrderById } from "../../actions";
import { formatPrice, getCategoryIcon } from "@/lib/utils";
import { ORDER_STATUSES } from "@/lib/constants";

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;
  const result = await getOrderById(id);

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <span className="text-5xl">📋</span>
        <p className="mt-3 text-lg font-semibold">Order not found</p>
        <Link
          href="/orders"
          className="mt-2 text-sm text-primary hover:underline"
        >
          View all orders
        </Link>
      </div>
    );
  }

  const { order, items } = result;
  const statusInfo = ORDER_STATUSES[order.status];

  const updateMessage = `Hi StockLink, I have a question about order #${order.id.slice(0, 6).toUpperCase()}.`;

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
          />
        </CardContent>
      </Card>

      {/* WhatsApp-style status bubble */}
      <div className="rounded-2xl rounded-bl-sm bg-green-50 p-4 shadow-sm">
        <p className="text-xs font-semibold text-primary">StockLink Update</p>
        <p className="mt-1 text-sm text-foreground">
          {order.status === "placed" && "📦 Your order has been placed! We're processing it now."}
          {order.status === "confirmed" && "✅ Your order is confirmed! Preparing for dispatch."}
          {order.status === "out_for_delivery" && "🚚 Your order is on the way! Rider will contact you shortly."}
          {order.status === "delivered" && "🎉 Your order has been delivered! Thank you for shopping with us."}
          {order.status === "cancelled" && "❌ This order has been cancelled."}
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
            <span className="font-semibold">Total</span>
            <span className="text-lg font-bold text-primary">
              {formatPrice(order.total)}
            </span>
          </div>
        </CardContent>
      </Card>

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
