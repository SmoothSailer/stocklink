"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Package,
  Store,
  ClipboardList,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  ShoppingCart,
  DollarSign,
  UserCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDashboardStats } from "@/app/admin/actions";
import { formatPrice } from "@/lib/utils";
import { ORDER_STATUSES } from "@/lib/constants";
import type { OrderStatus } from "@/types/database";

interface Stats {
  products: {
    id: string;
    stock: number;
    price: number;
    is_trending: boolean;
    category: string;
  }[];
  orders: {
    id: string;
    status: string;
    total: number;
    created_at: string;
  }[];
  wholesalers: { id: string }[];
  salesReps: { id: string }[];
  demandRequests: {
    id: string;
    product_name: string;
    category: string | null;
    quantity: number | null;
    created_at: string;
  }[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await getDashboardStats();
      setStats(data as Stats);
    } catch {
      // Show empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const products = stats?.products ?? [];
  const orders = stats?.orders ?? [];
  const wholesalers = stats?.wholesalers ?? [];
  const salesReps = stats?.salesReps ?? [];
  const demandRequests = stats?.demandRequests ?? [];

  const totalRevenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((acc, o) => acc + o.total, 0);
  const pendingOrders = orders.filter((o) => o.status === "placed").length;
  const lowStock = products.filter(
    (p) => p.stock > 0 && p.stock <= 20
  ).length;
  const outOfStock = products.filter((p) => p.stock === 0).length;

  const statusCounts = orders.reduce(
    (acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const recentOrders = orders.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of your wholesale brokerage operations
        </p>
      </div>

      {/* Key metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatPrice(totalRevenue)}</p>
              <p className="text-xs text-muted-foreground">Total Revenue</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <ClipboardList className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingOrders}</p>
              <p className="text-xs text-muted-foreground">Pending Orders</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{products.length}</p>
              <p className="text-xs text-muted-foreground">Products</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
              <Store className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{wholesalers.length}</p>
              <p className="text-xs text-muted-foreground">Wholesalers</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100">
              <UserCheck className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{salesReps.length}</p>
              <p className="text-xs text-muted-foreground">Sales Reps</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Order status breakdown */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Order Status</CardTitle>
            <Link href="/admin/orders">
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                View All <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {(
                Object.entries(ORDER_STATUSES) as [
                  OrderStatus,
                  (typeof ORDER_STATUSES)[OrderStatus],
                ][]
              ).map(([status, info]) => (
                <div
                  key={status}
                  className="rounded-lg border p-3 text-center"
                >
                  <p className="text-2xl font-bold">
                    {statusCounts[status] ?? 0}
                  </p>
                  <Badge
                    variant="secondary"
                    className={`mt-1 text-[10px] ${info.color}`}
                  >
                    {info.label}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stock alerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Stock Alerts
            </CardTitle>
            <Link href="/admin/products">
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                Manage <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {lowStock + outOfStock === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                All stock levels are healthy
              </p>
            ) : (
              <div className="space-y-2">
                {outOfStock > 0 && (
                  <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-red-50/50 p-3">
                    <span className="text-sm font-medium">Out of Stock</span>
                    <Badge variant="destructive" className="text-xs">
                      {outOfStock} product{outOfStock !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                )}
                {lowStock > 0 && (
                  <div className="flex items-center justify-between rounded-lg border border-orange-200 bg-orange-50/50 p-3">
                    <span className="text-sm font-medium">Low Stock</span>
                    <Badge
                      variant="secondary"
                      className="bg-orange-100 text-orange-800 text-xs"
                    >
                      {lowStock} product{lowStock !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShoppingCart className="h-4 w-4 text-primary" />
              Recent Orders
            </CardTitle>
            <Link href="/admin/orders">
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                View All <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No orders yet
              </p>
            ) : (
              <div className="space-y-2">
                {recentOrders.map((order) => {
                  const statusInfo =
                    ORDER_STATUSES[order.status as OrderStatus];
                  return (
                    <div
                      key={order.id}
                      className="flex items-center justify-between rounded-lg border p-2.5"
                    >
                      <div>
                        <p className="text-sm font-medium font-mono">
                          #{order.id.slice(0, 6).toUpperCase()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {formatPrice(order.total)}
                        </p>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] ${statusInfo?.color ?? ""}`}
                        >
                          {statusInfo?.label ?? order.status}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Demand requests */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-accent" />
              Recent Demand Requests
            </CardTitle>
            <Link href="/admin/insights">
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                Insights <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {demandRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No demand requests yet
              </p>
            ) : (
              <div className="space-y-2">
                {demandRequests.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between rounded-lg border p-2.5"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {req.product_name}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {req.category ?? "General"}
                      </p>
                    </div>
                    {req.quantity && (
                      <Badge variant="outline" className="text-xs">
                        {req.quantity} units
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Link href="/admin/sales-reps">
              <Button
                variant="outline"
                className="w-full gap-2 justify-start"
              >
                <UserCheck className="h-4 w-4" />
                Sales Reps
              </Button>
            </Link>
            <Link href="/admin/wholesalers">
              <Button
                variant="outline"
                className="w-full gap-2 justify-start"
              >
                <Store className="h-4 w-4" />
                Add Wholesaler
              </Button>
            </Link>
            <Link href="/admin/products">
              <Button
                variant="outline"
                className="w-full gap-2 justify-start"
              >
                <Package className="h-4 w-4" />
                Add Product
              </Button>
            </Link>
            <Link href="/admin/orders">
              <Button
                variant="outline"
                className="w-full gap-2 justify-start"
              >
                <ClipboardList className="h-4 w-4" />
                Manage Orders
              </Button>
            </Link>
            <Link href="/admin/insights">
              <Button
                variant="outline"
                className="w-full gap-2 justify-start"
              >
                <TrendingUp className="h-4 w-4" />
                View Insights
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
