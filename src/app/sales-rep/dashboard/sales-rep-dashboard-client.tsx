"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Store,
  Package,
  ClipboardList,
  TrendingUp,
  MessageCircle,
  Phone,
  MapPin,
  AlertTriangle,
  LogOut,
  Send,
  ChevronRight,
  Plus,
  Edit,
  Minus,
  Factory,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatPrice, buildWhatsAppLink, timeAgo } from "@/lib/utils";
import { ORDER_STATUSES } from "@/lib/constants";
import { salesRepSignOut } from "@/app/sales-rep/auth/actions";
import {
  repCreateWholesaler,
  repUpdateWholesaler,
  repCreateProduct,
  repUpdateProduct,
  repCreateManufacturer,
  repUpdateManufacturer,
  repSaveProductUnitOptions,
} from "@/app/sales-rep/actions";
import type { SalesRep, Wholesaler, Order, OrderStatus, Manufacturer } from "@/types/database";

interface UnitOptionRow {
  unit_slug: string;
  price: number;
  stock: number;
  min_order_qty: number;
}

interface ProductWithWholesaler {
  id: string;
  name: string;
  price: number;
  stock: number;
  unit: string;
  category: string;
  wholesaler_id: string | null;
  manufacturer_id: string | null;
  wholesalers: { id: string; name: string; location: string | null } | null;
  manufacturers: { id: string; name: string } | null;
  product_unit_options?: { id: string; unit_slug: string; price: number; stock: number; min_order_qty: number; sort_order: number }[];
}

interface OrderWithItems extends Order {
  order_items: {
    id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    products: {
      name: string;
      unit: string;
      wholesaler_id: string | null;
      wholesalers: { name: string } | null;
    } | null;
  }[];
}

interface DashboardStats {
  totalWholesalers: number;
  totalManufacturers: number;
  totalProducts: number;
  lowStockProducts: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
}

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

interface UnitOption {
  id: string;
  name: string;
  slug: string;
  abbreviation: string | null;
}

interface Props {
  rep: SalesRep;
  wholesalers: Wholesaler[];
  orders: OrderWithItems[];
  stats: DashboardStats;
  products: ProductWithWholesaler[];
  manufacturers: Manufacturer[];
  categories: CategoryOption[];
  units: UnitOption[];
}

type Tab = "overview" | "wholesalers" | "manufacturers" | "orders" | "products";

