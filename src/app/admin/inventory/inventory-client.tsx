"use client";

import { useState } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  AlertTriangle,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatPrice, getStockInfo, getCategoryIcon } from "@/lib/utils";
import type { Product, Wholesaler } from "@/types/database";

interface InventoryClientProps {
  products: (Product & { wholesalers: { name: string } | null })[];
  wholesalers: Wholesaler[];
}

export default function InventoryClient({ products: allProducts }: InventoryClientProps) {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const products = allProducts.filter(
    (p) =>
      !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalProducts = allProducts.length;
  const lowStock = allProducts.filter(
    (p) => p.stock > 0 && p.stock <= 20
  ).length;
  const outOfStock = allProducts.filter((p) => p.stock === 0).length;
  const totalValue = allProducts.reduce(
    (acc, p) => acc + p.price * p.stock,
    0
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">Inventory</h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Manage products, stock levels, and pricing
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger
            render={<Button className="w-full gap-2 sm:w-auto" />}
          >
            <Plus className="h-4 w-4" />
            Add Product
          </DialogTrigger>
          <DialogContent className="max-h-[90dvh] overflow-y-auto max-w-[calc(100vw-2rem)] sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
            </DialogHeader>
            <form className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Product Name</label>
                <Input placeholder="e.g. Soko Pishori Rice 25kg" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Price (KSh)</label>
                  <Input type="number" placeholder="0" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Stock</label>
                  <Input type="number" placeholder="0" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Input placeholder="e.g. rice" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Unit</label>
                  <Input placeholder="e.g. bag, carton" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Min Order Qty</label>
                  <Input type="number" placeholder="e.g. 5" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Wholesaler</label>
                  <Input placeholder="Select wholesaler" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Input placeholder="Product description..." />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="button" onClick={() => setDialogOpen(false)}>
                  Save Product
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-2 p-3 sm:gap-3 sm:p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 sm:h-10 sm:w-10">
              <Package className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold sm:text-2xl">{totalProducts}</p>
              <p className="truncate text-[10px] text-muted-foreground sm:text-xs">Total Products</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-2 p-3 sm:gap-3 sm:p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-100 sm:h-10 sm:w-10">
              <AlertTriangle className="h-4 w-4 text-orange-600 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold sm:text-2xl">{lowStock}</p>
              <p className="truncate text-[10px] text-muted-foreground sm:text-xs">Low Stock</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-2 p-3 sm:gap-3 sm:p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100 sm:h-10 sm:w-10">
              <Package className="h-4 w-4 text-destructive sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold sm:text-2xl">{outOfStock}</p>
              <p className="truncate text-[10px] text-muted-foreground sm:text-xs">Out of Stock</p>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-2 lg:col-span-1">
          <CardContent className="flex items-center gap-2 p-3 sm:gap-3 sm:p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-100 sm:h-10 sm:w-10">
              <Package className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-lg font-bold sm:text-2xl">{formatPrice(totalValue)}</p>
              <p className="truncate text-[10px] text-muted-foreground sm:text-xs">Stock Value</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative sm:max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* ─── Mobile Card List ─── */}
      <div className="space-y-3 lg:hidden">
        {products.map((product) => {
          const stockInfo = getStockInfo(product.stock, product.unit);
          return (
            <Card key={product.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-lg">
                    {getCategoryIcon(product.category)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {product.wholesalers?.name ?? "—"} · per {product.unit}
                        </p>
                      </div>
                      <Badge variant={stockInfo.variant} className="shrink-0 text-[10px]">
                        {product.stock}
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-xs">
                      <span className="font-bold text-primary">{formatPrice(product.price)}</span>
                      <Badge variant="outline" className="text-[10px] capitalize">{product.category}</Badge>
                      <span className="text-muted-foreground">MOQ: {product.min_order_qty ?? 1}</span>
                    </div>
                  </div>
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
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">MOQ</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead>Wholesaler</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => {
                const stockInfo = getStockInfo(product.stock, product.unit);
                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-lg">
                          {getCategoryIcon(product.category)}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            per {product.unit}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs capitalize">
                        {product.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatPrice(product.price)}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {product.min_order_qty ?? 1} {product.unit}s
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={stockInfo.variant} className="text-xs">
                        {product.stock}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {product.wholesalers?.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
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
