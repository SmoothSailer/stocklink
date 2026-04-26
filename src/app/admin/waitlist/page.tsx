"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Bell,
  BellOff,
  Users,
  Package,
  Trash2,
  Phone,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
  getWaitlistEntries,
  getWaitlistSummary,
  notifyWaitlistEntry,
  notifyAllWaitlist,
  removeWaitlistEntry,
  clearProductWaitlist,
} from "@/app/admin/actions";

interface WaitlistEntry {
  id: string;
  product_id: string;
  retailer_id: string;
  quantity_interested: number;
  notes: string | null;
  notified: boolean;
  notified_at: string | null;
  created_at: string;
  products: {
    id: string;
    name: string;
    category: string;
    image_url: string | null;
    is_coming_soon: boolean;
    expected_arrival_date: string | null;
  };
  retailers: {
    id: string;
    name: string;
    phone: string | null;
    business_name: string | null;
  };
}

interface ProductSummary {
  id: string;
  name: string;
  category: string;
  image_url: string | null;
  is_coming_soon: boolean;
  expected_arrival_date: string | null;
  product_waitlist: { count: number }[];
}

export default function WaitlistPage() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [productFilter, setProductFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: string; id: string } | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [entriesData, summaryData] = await Promise.all([
        getWaitlistEntries(),
        getWaitlistSummary(),
      ]);
      setEntries(entriesData as WaitlistEntry[]);
      setProducts(summaryData as ProductSummary[]);
    } catch {
      // Empty state on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = entries.filter((e) => {
    const matchesProduct = productFilter === "all" || e.product_id === productFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "notified" && e.notified) ||
      (statusFilter === "pending" && !e.notified);
    return matchesProduct && matchesStatus;
  });

  const totalWaiters = entries.length;
  const notifiedCount = entries.filter((e) => e.notified).length;
  const pendingCount = entries.filter((e) => !e.notified).length;
  const totalDemand = entries.reduce((sum, e) => sum + e.quantity_interested, 0);

  async function handleNotify(entryId: string) {
    setActionLoading(entryId);
    const result = await notifyWaitlistEntry(entryId);
    if (!result.error) await loadData();
    setActionLoading(null);
  }

  async function handleNotifyAll(productId: string) {
    setActionLoading(`notify-all-${productId}`);
    const result = await notifyAllWaitlist(productId);
    if (!result.error) await loadData();
    setActionLoading(null);
    setConfirmAction(null);
  }

  async function handleRemove(entryId: string) {
    setActionLoading(entryId);
    const result = await removeWaitlistEntry(entryId);
    if (!result.error) await loadData();
    setActionLoading(null);
    setConfirmAction(null);
  }

  async function handleClearAll(productId: string) {
    setActionLoading(`clear-${productId}`);
    const result = await clearProductWaitlist(productId);
    if (!result.error) await loadData();
    setActionLoading(null);
    setConfirmAction(null);
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-KE", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function formatDateTime(dateStr: string) {
    return new Date(dateStr).toLocaleString("en-KE", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold sm:text-2xl">Waitlist Management</h1>
        <p className="text-xs text-muted-foreground sm:text-sm">
          Manage retailer interest in coming soon products
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-2 p-3 sm:gap-3 sm:p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 sm:h-10 sm:w-10">
              <Users className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold sm:text-2xl">{totalWaiters}</p>
              <p className="truncate text-[10px] text-muted-foreground sm:text-xs">Total Waiters</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-2 p-3 sm:gap-3 sm:p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 sm:h-10 sm:w-10">
              <Clock className="h-4 w-4 text-amber-600 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold sm:text-2xl">{pendingCount}</p>
              <p className="truncate text-[10px] text-muted-foreground sm:text-xs">Pending Notify</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-2 p-3 sm:gap-3 sm:p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-100 sm:h-10 sm:w-10">
              <CheckCircle2 className="h-4 w-4 text-green-600 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold sm:text-2xl">{notifiedCount}</p>
              <p className="truncate text-[10px] text-muted-foreground sm:text-xs">Notified</p>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-2 lg:col-span-1">
          <CardContent className="flex items-center gap-2 p-3 sm:gap-3 sm:p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 sm:h-10 sm:w-10">
              <Package className="h-4 w-4 text-blue-600 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold sm:text-2xl">{totalDemand}</p>
              <p className="truncate text-[10px] text-muted-foreground sm:text-xs">Units Demanded</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Product summary cards */}
      {products.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Coming Soon Products
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => {
              const count = product.product_waitlist?.[0]?.count ?? 0;
              const productEntries = entries.filter((e) => e.product_id === product.id);
              const pendingNotify = productEntries.filter((e) => !e.notified).length;
              const demand = productEntries.reduce((sum, e) => sum + e.quantity_interested, 0);

              return (
                <Card key={product.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{product.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{product.category}</p>
                        {product.expected_arrival_date && (
                          <p className="mt-1 text-xs text-amber-600">
                            Expected: {formatDate(product.expected_arrival_date)}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline" className="shrink-0 text-xs">
                        {count} waiting
                      </Badge>
                    </div>
                    <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        {demand} units
                      </span>
                      {pendingNotify > 0 && (
                        <span className="flex items-center gap-1 text-amber-600">
                          <Bell className="h-3 w-3" />
                          {pendingNotify} to notify
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex gap-2">
                      {pendingNotify > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 flex-1 gap-1.5 text-xs"
                          disabled={actionLoading === `notify-all-${product.id}`}
                          onClick={() => {
                            if (confirmAction?.type === "notify-all" && confirmAction.id === product.id) {
                              handleNotifyAll(product.id);
                            } else {
                              setConfirmAction({ type: "notify-all", id: product.id });
                            }
                          }}
                        >
                          <Bell className="h-3 w-3" />
                          {confirmAction?.type === "notify-all" && confirmAction.id === product.id
                            ? "Confirm Notify All?"
                            : `Notify All (${pendingNotify})`}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5 text-xs text-destructive hover:text-destructive"
                        disabled={actionLoading === `clear-${product.id}` || count === 0}
                        onClick={() => {
                          if (confirmAction?.type === "clear" && confirmAction.id === product.id) {
                            handleClearAll(product.id);
                          } else {
                            setConfirmAction({ type: "clear", id: product.id });
                          }
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                        {confirmAction?.type === "clear" && confirmAction.id === product.id
                          ? "Confirm Clear?"
                          : "Clear All"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Select
          value={productFilter}
          onValueChange={(val) => setProductFilter(val ?? "all")}
        >
          <SelectTrigger className="w-full sm:w-[220px]">
            <SelectValue placeholder="All Products" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Products</SelectItem>
            {products.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={(val) => setStatusFilter(val ?? "all")}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending Notify</SelectItem>
            <SelectItem value="notified">Notified</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Entries */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm font-medium text-muted-foreground">
              {entries.length === 0 ? "No waitlist entries yet" : "No entries match filters"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {entries.length === 0
                ? "Retailers will appear here when they join a waitlist"
                : "Try adjusting your filters"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* ─── Mobile Card List ─── */}
          <div className="space-y-3 lg:hidden">
            {filtered.map((entry) => (
              <Card key={entry.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {entry.retailers.business_name || entry.retailers.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {entry.products.name}
                      </p>
                    </div>
                    <Badge
                      variant={entry.notified ? "default" : "outline"}
                      className={`shrink-0 text-[10px] ${entry.notified ? "bg-green-100 text-green-700" : "border-amber-400 text-amber-600"}`}
                    >
                      {entry.notified ? "Notified" : "Pending"}
                    </Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      {entry.quantity_interested} units
                    </span>
                    {entry.retailers.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {entry.retailers.phone}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDateTime(entry.created_at)}
                    </span>
                  </div>
                  {entry.notes && (
                    <p className="mt-2 rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
                      {entry.notes}
                    </p>
                  )}
                  <div className="mt-3 flex gap-2 border-t pt-3">
                    {!entry.notified && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 flex-1 gap-1.5 text-xs"
                        disabled={actionLoading === entry.id}
                        onClick={() => handleNotify(entry.id)}
                      >
                        <Bell className="h-3 w-3" />
                        Mark Notified
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 text-xs text-destructive hover:text-destructive"
                      disabled={actionLoading === entry.id}
                      onClick={() => {
                        if (confirmAction?.type === "remove" && confirmAction.id === entry.id) {
                          handleRemove(entry.id);
                        } else {
                          setConfirmAction({ type: "remove", id: entry.id });
                        }
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                      {confirmAction?.type === "remove" && confirmAction.id === entry.id
                        ? "Confirm?"
                        : "Remove"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* ─── Desktop Table ─── */}
          <Card className="hidden lg:block">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Retailer</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">
                            {entry.retailers.business_name || entry.retailers.name}
                          </p>
                          {entry.retailers.phone && (
                            <p className="text-xs text-muted-foreground">{entry.retailers.phone}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{entry.products.name}</p>
                        <p className="text-xs capitalize text-muted-foreground">{entry.products.category}</p>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {entry.quantity_interested}
                      </TableCell>
                      <TableCell>
                        <p className="max-w-[200px] truncate text-xs text-muted-foreground">
                          {entry.notes || "—"}
                        </p>
                      </TableCell>
                      <TableCell>
                        {entry.notified ? (
                          <Badge className="bg-green-100 text-green-700 text-xs">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Notified
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-amber-400 text-amber-600 text-xs">
                            <AlertTriangle className="mr-1 h-3 w-3" />
                            Pending
                          </Badge>
                        )}
                        {entry.notified_at && (
                          <p className="mt-0.5 text-[10px] text-muted-foreground">
                            {formatDateTime(entry.notified_at)}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDateTime(entry.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {!entry.notified && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Mark as notified"
                              disabled={actionLoading === entry.id}
                              onClick={() => handleNotify(entry.id)}
                            >
                              <Bell className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            title="Remove entry"
                            disabled={actionLoading === entry.id}
                            onClick={() => {
                              if (confirmAction?.type === "remove" && confirmAction.id === entry.id) {
                                handleRemove(entry.id);
                              } else {
                                setConfirmAction({ type: "remove", id: entry.id });
                              }
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