export default function SalesRepDashboardClient({
  rep,
  wholesalers,
  orders,
  stats,
  products,
  manufacturers,
  categories,
  units,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const initials = rep.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  return (
    <div className="min-h-dvh bg-background pb-20 sm:pb-6">
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-30 border-b bg-card px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{rep.name}</p>
              <p className="text-xs text-muted-foreground">Sales Rep</p>
            </div>
          </div>
          <form action={salesRepSignOut}>
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground"
            >
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Sign out</span>
            </Button>
          </form>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 pt-4">
        {/* ─── Tabs ─── */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as Tab)}
          className="mb-4"
        >
          <TabsList className="h-10 w-full">
            <TabsTrigger value="overview" className="flex-1 text-xs sm:text-sm">
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="wholesalers"
              className="flex-1 text-xs sm:text-sm"
            >
              Wholesalers
            </TabsTrigger>
            <TabsTrigger
              value="manufacturers"
              className="flex-1 text-xs sm:text-sm"
            >
              Mfrs
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex-1 text-xs sm:text-sm">
              Orders
            </TabsTrigger>
            <TabsTrigger value="products" className="flex-1 text-xs sm:text-sm">
              Products
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* ─── Tab Content ─── */}
        {activeTab === "overview" && (
          <OverviewTab
            stats={stats}
            orders={orders}
            wholesalers={wholesalers}
            products={products}
            rep={rep}
          />
        )}
        {activeTab === "wholesalers" && (
          <WholesalersTab wholesalers={wholesalers} rep={rep} />
        )}
        {activeTab === "manufacturers" && (
          <ManufacturersTab manufacturers={manufacturers} rep={rep} />
        )}
        {activeTab === "orders" && <OrdersTab orders={orders} />}
        {activeTab === "products" && (
          <ProductsTab
            products={products}
            wholesalers={wholesalers}
            manufacturers={manufacturers}
            categories={categories}
            units={units}
            rep={rep}
          />
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   Overview Tab
   ════════════════════════════════════════════════════════════════ */

function OverviewTab({
  stats,
  orders,
  wholesalers,
  products,
  rep,
}: {
  stats: DashboardStats;
  orders: OrderWithItems[];
  wholesalers: Wholesaler[];
  products: ProductWithWholesaler[];
  rep: SalesRep;
}) {
  const recentOrders = orders.slice(0, 5);
  const lowStockItems = products.filter((p) => p.stock <= 5).slice(0, 5);

  return (
    <div className="space-y-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
        <StatCard
          icon={<Store className="h-4 w-4 text-primary" />}
          label="Wholesalers"
          value={stats.totalWholesalers}
          bgColor="bg-primary/10"
        />
        <StatCard
          icon={<Factory className="h-4 w-4 text-violet-600" />}
          label="Manufacturers"
          value={stats.totalManufacturers}
          bgColor="bg-violet-100"
        />
        <StatCard
          icon={<Package className="h-4 w-4 text-blue-600" />}
          label="Products"
          value={stats.totalProducts}
          bgColor="bg-blue-100"
        />
        <StatCard
          icon={<ClipboardList className="h-4 w-4 text-orange-600" />}
          label="Pending"
          value={stats.pendingOrders}
          bgColor="bg-orange-100"
        />
        <StatCard
          icon={<ClipboardList className="h-4 w-4 text-green-600" />}
          label="Total Orders"
          value={stats.totalOrders}
          bgColor="bg-green-100"
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4 text-emerald-600" />}
          label="Revenue"
          value={formatPrice(stats.totalRevenue)}
          bgColor="bg-emerald-100"
        />
        <StatCard
          icon={<AlertTriangle className="h-4 w-4 text-destructive" />}
          label="Low Stock"
          value={stats.lowStockProducts}
          bgColor="bg-red-100"
        />
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardContent className="p-4">
            <div className="mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <p className="text-sm font-semibold text-orange-800">
                Low Stock Alert
              </p>
            </div>
            <div className="space-y-2">
              {lowStockItems.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between text-xs"
                >
                  <div className="min-w-0">
                    <span className="font-medium text-foreground">
                      {p.name}
                    </span>
                    <span className="ml-1 text-muted-foreground">
                      ({p.wholesalers?.name ?? p.manufacturers?.name ?? "—"})
                    </span>
                  </div>
                  <Badge
                    variant="destructive"
                    className="ml-2 shrink-0 text-[10px]"
                  >
                    {p.stock} left
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardContent className="p-4">
          <p className="mb-3 text-sm font-semibold">Quick Actions</p>
          <div className="grid grid-cols-2 gap-2">
            {wholesalers.slice(0, 4).map((w) => (
              <a
                key={w.id}
                href={buildWhatsAppLink(
                  `Hi ${rep.name} here from Ristoka — checking in on ${w.name} 👋`,
                  rep.whatsapp_phone
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border p-3 text-xs transition-colors hover:bg-muted"
              >
                <MessageCircle className="h-4 w-4 shrink-0 text-[#25D366]" />
                <span className="truncate">{w.name}</span>
              </a>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Orders */}
      {recentOrders.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <p className="mb-3 text-sm font-semibold">Recent Orders</p>
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   Wholesalers Tab — with Add / Edit
   ════════════════════════════════════════════════════════════════ */

function WholesalersTab({
  wholesalers,
  rep,
}: {
  wholesalers: Wholesaler[];
  rep: SalesRep;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Wholesaler | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  function openAdd() {
    setEditing(null);
    setFormError(null);
    setDialogOpen(true);
  }

  function openEdit(w: Wholesaler) {
    setEditing(w);
    setFormError(null);
    setDialogOpen(true);
  }

  async function handleSubmit(formData: FormData) {
    setFormError(null);
    startTransition(async () => {
      const result = editing
        ? await repUpdateWholesaler(rep.id, editing.id, formData)
        : await repCreateWholesaler(rep.id, formData);
      if (result.error) {
        setFormError(result.error);
        return;
      }
      setDialogOpen(false);
      setEditing(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <Button className="w-full gap-2 sm:w-auto" onClick={openAdd}>
        <Plus className="h-4 w-4" />
        Add Wholesaler
      </Button>

      {wholesalers.length === 0 && !dialogOpen ? (
        <EmptyState
          icon={<Store className="h-10 w-10" />}
          title="No wholesalers yet"
          description="Onboard your first wholesaler to start managing their inventory."
        />
      ) : (
        wholesalers.map((w) => (
          <Card key={w.id}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Store className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{w.name}</p>
                  {w.location && (
                    <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">{w.location}</span>
                    </div>
                  )}
                  {w.phone && (
                    <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3 shrink-0" />
                      <span>{w.phone}</span>
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => openEdit(w)}
                >
                  <Edit className="h-3.5 w-3.5" />
                  <span className="sr-only">Edit</span>
                </Button>
              </div>
              {/* Actions */}
              <div className="mt-3 flex gap-2 border-t pt-3">
                {w.phone && (
                  <a
                    href={`tel:${w.phone}`}
                    className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md border text-xs font-medium transition-colors hover:bg-muted"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    Call
                  </a>
                )}
                <a
                  href={buildWhatsAppLink(
                    `Hi! This is ${rep.name} from Ristoka, reaching out about ${w.name}. 👋`,
                    w.phone?.replace(/[\s\-+]/g, "") ?? rep.whatsapp_phone
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md border text-xs font-medium text-[#25D366] transition-colors hover:bg-green-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  WhatsApp
                </a>
                <a
                  href={`/wholesaler/${w.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md border text-xs font-medium transition-colors hover:bg-muted"
                >
                  <Package className="h-3.5 w-3.5" />
                  Inventory
                </a>
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {/* Add / Edit Wholesaler Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditing(null);
            setFormError(null);
          }
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto max-w-[calc(100vw-2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Wholesaler" : "Add Wholesaler"}
            </DialogTitle>
          </DialogHeader>
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Business Name <span className="text-destructive">*</span>
              </label>
              <Input
                name="name"
                placeholder="e.g. Mama Fatuma Wholesale"
                defaultValue={editing?.name ?? ""}
                required
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Location</label>
              <Input
                name="location"
                placeholder="e.g. Eastleigh, Nairobi"
                defaultValue={editing?.location ?? ""}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone</label>
              <Input
                name="phone"
                type="tel"
                placeholder="+254712345678"
                defaultValue={editing?.phone ?? ""}
                className="h-11"
              />
            </div>
            {formError && (
              <p className="text-sm text-destructive">{formError}</p>
            )}
            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="h-11 sm:h-9"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} className="h-11 sm:h-9">
                {isPending
                  ? "Saving..."
                  : editing
                    ? "Update"
                    : "Add Wholesaler"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   Manufacturers Tab
   ════════════════════════════════════════════════════════════════ */

function ManufacturersTab({
  manufacturers,
  rep,
}: {
  manufacturers: Manufacturer[];
  rep: SalesRep;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Manufacturer | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  function openAdd() {
    setEditing(null);
    setFormError(null);
    setDialogOpen(true);
  }

  function openEdit(m: Manufacturer) {
    setEditing(m);
    setFormError(null);
    setDialogOpen(true);
  }

  async function handleSubmit(formData: FormData) {
    setFormError(null);
    startTransition(async () => {
      const result = editing
        ? await repUpdateManufacturer(rep.id, editing.id, formData)
        : await repCreateManufacturer(rep.id, formData);
      if (result.error) {
        setFormError(result.error);
        return;
      }
      setDialogOpen(false);
      setEditing(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <Button className="w-full gap-2 sm:w-auto" onClick={openAdd}>
        <Plus className="h-4 w-4" />
        Add Manufacturer
      </Button>

      {manufacturers.length === 0 && !dialogOpen ? (
        <EmptyState
          icon={<Factory className="h-10 w-10" />}
          title="No manufacturers yet"
          description="Onboard your first manufacturer to start managing their products."
        />
      ) : (
        manufacturers.map((m) => (
          <Card key={m.id}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-100">
                  <Factory className="h-5 w-5 text-violet-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{m.name}</p>
                  {m.contact_person && (
                    <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <User className="h-3 w-3 shrink-0" />
                      <span className="truncate">{m.contact_person}</span>
                    </div>
                  )}
                  {m.location && (
                    <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">{m.location}</span>
                    </div>
                  )}
                  {m.contact_phone && (
                    <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3 shrink-0" />
                      <span>{m.contact_phone}</span>
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => openEdit(m)}
                >
                  <Edit className="h-3.5 w-3.5" />
                  <span className="sr-only">Edit</span>
                </Button>
              </div>
              {/* Actions */}
              <div className="mt-3 flex gap-2 border-t pt-3">
                {m.contact_phone && (
                  <a
                    href={`tel:${m.contact_phone}`}
                    className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md border text-xs font-medium transition-colors hover:bg-muted"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    Call
                  </a>
                )}
                {m.contact_phone && (
                  <a
                    href={buildWhatsAppLink(
                      `Hi! This is ${rep.name} from Ristoka, reaching out about ${m.name}. 👋`,
                      m.contact_phone.replace(/[\s\-+]/g, "")
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md border text-xs font-medium text-[#25D366] transition-colors hover:bg-green-50"
                  >
                    <Send className="h-3.5 w-3.5" />
                    WhatsApp
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {/* Add / Edit Manufacturer Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditing(null);
            setFormError(null);
          }
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto max-w-[calc(100vw-2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Manufacturer" : "Add Manufacturer"}
            </DialogTitle>
          </DialogHeader>
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Business Name <span className="text-destructive">*</span>
              </label>
              <Input
                name="name"
                placeholder="e.g. Bidco Africa"
                defaultValue={editing?.name ?? ""}
                required
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Contact Person</label>
              <Input
                name="contact_person"
                placeholder="e.g. John Kamau"
                defaultValue={editing?.contact_person ?? ""}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone</label>
              <Input
                name="contact_phone"
                type="tel"
                placeholder="+254712345678"
                defaultValue={editing?.contact_phone ?? ""}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Location</label>
              <Input
                name="location"
                placeholder="e.g. Industrial Area, Nairobi"
                defaultValue={editing?.location ?? ""}
                className="h-11"
              />
            </div>
            {formError && (
              <p className="text-sm text-destructive">{formError}</p>
            )}
            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="h-11 sm:h-9"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} className="h-11 sm:h-9">
                {isPending
                  ? "Saving..."
                  : editing
                    ? "Update"
                    : "Add Manufacturer"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   Orders Tab
   ════════════════════════════════════════════════════════════════ */

function OrdersTab({ orders }: { orders: OrderWithItems[] }) {
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");

  const filteredOrders =
    statusFilter === "all"
      ? orders
      : orders.filter((o) => o.status === statusFilter);

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={<ClipboardList className="h-10 w-10" />}
        title="No orders yet"
        description="Orders for your wholesalers' products will appear here."
      />
    );
  }

  return (
    <div className="space-y-3">
      {/* Status filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {(
          [
            "all",
            "placed",
            "confirmed",
            "out_for_delivery",
            "delivered",
            "cancelled",
          ] as const
        ).map((s) => {
          const count =
            s === "all"
              ? orders.length
              : orders.filter((o) => o.status === s).length;
          if (s !== "all" && count === 0) return null;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === s
                  ? "border-primary bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {s === "all" ? "All" : ORDER_STATUSES[s].label}
              <span className="text-[10px] opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Order list */}
      {filteredOrders.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No orders with this status
        </p>
      ) : (
        filteredOrders.map((order) => (
          <OrderCard key={order.id} order={order} expanded />
        ))
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   Products Tab — with Add / Edit Stock
   ════════════════════════════════════════════════════════════════ */

function ProductsTab({
  products,
  wholesalers,
  manufacturers,
  categories,
  units,
  rep,
}: {
  products: ProductWithWholesaler[];
  wholesalers: Wholesaler[];
  manufacturers: Manufacturer[];
  categories: CategoryOption[];
  units: UnitOption[];
  rep: SalesRep;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [sortBy, setSortBy] = useState<"name" | "stock" | "price">("name");
  const [addOpen, setAddOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<ProductWithWholesaler | null>(
    null
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [unitOptions, setUnitOptions] = useState<UnitOptionRow[]>([]);

  const sorted = [...products].sort((a, b) => {
    if (sortBy === "stock") return a.stock - b.stock;
    if (sortBy === "price") return b.price - a.price;
    return a.name.localeCompare(b.name);
  });

  async function handleAddProduct(formData: FormData) {
    setFormError(null);
    const currentUnitOptions = [...unitOptions];
    startTransition(async () => {
      const result = await repCreateProduct(rep.id, formData);
      if (result.error) {
        setFormError(result.error);
        return;
      }
      // Save unit options if any
      if (currentUnitOptions.length > 0 && result.id) {
        const unitResult = await repSaveProductUnitOptions(rep.id, result.id, currentUnitOptions);
        if (unitResult.error) {
          setFormError(unitResult.error);
          return;
        }
      }
      setAddOpen(false);
      setUnitOptions([]);
      router.refresh();
    });
  }

  async function handleEditProduct(formData: FormData) {
    if (!editProduct) return;
    setFormError(null);
    startTransition(async () => {
      const result = await repUpdateProduct(rep.id, editProduct.id, formData);
      if (result.error) {
        setFormError(result.error);
        return;
      }
      setEditProduct(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {/* Top bar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Button
          className="w-full gap-2 sm:w-auto"
          onClick={() => {
            setFormError(null);
            setAddOpen(true);
          }}
          disabled={wholesalers.length === 0 && manufacturers.length === 0}
        >
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
        {/* Sort chips */}
        <div className="flex gap-2">
          {(["name", "stock", "price"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={`inline-flex shrink-0 items-center rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                sortBy === s
                  ? "border-primary bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {s === "name" ? "A–Z" : s === "stock" ? "Stock ↑" : "Price ↓"}
            </button>
          ))}
        </div>
      </div>

      {wholesalers.length === 0 && manufacturers.length === 0 && (
        <p className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-xs text-orange-800">
          Add a wholesaler or manufacturer first before adding products.
        </p>
      )}

      {products.length === 0 && (wholesalers.length > 0 || manufacturers.length > 0) ? (
        <EmptyState
          icon={<Package className="h-10 w-10" />}
          title="No products yet"
          description="Add products for your wholesalers to start selling."
        />
      ) : (
        sorted.map((p) => (
          <Card
            key={p.id}
            className={`cursor-pointer transition-colors hover:bg-muted/30 ${p.stock <= 5 ? "border-orange-200" : ""}`}
            onClick={() => {
              setFormError(null);
              setEditProduct(p);
            }}
          >
            <CardContent className="flex items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{p.name}</p>
                <p className="text-xs text-muted-foreground">
                  {p.wholesalers?.name ?? p.manufacturers?.name ?? "—"}
                  {p.wholesalers?.location && ` · ${p.wholesalers.location}`}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <p className="text-sm font-semibold text-primary">
                  {formatPrice(p.price)}
                  <span className="text-[10px] font-normal text-muted-foreground">
                    /{p.unit}
                  </span>
                </p>
                <Badge
                  variant={p.stock <= 5 ? "destructive" : "secondary"}
                  className="text-[10px]"
                >
                  {p.stock} in stock
                </Badge>
              </div>
              <Edit className="h-4 w-4 shrink-0 text-muted-foreground" />
            </CardContent>
          </Card>
        ))
      )}

      {/* ─── Add Product Dialog ─── */}
      <Dialog
        open={addOpen}
        onOpenChange={(open) => {
          setAddOpen(open);
          if (!open) setFormError(null);
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto max-w-[calc(100vw-2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Product</DialogTitle>
          </DialogHeader>
          <form key="add-product" action={handleAddProduct} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Wholesaler</label>
                <select
                  name="wholesaler_id"
                  className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">None</option>
                  {wholesalers.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Manufacturer</label>
                <select
                  name="manufacturer_id"
                  className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">None</option>
                  {manufacturers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Assign at least a wholesaler or manufacturer
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Product Name <span className="text-destructive">*</span>
              </label>
              <Input
                name="name"
                placeholder="e.g. Pembe Maize Flour 2kg"
                required
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input
                name="description"
                placeholder="Optional description"
                className="h-11"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Category <span className="text-destructive">*</span>
                </label>
                <select
                  name="category"
                  required
                  className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Select</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.icon} {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Unit <span className="text-destructive">*</span>
                </label>
                <select
                  name="unit"
                  required
                  className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Select</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.slug}>
                      {u.name}
                      {u.abbreviation && ` (${u.abbreviation})`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Price <span className="text-destructive">*</span>
                </label>
                <Input
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  required
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Stock <span className="text-destructive">*</span>
                </label>
                <Input
                  name="stock"
                  type="number"
                  min="0"
                  placeholder="0"
                  required
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Min Qty</label>
                <Input
                  name="min_order_qty"
                  type="number"
                  min="1"
                  defaultValue="1"
                  className="h-11"
                />
              </div>
            </div>

            {/* Additional Unit Options */}
            <div className="space-y-2 rounded-lg border border-dashed p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium">Additional Units</p>
                  <p className="text-[10px] text-muted-foreground">
                    e.g. sell in pieces and boxes
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 text-[10px]"
                  onClick={() =>
                    setUnitOptions([...unitOptions, { unit_slug: "", price: 0, stock: 0, min_order_qty: 1 }])
                  }
                >
                  <Plus className="h-3 w-3" />
                  Add
                </Button>
              </div>
              {unitOptions.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <select
                    className="h-9 flex-1 rounded-md border border-input bg-background px-2 text-xs"
                    value={opt.unit_slug}
                    onChange={(e) => {
                      const updated = [...unitOptions];
                      updated[idx] = { ...updated[idx], unit_slug: e.target.value };
                      setUnitOptions(updated);
                    }}
                  >
                    <option value="">Unit</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.slug}>{u.name}</option>
                    ))}
                  </select>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Price"
                    className="h-9 w-20 text-xs"
                    value={opt.price || ""}
                    onChange={(e) => {
                      const updated = [...unitOptions];
                      updated[idx] = { ...updated[idx], price: parseFloat(e.target.value) || 0 };
                      setUnitOptions(updated);
                    }}
                  />
                  <Input
                    type="number"
                    min="0"
                    placeholder="Stock"
                    className="h-9 w-16 text-xs"
                    value={opt.stock || ""}
                    onChange={(e) => {
                      const updated = [...unitOptions];
                      updated[idx] = { ...updated[idx], stock: parseInt(e.target.value) || 0 };
                      setUnitOptions(updated);
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 shrink-0 text-destructive"
                    onClick={() => setUnitOptions(unitOptions.filter((_, i) => i !== idx))}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>

            {formError && (
              <p className="text-sm text-destructive">{formError}</p>
            )}
            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="h-11 sm:h-9"
                onClick={() => setAddOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} className="h-11 sm:h-9">
                {isPending ? "Adding..." : "Add Product"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── Edit Product Dialog (stock / price update) ─── */}
      <Dialog
        open={!!editProduct}
        onOpenChange={(open) => {
          if (!open) {
            setEditProduct(null);
            setFormError(null);
          }
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto max-w-[calc(100vw-2rem)] sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Update Product</DialogTitle>
          </DialogHeader>
          {editProduct && (
            <form action={handleEditProduct} className="space-y-4">
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-sm font-medium">{editProduct.name}</p>
                <p className="text-xs text-muted-foreground">
                  {editProduct.wholesalers?.name ?? editProduct.manufacturers?.name ?? "—"} · {editProduct.category} ·{" "}
                  {editProduct.unit}
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Product Name</label>
                <Input
                  name="name"
                  defaultValue={editProduct.name}
                  className="h-11"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Price (KSh)</label>
                  <Input
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={editProduct.price}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Stock</label>
                  <Input
                    name="stock"
                    type="number"
                    min="0"
                    defaultValue={editProduct.stock}
                    className="h-11"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Min Order Qty</label>
                <Input
                  name="min_order_qty"
                  type="number"
                  min="1"
                  defaultValue={editProduct.stock > 0 ? 1 : 0}
                  className="h-11"
                />
              </div>
              {formError && (
                <p className="text-sm text-destructive">{formError}</p>
              )}
              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 sm:h-9"
                  onClick={() => setEditProduct(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="h-11 sm:h-9"
                >
                  {isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   Shared UI Pieces
   ════════════════════════════════════════════════════════════════ */

function StatCard({
  icon,
  label,
  value,
  bgColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  bgColor: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-2 p-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${bgColor}`}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="truncate text-lg font-bold">{value}</p>
          <p className="truncate text-[10px] text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function OrderCard({
  order,
  expanded = false,
}: {
  order: OrderWithItems;
  expanded?: boolean;
}) {
  const statusInfo =
    ORDER_STATUSES[order.status as keyof typeof ORDER_STATUSES];

  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="font-mono text-xs text-muted-foreground">
            #{order.id.slice(0, 8)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {timeAgo(order.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold">{formatPrice(order.total)}</p>
          <Badge className={`text-[10px] ${statusInfo?.color ?? ""}`}>
            {statusInfo?.label ?? order.status}
          </Badge>
        </div>
      </div>

      {expanded && order.order_items.length > 0 && (
        <div className="mt-2 space-y-1 border-t pt-2">
          {order.order_items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between text-xs"
            >
              <span className="text-muted-foreground">
                {item.products?.name ?? "Unknown Product"} x{item.quantity}
              </span>
              <span className="font-medium">
                {formatPrice(item.total_price)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-3 text-muted-foreground/40">{icon}</div>
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className="mt-1 max-w-xs text-xs text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
