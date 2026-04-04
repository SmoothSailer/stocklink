import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getOrders } from "../actions";
import { formatPrice, timeAgo } from "@/lib/utils";
import { ORDER_STATUSES } from "@/lib/constants";
import { ChevronRight, Package } from "lucide-react";

export default async function OrdersPage() {
  const orders = await getOrders();

  return (
    <div className="mx-auto max-w-lg space-y-4 px-4 py-4">
      <h1 className="text-xl font-bold">My Orders</h1>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Package className="h-12 w-12 text-muted-foreground" />
          <p className="mt-3 text-lg font-semibold">No orders yet</p>
          <p className="text-sm text-muted-foreground">
            Browse products and place your first order
          </p>
          <Link
            href="/products"
            className="mt-3 text-sm font-medium text-primary hover:underline"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const statusInfo = ORDER_STATUSES[order.status];
            return (
              <Link key={order.id} href={`/orders/${order.id}`}>
                <Card className="transition-all hover:shadow-md">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold">
                          Order #{order.id.slice(0, 6).toUpperCase()}
                        </p>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] ${statusInfo.color}`}
                        >
                          {statusInfo.label}
                        </Badge>
                      </div>
                      <div className="mt-0.5 flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          {timeAgo(order.created_at)}
                        </p>
                        <p className="text-sm font-semibold text-primary">
                          {formatPrice(order.total)}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
