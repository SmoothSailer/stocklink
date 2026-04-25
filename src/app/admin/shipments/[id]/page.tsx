"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Ship,
  Package,
  DollarSign,
  FileText,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
import { ShipmentTimeline } from "@/components/admin/shipment-timeline";
import {
  getShipment,
  getShipmentItems,
  getShipmentStatusHistory,
  addShipmentItem,
  deleteShipmentItem,
  updateShipment,
  updateShipmentStatus,
} from "../actions";
import { getProducts } from "@/app/admin/actions";
import {
  SHIPMENT_STATUSES,
  COUNTRIES,
  CURRENCIES,
} from "@/lib/constants";
import type { ShipmentStatusHistory } from "@/types/database";

type Shipment = Awaited<ReturnType<typeof getShipment>>;
type ShipmentItem = Awaited<ReturnType<typeof getShipmentItems>>[number];

const statusFlow = [
  "draft",
  "booked",
  "in_production",
  "ready_for_shipping",
  "in_transit",
  "at_port",
  "customs_clearance",
  "inland_transit",
  "delivered",
] as const;

export default function ShipmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [items, setItems] = useState<ShipmentItem[]>([]);
  const [history, setHistory] = useState<ShipmentStatusHistory[]>([]);
  const [products, setProducts] = useState<{ id: string; name: string; unit: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [costEditOpen, setCostEditOpen] = useState(false);
  const [statusNotes, setStatusNotes] = useState("");
  const [statusLocation, setStatusLocation] = useState("");
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [s, i, h, p] = await Promise.all([
        getShipment(id),
        getShipmentItems(id),
        getShipmentStatusHistory(id),
        getProducts(),
      ]);
      setShipment(s);
      setItems(i);
      setHistory(h);
      setProducts(p.map((pr) => ({ id: pr.id, name: pr.name, unit: pr.unit })));
    } catch {
      router.push("/admin/shipments");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading || !shipment) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
        <div className="h-48 animate-pulse rounded-lg bg-muted" />
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  const statusInfo = SHIPMENT_STATUSES[shipment.status as keyof typeof SHIPMENT_STATUSES];
  const currentIdx = statusFlow.indexOf(shipment.status as typeof statusFlow[number]);
  const nextStatus = currentIdx >= 0 && currentIdx < statusFlow.length - 1 ? statusFlow[currentIdx + 1] : null;
  const currencySymbol = CURRENCIES.find((c) => c.value === shipment.currency)?.symbol ?? shipment.currency;

  async function handleAdvanceStatus() {
    if (!nextStatus) return;
    setSaving(true);
    await updateShipmentStatus(id, nextStatus, statusNotes, statusLocation);
    setStatusNotes("");
    setStatusLocation("");
    setSaving(false);
    await loadData();
  }

  async function handleCancelStatus() {
    setSaving(true);
    await updateShipmentStatus(id, "cancelled", statusNotes, statusLocation);
    setStatusNotes("");
    setSaving(false);
    await loadData();
  }

  async function handleAddItem(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await addShipmentItem(id, {
      product_id: (fd.get("product_id") as string) || null,
      description: fd.get("description") as string,
      quantity: parseInt(fd.get("quantity") as string),
      unit: (fd.get("unit") as string) || undefined,
      unit_cost_foreign: fd.get("unit_cost_foreign")
        ? parseFloat(fd.get("unit_cost_foreign") as string)
        : undefined,
      hs_code: (fd.get("hs_code") as string) || undefined,
      country_of_origin: (fd.get("country_of_origin") as string) || undefined,
    });
    setAddItemOpen(false);
    await loadData();
  }

  async function handleDeleteItem(itemId: string) {
    await deleteShipmentItem(itemId, id);
    await loadData();
  }

  async function handleSaveCosts(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const costData: Record<string, unknown> = {};
    [
      "freight_cost",
      "insurance_cost",
      "customs_duty",
      "excise_duty",
      "vat",
      "port_charges",
      "inland_transport",
      "other_charges",
      "exchange_rate",
    ].forEach((field) => {
      const val = fd.get(field) as string;
      if (val) costData[field] = parseFloat(val);
    });

    // Calculate total_cost_kes
    if (!shipment) return;
    const exchangeRate = (costData.exchange_rate as number) ?? shipment.exchange_rate ?? 1;
    const overheadCosts =
      ((costData.freight_cost as number) ?? shipment.freight_cost ?? 0) +
      ((costData.insurance_cost as number) ?? shipment.insurance_cost ?? 0) +
      ((costData.customs_duty as number) ?? shipment.customs_duty ?? 0) +
      ((costData.excise_duty as number) ?? shipment.excise_duty ?? 0) +
      ((costData.vat as number) ?? shipment.vat ?? 0) +
      ((costData.port_charges as number) ?? shipment.port_charges ?? 0) +
      ((costData.inland_transport as number) ?? shipment.inland_transport ?? 0) +
      ((costData.other_charges as number) ?? shipment.other_charges ?? 0);
    const totalForeign = (shipment.total_cost_foreign ?? 0) + overheadCosts;
    costData.total_cost_kes = totalForeign * exchangeRate;

    await updateShipment(id, costData);
    setCostEditOpen(false);
    await loadData();
  }

  const containerNumber = shipment.container_number;
  const totalItemsCost = items.reduce((sum, i) => sum + (i.total_cost_foreign ?? 0), 0);
  const overheadTotal =
    (shipment.freight_cost ?? 0) +
    (shipment.insurance_cost ?? 0) +
    (shipment.customs_duty ?? 0) +
    (shipment.excise_duty ?? 0) +
    (shipment.vat ?? 0) +
    (shipment.port_charges ?? 0) +
    (shipment.inland_transport ?? 0) +
    (shipment.other_charges ?? 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/shipments">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold sm:text-xl">{shipment.shipment_number}</h1>
              <Badge className={`text-[10px] ${statusInfo?.color ?? ""}`}>
                {statusInfo?.icon} {statusInfo?.label ?? shipment.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {COUNTRIES.find((c) => c.value === shipment.origin_country)?.flag}{" "}
              {shipment.origin_port ?? shipment.origin_country} → {shipment.destination_port}
              {shipment.manufacturers && ` • ${shipment.manufacturers.name}`}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Left column: Timeline + Status advance */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="mb-3 text-sm font-semibold">Shipment Timeline</h3>
              <ShipmentTimeline history={history} currentStatus={shipment.status} />
            </CardContent>
          </Card>

          {/* Advance status */}
          {shipment.status !== "delivered" && shipment.status !== "cancelled" && (
            <Card>
              <CardContent className="space-y-3 p-4">
                <h3 className="text-sm font-semibold">Update Status</h3>
                <div className="space-y-2">
                  <Input
                    placeholder="Location (optional)"
                    value={statusLocation}
                    onChange={(e) => setStatusLocation(e.target.value)}
                  />
                  <Input
                    placeholder="Notes (optional)"
                    value={statusNotes}
                    onChange={(e) => setStatusNotes(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  {nextStatus && (
                    <Button
                      size="sm"
                      className="flex-1 gap-1"
                      disabled={saving}
                      onClick={handleAdvanceStatus}
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                      {SHIPMENT_STATUSES[nextStatus]?.label}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={saving}
                    onClick={handleCancelStatus}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column: Details, Items, Costs */}
        <div className="space-y-4 lg:col-span-2">
          {/* Shipment info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Shipment Details</h3>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-3">
                <div>
                  <p className="text-xs text-muted-foreground">Shipping Method</p>
                  <p className="font-medium capitalize">{shipment.shipping_method}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Container</p>
                  <p className="font-medium">{containerNumber ?? shipment.container_type ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Bill of Lading</p>
                  <p className="font-medium">{shipment.bill_of_lading ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Currency</p>
                  <p className="font-medium">{shipment.currency}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Est. Departure</p>
                  <p className="font-medium">
                    {shipment.estimated_departure
                      ? new Date(shipment.estimated_departure).toLocaleDateString("en-KE")
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Est. Arrival</p>
                  <p className="font-medium">
                    {shipment.estimated_arrival
                      ? new Date(shipment.estimated_arrival).toLocaleDateString("en-KE")
                      : "—"}
                  </p>
                </div>
              </div>
              {shipment.notes && (
                <p className="mt-3 text-sm text-muted-foreground">
                  {shipment.notes}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Items ({items.length})</h3>
                <Button size="sm" variant="outline" className="gap-1" onClick={() => setAddItemOpen(true)}>
                  <Plus className="h-3.5 w-3.5" />
                  Add Item
                </Button>
              </div>
              {items.length > 0 && (
                <Table className="mt-3">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Unit Cost</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>HS Code</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">{item.description}</p>
                            {item.products && (
                              <p className="text-[10px] text-muted-foreground">
                                Linked: {item.products.name}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {item.quantity} {item.unit ?? ""}
                        </TableCell>
                        <TableCell>
                          {item.unit_cost_foreign != null
                            ? `${currencySymbol}${item.unit_cost_foreign.toLocaleString()}`
                            : "—"}
                        </TableCell>
                        <TableCell>
                          {item.total_cost_foreign != null
                            ? `${currencySymbol}${item.total_cost_foreign.toLocaleString()}`
                            : "—"}
                        </TableCell>
                        <TableCell className="text-xs">{item.hs_code ?? "—"}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleDeleteItem(item.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Cost breakdown */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Cost Breakdown</h3>
                <Button size="sm" variant="outline" className="gap-1" onClick={() => setCostEditOpen(true)}>
                  <DollarSign className="h-3.5 w-3.5" />
                  Edit Costs
                </Button>
              </div>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Items (FOB)</span>
                  <span>{currencySymbol}{totalItemsCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Freight</span>
                  <span>{currencySymbol}{(shipment.freight_cost ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Insurance</span>
                  <span>{currencySymbol}{(shipment.insurance_cost ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customs Duty</span>
                  <span>{currencySymbol}{(shipment.customs_duty ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Excise Duty</span>
                  <span>{currencySymbol}{(shipment.excise_duty ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">VAT</span>
                  <span>{currencySymbol}{(shipment.vat ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Port Charges</span>
                  <span>{currencySymbol}{(shipment.port_charges ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Inland Transport</span>
                  <span>{currencySymbol}{(shipment.inland_transport ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Other Charges</span>
                  <span>{currencySymbol}{(shipment.other_charges ?? 0).toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total ({shipment.currency})</span>
                  <span>{currencySymbol}{(totalItemsCost + overheadTotal).toLocaleString()}</span>
                </div>
                {shipment.exchange_rate && (
                  <>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Exchange Rate</span>
                      <span>1 {shipment.currency} = KSh {shipment.exchange_rate}</span>
                    </div>
                    <div className="flex justify-between font-bold text-primary">
                      <span>Total Landed Cost (KES)</span>
                      <span>KSh {(shipment.total_cost_kes ?? 0).toLocaleString()}</span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Item Dialog */}
      <Dialog open={addItemOpen} onOpenChange={setAddItemOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Shipment Item</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddItem} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Link to Product (optional)</label>
              <select
                name="product_id"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">No product link</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.unit})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Description <span className="text-destructive">*</span>
              </label>
              <Input name="description" placeholder="Product description" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Quantity <span className="text-destructive">*</span>
                </label>
                <Input name="quantity" type="number" min="1" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Unit</label>
                <Input name="unit" placeholder="e.g. bags, boxes" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Unit Cost ({shipment.currency})</label>
                <Input name="unit_cost_foreign" type="number" step="0.01" min="0" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">HS Code</label>
                <Input name="hs_code" placeholder="e.g. 1006.30" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Country of Origin</label>
              <select
                name="country_of_origin"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                defaultValue={shipment.origin_country}
              >
                {COUNTRIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.flag} {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setAddItemOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Item</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Costs Dialog */}
      <Dialog open={costEditOpen} onOpenChange={setCostEditOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto max-w-[calc(100vw-2rem)] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Costs ({shipment.currency})</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveCosts} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Freight</label>
                <Input name="freight_cost" type="number" step="0.01" defaultValue={shipment.freight_cost ?? 0} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Insurance</label>
                <Input name="insurance_cost" type="number" step="0.01" defaultValue={shipment.insurance_cost ?? 0} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Customs Duty</label>
                <Input name="customs_duty" type="number" step="0.01" defaultValue={shipment.customs_duty ?? 0} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Excise Duty</label>
                <Input name="excise_duty" type="number" step="0.01" defaultValue={shipment.excise_duty ?? 0} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">VAT</label>
                <Input name="vat" type="number" step="0.01" defaultValue={shipment.vat ?? 0} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Port Charges</label>
                <Input name="port_charges" type="number" step="0.01" defaultValue={shipment.port_charges ?? 0} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Inland Transport</label>
                <Input name="inland_transport" type="number" step="0.01" defaultValue={shipment.inland_transport ?? 0} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Other Charges</label>
                <Input name="other_charges" type="number" step="0.01" defaultValue={shipment.other_charges ?? 0} />
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Exchange Rate (1 {shipment.currency} = ? KES)
              </label>
              <Input
                name="exchange_rate"
                type="number"
                step="0.0001"
                placeholder="e.g. 129.50"
                defaultValue={shipment.exchange_rate ?? ""}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setCostEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Costs</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
