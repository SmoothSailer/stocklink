"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Eye,
  Truck,
  XCircle,
  CheckCircle2,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getOrders, updateOrderStatus } from "@/app/admin/actions";
import { formatPrice, timeAgo } from "@/lib/utils";
import { ORDER_STATUSES } from "@/lib/constants";
import type { OrderStatus } from "@/types/database";

interface OrderWithItems {
  id: string;
  retailer_id: string | null;
  status: OrderStatus;
  total: number;
  delivery_address: string;
  payment_method: "mpesa" | "cash" | "card";
  notes: string | null;
  created_at: string;
  updated_at: string;
  order_items: {
    id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    products: { name: string; unit: string } | null;
  }[];
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [detailOrder, setDetailOrder] = useState<OrderWithItems | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      const data = await getOrders();
      setOrders(data as OrderWithItems[]);
    } catch {
      // Empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const filtered = orders.filter((o) => {
    const matchesSearch =
      !search ||
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.delivery_address.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = orders.reduce(
    (acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  async function handleStatusUpdate(id: string, status: OrderStatus) {
    await updateOrderStatus(id, status);
    await loadOrders();
  }

  function OrderActions({ order }: { order: OrderWithItems }) {
    return (
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="View order"
          onClick={() => setDetailOrder(order)}
        >
          <Eye className="h-3.5 w-3.5" />
        </Button>
        {order.status === "placed" && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-primary hover:text-primary"
            title="Confirm order"
            onClick={() => handleStatusUpdate(order.id, "confirmed")}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
          </Button>
        )}
        {order.status === "confirmed" && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-primary hover:text-primary"
            title="Mark out for delivery"
            onClick={() => handleStatusUpdate(order.id, "out_for_delivery")}
          >
            <Truck className="h-3.5 w-3.5" />
          </Button>
        )}
        {order.status === "out_for_delivery" && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-primary hover:text-primary"
            title="Mark delivered"
            onClick={() => handleStatusUpdate(order.id, "delivered")}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
          </Button>
        )}
        {order.status !== "delivered" && order.status !== "cancelled" && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            title="Cancel order"
            onClick={() => handleStatusUpdate(order.id, "cancelled")}
          >
            <XCircle className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold sm:text-2xl">Orders</h1>
        <p className="text-xs text-muted-foreground sm:text-sm">
          Manage orders, assign deliveries, and track status
        </p>
      </div>

      {/* Status summary */}
      <div className="flex gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-3 sm:overflow-visible lg:grid-cols-5">
        {(
          Object.entries(ORDER_STATUSES) as [
            OrderStatus,
            (typeof ORDER_STATUSES)[OrderStatus],
          ][]
        ).map(([status, info]) => (
          <Card
            key={status}
            className={`min-w-[100px] shrink-0 cursor-pointer transition-all hover:shadow-sm sm:min-w-0 ${
              statusFilter === status ? "ring-2 ring-primary" : ""
            }`}
            onClick={() =>
              setStatusFilter(statusFilter === status ? "all" : status)
            }
          >
            <CardContent className="p-2.5 sm:p-3">
              <p className="text-[10px] text-muted-foreground sm:text-xs">{info.label}</p>
              <p className="text-lg font-bold sm:text-2xl">{statusCounts[status] ?? 0}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search & filter */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(val) => setStatusFilter(val ?? "all")}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(ORDER_STATUSES).map(([key, info]) => (
              <SelectItem key={key} value={key}>
                {info.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <ClipboardList className="mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm font-medium text-muted-foreground">
              {search || statusFilter !== "all"
                ? "No orders found"
                : "No orders yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* ─── Mobile Card List ─── */}
          <div className="space-y-3 lg:hidden">
            {filtered.map((order) => {
              const statusInfo = ORDER_STATUSES[order.status];
              return (
                <Card key={order.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-mono text-sm font-semibold">
                          #{order.id.slice(0, 6).toUpperCase()}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {timeAgo(order.created_at)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">
                          {formatPrice(order.total)}
                        </p>
                        <Badge
                          variant="secondary"
                          className={`mt-1 text-[10px] ${statusInfo.color}`}
                        >
                          {statusInfo.label}
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                      <p className="truncate">
                        📍 {order.delivery_address}
                      </p>
                      <p>
                        📦 {order.order_items.length} item{order.order_items.length !== 1 ? "s" : ""} · <span className="capitalize">{order.payment_method}</span>
                      </p>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t pt-3">
                      <OrderActions order={order} />
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1 text-xs"
                        onClick={() => setDetailOrder(order)}
                      >
                        <Eye className="h-3 w-3" /> Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* ─── Desktop Table ─── */}
          <Card className="hidden lg:block">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((order) => {
                    const statusInfo = ORDER_STATUSES[order.status];
                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-sm font-medium">
                          #{order.id.slice(0, 6).toUpperCase()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={`text-xs ${statusInfo.color}`}
                          >
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {order.order_items.length} item
                          {order.order_items.length !== 1 ? "s" : ""}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                          {order.delivery_address}
                        </TableCell>
                        <TableCell className="text-sm capitalize">
                          {order.payment_method}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatPrice(order.total)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {timeAgo(order.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end">
                            <OrderActions order={order} />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {/* Order detail dialog */}
      <Dialog
        open={!!detailOrder}
        onOpenChange={(open) => {
          if (!open) setDetailOrder(null);
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto max-w-[calc(100vw-2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Order #{detailOrder?.id.slice(0, 6).toUpperCase()}
            </DialogTitle>
          </DialogHeader>
          {detailOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge
                    variant="secondary"
                    className={`mt-1 text-xs ${ORDER_STATUSES[detailOrder.status].color}`}
                  >
                    {ORDER_STATUSES[detailOrder.status].label}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Payment</p>
                  <p className="mt-1 font-medium capitalize">
                    {detailOrder.payment_method}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total</p>
                  <p className="mt-1 font-bold text-primary">
                    {formatPrice(detailOrder.total)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p className="mt-1">
                    {new Date(detailOrder.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Delivery Address
                </p>
                <p className="mt-1 text-sm">{detailOrder.delivery_address}</p>
              </div>
              {detailOrder.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="mt-1 text-sm">{detailOrder.notes}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium mb-2">Order Items</p>
                <div className="space-y-2">
                  {detailOrder.order_items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border p-2.5"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {item.products?.name ?? "Unknown product"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantity} × {formatPrice(item.unit_price)}
                        </p>
                      </div>
                      <p className="text-sm font-medium">
                        {formatPrice(item.total_price)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
