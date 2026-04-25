"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Ship,
  Plane as PlaneIcon,
  Truck,
  Eye,
  Trash2,
  Factory,
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getShipments,
  createShipment,
  deleteShipment,
  getInternationalManufacturers,
} from "./actions";
import {
  SHIPMENT_STATUSES,
  SHIPPING_METHODS,
  CONTAINER_TYPES,
  COUNTRIES,
  CURRENCIES,
} from "@/lib/constants";

type ShipmentWithMfr = Awaited<ReturnType<typeof getShipments>>[number];
type MfrOption = Awaited<ReturnType<typeof getInternationalManufacturers>>[number];

const shippingIcons = { sea: Ship, air: PlaneIcon, road: Truck };

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState<ShipmentWithMfr[]>([]);
  const [manufacturers, setManufacturers] = useState<MfrOption[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [s, m] = await Promise.all([
        getShipments(),
        getInternationalManufacturers(),
      ]);
      setShipments(s);
      setManufacturers(m);
    } catch {
      // error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = shipments.filter((s) => {
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.shipment_number.toLowerCase().includes(q) ||
      (s.manufacturers?.name ?? "").toLowerCase().includes(q) ||
      s.origin_country.toLowerCase().includes(q) ||
      (s.container_number ?? "").toLowerCase().includes(q)
    );
  });

  const activeCount = shipments.filter(
    (s) => !["delivered", "cancelled"].includes(s.status)
  ).length;
  const deliveredCount = shipments.filter((s) => s.status === "delivered").length;

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const formData = new FormData(e.currentTarget);
      const result = await createShipment(formData);
      if (result.error) {
        setFormError(result.error);
        setSaving(false);
        return;
      }
      setDialogOpen(false);
      await loadData();
    } catch {
      setFormError("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    await deleteShipment(id);
    setDeleteConfirmId(null);
    await loadData();
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">Sambaza Shipments</h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Track international cargo from manufacturer to warehouse
          </p>
        </div>
        <Button className="w-full gap-2 sm:w-auto" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          New Shipment
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Card>
          <CardContent className="flex items-center gap-2 p-3 sm:gap-3 sm:p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 sm:h-10 sm:w-10">
              <Ship className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold sm:text-2xl">{shipments.length}</p>
              <p className="truncate text-[10px] text-muted-foreground sm:text-xs">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-2 p-3 sm:gap-3 sm:p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-100 sm:h-10 sm:w-10">
              <Ship className="h-4 w-4 text-cyan-600 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold sm:text-2xl">{activeCount}</p>
              <p className="truncate text-[10px] text-muted-foreground sm:text-xs">In Progress</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-2 p-3 sm:gap-3 sm:p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-100 sm:h-10 sm:w-10">
              <Ship className="h-4 w-4 text-green-600 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold sm:text-2xl">{deliveredCount}</p>
              <p className="truncate text-[10px] text-muted-foreground sm:text-xs">Delivered</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 overflow-x-auto rounded-lg border border-border p-1">
          {["all", "draft", "in_transit", "at_port", "customs_clearance", "delivered"].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                statusFilter === tab
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "all" ? "All" : SHIPMENT_STATUSES[tab as keyof typeof SHIPMENT_STATUSES]?.label ?? tab}
            </button>
          ))}
        </div>
        <div className="relative sm:max-w-sm sm:flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search shipments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 lg:hidden">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Ship className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="font-medium">No shipments found</p>
              <p className="text-sm text-muted-foreground">
                {search ? "Try a different search" : "Create your first shipment"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filtered.map((s) => {
            const statusInfo = SHIPMENT_STATUSES[s.status as keyof typeof SHIPMENT_STATUSES];
            const ShipIcon = shippingIcons[s.shipping_method as keyof typeof shippingIcons] ?? Ship;
            return (
              <Link key={s.id} href={`/admin/shipments/${s.id}`}>
                <Card className="transition-all hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <ShipIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-semibold">{s.shipment_number}</span>
                      </div>
                      <Badge className={`text-[10px] ${statusInfo?.color ?? ""}`}>
                        {statusInfo?.icon} {statusInfo?.label ?? s.status}
                      </Badge>
                    </div>
                    <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                      {s.manufacturers && (
                        <p className="flex items-center gap-1">
                          <Factory className="h-3 w-3" />
                          {COUNTRIES.find((c) => c.value === s.manufacturers?.country_code)?.flag ?? "🏳️"}{" "}
                          {s.manufacturers.name}
                        </p>
                      )}
                      <p>
                        {COUNTRIES.find((c) => c.value === s.origin_country)?.flag ?? "🏳️"}{" "}
                        {s.origin_port ?? s.origin_country} → {s.destination_port}
                      </p>
                      {s.estimated_arrival && (
                        <p>ETA: {new Date(s.estimated_arrival).toLocaleDateString("en-KE")}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })
        )}
      </div>

      {/* Desktop table */}
      <Card className="hidden lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Shipment #</TableHead>
              <TableHead>Manufacturer</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>ETA</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center">
                  <Ship className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="font-medium">No shipments found</p>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((s) => {
                const statusInfo = SHIPMENT_STATUSES[s.status as keyof typeof SHIPMENT_STATUSES];
                const ShipIcon = shippingIcons[s.shipping_method as keyof typeof shippingIcons] ?? Ship;
                return (
                  <TableRow key={s.id}>
                    <TableCell>
                      <span className="font-medium">{s.shipment_number}</span>
                      {s.container_number && (
                        <p className="text-xs text-muted-foreground">{s.container_number}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      {s.manufacturers ? (
                        <span className="flex items-center gap-1 text-sm">
                          {COUNTRIES.find((c) => c.value === s.manufacturers?.country_code)?.flag ?? "🏳️"}{" "}
                          {s.manufacturers.name}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {s.origin_port ?? s.origin_country} → {s.destination_port}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 text-sm">
                        <ShipIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        {SHIPPING_METHODS.find((m) => m.value === s.shipping_method)?.label ?? s.shipping_method}
                      </span>
                    </TableCell>
                    <TableCell>
                      {s.estimated_arrival ? (
                        <span className="text-sm">
                          {new Date(s.estimated_arrival).toLocaleDateString("en-KE", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] ${statusInfo?.color ?? ""}`}>
                        {statusInfo?.icon} {statusInfo?.label ?? s.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Link href={`/admin/shipments/${s.id}`}>
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        {s.status === "draft" && (
                          deleteConfirmId === s.id ? (
                            <div className="flex items-center gap-1">
                              <Button variant="destructive" size="sm" onClick={() => handleDelete(s.id)}>
                                Confirm
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => setDeleteConfirmId(null)}>
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <Button variant="ghost" size="icon" onClick={() => setDeleteConfirmId(s.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Create dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto max-w-[calc(100vw-2rem)] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New Shipment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Manufacturer</label>
              <select
                name="manufacturer_id"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Select manufacturer</option>
                {manufacturers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {COUNTRIES.find((c) => c.value === m.country_code)?.flag ?? ""} {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Origin Country <span className="text-destructive">*</span>
                </label>
                <select
                  name="origin_country"
                  required
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {COUNTRIES.filter((c) => c.value !== "KE").map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.flag} {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Origin Port</label>
                <Input name="origin_port" placeholder="e.g. Shanghai, Jebel Ali" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Destination Port</label>
                <Input name="destination_port" placeholder="Mombasa" defaultValue="Mombasa" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Destination Warehouse</label>
                <Input name="destination_warehouse" placeholder="e.g. Nairobi Warehouse" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Shipping Method <span className="text-destructive">*</span>
                </label>
                <select
                  name="shipping_method"
                  required
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {SHIPPING_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.icon} {m.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Container Type</label>
                <select
                  name="container_type"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Select type</option>
                  {CONTAINER_TYPES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Currency</label>
              <select
                name="currency"
                defaultValue="USD"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.symbol} {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Est. Departure</label>
                <Input name="estimated_departure" type="date" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Est. Arrival</label>
                <Input name="estimated_arrival" type="date" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <Input name="notes" placeholder="Additional notes..." />
            </div>

            {formError && (
              <p className="text-sm text-destructive">{formError}</p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Creating..." : "Create Shipment"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
