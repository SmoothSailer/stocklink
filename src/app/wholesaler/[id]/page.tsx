import { ShoppingBag } from "lucide-react";
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
  mockProducts,
  mockWholesalers,
  mockOrders,
  mockOrderItems,
} from "@/lib/mock-data";
import { formatPrice, getStockInfo, getCategoryIcon } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";

interface WholesalerPageProps {
  params: Promise<{ id: string }>;
}

export default async function WholesalerPage({ params }: WholesalerPageProps) {
  const { id } = await params;
  const wholesaler = mockWholesalers.find((w) => w.id === id);

  if (!wholesaler) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <span className="text-5xl">🏪</span>
        <p className="mt-3 text-lg font-semibold">Wholesaler not found</p>
      </div>
    );
  }

  const products = mockProducts.filter(
    (p) => p.wholesaler_id === wholesaler.id
  );

  // Find pending orders that contain this wholesaler's products
  const productIds = new Set(products.map((p) => p.id));
  const relevantOrderItems = mockOrderItems.filter(
    (oi) => oi.product_id && productIds.has(oi.product_id)
  );
  const pendingOrderIds = new Set(
    relevantOrderItems
      .map((oi) => oi.order_id)
      .filter((orderId) => {
        const order = mockOrders.find((o) => o.id === orderId);
        return order && order.status !== "delivered" && order.status !== "cancelled";
      })
  );

  const totalStock = products.reduce((acc, p) => acc + p.stock, 0);
  const totalValue = products.reduce((acc, p) => acc + p.price * p.stock, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <ShoppingBag className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-bold">{APP_NAME}</p>
            <p className="text-[10px] text-muted-foreground">
              Wholesaler View
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6">
        {/* Wholesaler info */}
        <div>
          <h1 className="text-2xl font-bold">{wholesaler.name}</h1>
          <p className="text-sm text-muted-foreground">
            {wholesaler.location} · {wholesaler.phone}
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{products.length}</p>
              <p className="text-xs text-muted-foreground">Products</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{totalStock}</p>
              <p className="text-xs text-muted-foreground">Total Stock</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{pendingOrderIds.size}</p>
              <p className="text-xs text-muted-foreground">Pending Orders</p>
            </CardContent>
          </Card>
        </div>

        {/* Inventory table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Inventory</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">MOQ</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Pending Orders</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => {
                  const stockInfo = getStockInfo(product.stock, product.unit);
                  const productPendingOrders = relevantOrderItems.filter(
                    (oi) =>
                      oi.product_id === product.id &&
                      pendingOrderIds.has(oi.order_id!)
                  ).length;

                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {getCategoryIcon(product.category)}
                          </span>
                          <span className="text-sm font-medium">
                            {product.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-xs capitalize"
                        >
                          {product.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatPrice(product.price)}/{product.unit}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {product.min_order_qty ?? 1} {product.unit}s
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={stockInfo.variant} className="text-xs">
                          {product.stock}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {productPendingOrders > 0 ? (
                          <Badge variant="secondary" className="text-xs">
                            {productPendingOrders}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Footer notice */}
        <p className="text-center text-xs text-muted-foreground">
          This is a read-only view. Contact the {APP_NAME} team for stock updates.
        </p>
      </main>
    </div>
  );
}
