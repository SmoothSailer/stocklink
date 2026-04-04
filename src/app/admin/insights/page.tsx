"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  ShoppingCart,
  Package,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getDashboardStats } from "@/app/admin/actions";
import { formatPrice } from "@/lib/utils";
import { PRODUCT_CATEGORIES } from "@/lib/constants";

interface Stats {
  products: {
    id: string;
    stock: number;
    price: number;
    is_trending: boolean;
    category: string;
  }[];
  orders: { id: string; status: string; total: number; created_at: string }[];
  wholesalers: { id: string }[];
  demandRequests: {
    id: string;
    product_name: string;
    category: string | null;
    quantity: number | null;
    created_at: string;
  }[];
}

export default function InsightsPage() {
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
  const demandRequests = stats?.demandRequests ?? [];

  const totalRevenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((acc, o) => acc + o.total, 0);
  const totalOrders = orders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const trendingProducts = products.filter((p) => p.is_trending);
  const lowStockProducts = products.filter(
    (p) => p.stock > 0 && p.stock <= 20
  );
  const outOfStockProducts = products.filter((p) => p.stock === 0);

  // Category breakdown from actual products
  const categoryMap = products.reduce(
    (acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const maxCategoryCount = Math.max(...Object.values(categoryMap), 1);

  const categorySales = PRODUCT_CATEGORIES.map((cat) => ({
    category: cat.label,
    icon: cat.icon,
    count: categoryMap[cat.value] ?? 0,
    percentage: Math.round(
      ((categoryMap[cat.value] ?? 0) / maxCategoryCount) * 100
    ),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Demand Insights</h1>
        <p className="text-sm text-muted-foreground">
          Trending products, retailer requests, and stock analytics
        </p>
      </div>

      {/* Overview stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <ShoppingCart className="h-5 w-5 text-primary" />
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
              <BarChart3 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalOrders}</p>
              <p className="text-xs text-muted-foreground">Total Orders</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {formatPrice(Math.round(avgOrderValue))}
              </p>
              <p className="text-xs text-muted-foreground">Avg Order Value</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {lowStockProducts.length + outOfStockProducts.length}
              </p>
              <p className="text-xs text-muted-foreground">Stock Alerts</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Trending Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-primary" />
              Trending Products
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {trendingProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No trending products. Mark products as trending in the Products
                page.
              </p>
            ) : (
              trendingProducts.map((product) => {
                const cat = PRODUCT_CATEGORIES.find(
                  (c) => c.value === product.category
                );
                return (
                  <div
                    key={product.id}
                    className="flex items-center justify-between rounded-lg border border-border/60 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-lg">
                        {cat?.icon ?? "📦"}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {product.category}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {product.stock} in stock
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-primary/10 text-primary">
                      🔥 Trending
                    </Badge>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Category breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4 text-primary" />
              Products by Category
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {categorySales.map((cat) => (
              <div key={cat.category} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">
                    {cat.icon} {cat.category}
                  </span>
                  <span className="text-muted-foreground">
                    {cat.count} product{cat.count !== 1 ? "s" : ""}
                  </span>
                </div>
                <Progress value={cat.percentage} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Retailer Demand Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShoppingCart className="h-4 w-4 text-accent" />
              Retailer Requests (Unfulfilled)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {demandRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No demand requests yet
              </p>
            ) : (
              demandRequests.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between rounded-lg border border-border/60 p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{req.product_name}</p>
                    <p className="text-xs capitalize text-muted-foreground">
                      {req.category ?? "General"}
                    </p>
                  </div>
                  {req.quantity && (
                    <Badge variant="secondary" className="text-xs">
                      {req.quantity} units
                    </Badge>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Stock Shortage Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Stock Shortage Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {outOfStockProducts.length === 0 &&
            lowStockProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No stock issues — all products are well-stocked
              </p>
            ) : (
              <>
                {outOfStockProducts.map((product) => {
                  const cat = PRODUCT_CATEGORIES.find(
                    (c) => c.value === product.category
                  );
                  return (
                    <div
                      key={product.id}
                      className="flex items-center justify-between rounded-lg border border-destructive/30 bg-red-50/50 p-3"
                    >
                      <div className="flex items-center gap-2">
                        <span>{cat?.icon ?? "📦"}</span>
                        <div>
                          <p className="text-sm font-medium">
                            {product.category}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatPrice(product.price)}
                          </p>
                        </div>
                      </div>
                      <Badge variant="destructive" className="text-xs">
                        Out of Stock
                      </Badge>
                    </div>
                  );
                })}
                {lowStockProducts.map((product) => {
                  const cat = PRODUCT_CATEGORIES.find(
                    (c) => c.value === product.category
                  );
                  return (
                    <div
                      key={product.id}
                      className="flex items-center justify-between rounded-lg border border-orange-200 bg-orange-50/50 p-3"
                    >
                      <div className="flex items-center gap-2">
                        <span>{cat?.icon ?? "📦"}</span>
                        <div>
                          <p className="text-sm font-medium">
                            {product.category}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {product.stock} remaining
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                        className="bg-orange-100 text-orange-800 text-xs"
                      >
                        Low Stock
                      </Badge>
                    </div>
                  );
                })}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
