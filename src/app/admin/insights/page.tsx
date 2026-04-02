"use client";

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
import { mockProducts, mockOrders } from "@/lib/mock-data";
import { formatPrice } from "@/lib/utils";

export default function InsightsPage() {
  const totalRevenue = mockOrders
    .filter((o) => o.status !== "cancelled")
    .reduce((acc, o) => acc + o.total, 0);
  const totalOrders = mockOrders.length;
  const avgOrderValue = totalRevenue / totalOrders;
  const trendingProducts = mockProducts.filter((p) => p.is_trending);
  const lowStockProducts = mockProducts.filter(
    (p) => p.stock > 0 && p.stock <= 10
  );
  const outOfStockProducts = mockProducts.filter((p) => p.stock === 0);

  // Simulated demand requests
  const demandRequests = [
    { product: "Brown Rice 25kg", category: "rice", requests: 15 },
    { product: "Sunflower Oil 5L", category: "oil", requests: 12 },
    { product: "Atta Flour 10kg", category: "flour", requests: 8 },
    { product: "Baking Powder 500g", category: "flour", requests: 5 },
  ];

  // Category sales data (simulated)
  const categorySales = [
    { category: "Rice", sales: 45, percentage: 85 },
    { category: "Oil", sales: 30, percentage: 65 },
    { category: "Sugar", sales: 12, percentage: 30 },
    { category: "Flour", sales: 80, percentage: 95 },
    { category: "LPG", sales: 5, percentage: 15 },
    { category: "Beverages", sales: 60, percentage: 78 },
    { category: "Dairy", sales: 20, percentage: 45 },
    { category: "Cleaning", sales: 0, percentage: 0 },
  ];

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
            {trendingProducts.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between rounded-lg border border-border/60 p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-lg">
                    {product.category === "rice" && "🍚"}
                    {product.category === "oil" && "🫒"}
                    {product.category === "flour" && "🌾"}
                    {product.category === "beverages" && "🥤"}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {product.stock} in stock
                    </p>
                  </div>
                </div>
                <Badge className="bg-primary/10 text-primary">
                  🔥 Trending
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Category Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4 text-primary" />
              Sales by Category
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {categorySales.map((cat) => (
              <div key={cat.category} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{cat.category}</span>
                  <span className="text-muted-foreground">
                    {cat.sales} units
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
            {demandRequests.map((req, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border border-border/60 p-3"
              >
                <div>
                  <p className="text-sm font-medium">{req.product}</p>
                  <p className="text-xs capitalize text-muted-foreground">
                    {req.category}
                  </p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {req.requests} requests
                </Badge>
              </div>
            ))}
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
            {outOfStockProducts.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between rounded-lg border border-destructive/30 bg-red-50/50 p-3"
              >
                <div>
                  <p className="text-sm font-medium">{product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatPrice(product.price)} per {product.unit}
                  </p>
                </div>
                <Badge variant="destructive" className="text-xs">
                  Out of Stock
                </Badge>
              </div>
            ))}
            {lowStockProducts.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between rounded-lg border border-orange-200 bg-orange-50/50 p-3"
              >
                <div>
                  <p className="text-sm font-medium">{product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {product.stock} remaining
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-orange-100 text-orange-800 text-xs"
                >
                  Low Stock
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
