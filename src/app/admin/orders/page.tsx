"use client";

import { useState } from "react";
import { Search, Eye, Truck, XCircle, CheckCircle2 } from "lucide-react";
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
import { mockOrders } from "@/lib/mock-data";
import { formatPrice, timeAgo } from "@/lib/utils";
import { ORDER_STATUSES } from "@/lib/constants";
import type { OrderStatus } from "@/types/database";

export default function AdminOrdersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const orders = mockOrders.filter((o) => {
    const matchesSearch =
      !search ||
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.delivery_address.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = mockOrders.reduce(
    (acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-sm text-muted-foreground">
          Manage orders, assign deliveries, and track status
        </p>
      </div>

      {/* Status summary */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {(
          Object.entries(ORDER_STATUSES) as [
            OrderStatus,
            (typeof ORDER_STATUSES)[OrderStatus],
          ][]
        ).map(([status, info]) => (
          <Card
            key={status}
            className={`cursor-pointer transition-all hover:shadow-sm ${
              statusFilter === status ? "ring-2 ring-primary" : ""
            }`}
            onClick={() =>
              setStatusFilter(statusFilter === status ? "all" : status)
            }
          >
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">{info.label}</p>
              <p className="text-2xl font-bold">{statusCounts[status] ?? 0}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search & filter */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val ?? "all")}>
          <SelectTrigger className="w-[180px]">
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

      {/* Orders table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Time</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => {
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
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="View order"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        {order.status === "placed" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-primary hover:text-primary"
                            title="Confirm order"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {order.status === "confirmed" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-primary hover:text-primary"
                            title="Assign delivery"
                          >
                            <Truck className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {order.status !== "delivered" &&
                          order.status !== "cancelled" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              title="Cancel order"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </Button>
                          )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
