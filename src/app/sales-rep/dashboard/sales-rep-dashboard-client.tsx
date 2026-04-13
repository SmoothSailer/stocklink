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
  CheckCircle2,
  Truck,
  XCircle,
  Eye,
  Loader2,
  Banknote,
  Calendar,
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
import { ORDER_STATUSES, PAYMENT_STATUSES, PAYMENT_METHODS } from "@/lib/constants";
import { salesRepSignOut } from "@/app/sales-rep/auth/actions";
import {
  repCreateWholesaler,
  repUpdateWholesaler,
  repCreateProduct,
  repUpdateProduct,
  repCreateManufacturer,
  repUpdateManufacturer,
  repSaveProductUnitOptions,
  repUpdateOrderStatus,
  repRecordPayment,
  getOrderPayments,
  repCreateBnplPlan,
  getOrderBnplPlan,
  repPayBnplInstallment,
} from "@/app/sales-rep/actions";
import type { SalesRep, Wholesaler, Order, OrderStatus, Manufacturer, PaymentRecord, BnplPlan, BnplInstallment } from "@/types/database";

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
  retailers: {
    id: string;
    name: string;
    business_name: string | null;
    phone: string;
    location: string | null;
  } | null;
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
        {activeTab === "orders" && <OrdersTab orders={orders} rep={rep} />}
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

function OrdersTab({ orders, rep }: { orders: OrderWithItems[]; rep: SalesRep }) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [detailOrder, setDetailOrder] = useState<OrderWithItems | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Payment recording state
  const [paymentDialogOrder, setPaymentDialogOrder] = useState<OrderWithItems | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"mpesa" | "cash" | "card">("mpesa");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [recordingPayment, setRecordingPayment] = useState(false);
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  // BNPL state
  type BnplPlanWithInstallments = BnplPlan & { bnpl_installments: BnplInstallment[] };
  const [bnplPlan, setBnplPlan] = useState<BnplPlanWithInstallments | null>(null);
  const [showBnplSetup, setShowBnplSetup] = useState(false);
  const [bnplCostPrice, setBnplCostPrice] = useState("");
  const [bnplMarkup, setBnplMarkup] = useState("");
  const [bnplInstallments, setBnplInstallments] = useState("3");
  const [bnplFirstDue, setBnplFirstDue] = useState("");
  const [bnplInterval, setBnplInterval] = useState("30");
  const [creatingBnpl, setCreatingBnpl] = useState(false);
  const [payingInstallmentId, setPayingInstallmentId] = useState<string | null>(null);
  const [instPayMethod, setInstPayMethod] = useState<"mpesa" | "cash" | "card">("mpesa");
  const [instPayRef, setInstPayRef] = useState("");
  const [showInstPayForm, setShowInstPayForm] = useState<string | null>(null);

  const filteredOrders =
    statusFilter === "all"
      ? orders
      : orders.filter((o) => o.status === statusFilter);

  async function handleStatusUpdate(orderId: string, status: "confirmed" | "out_for_delivery" | "delivered" | "cancelled") {
    setUpdatingId(orderId);
    await repUpdateOrderStatus(rep.id, orderId, status);
    router.refresh();
    setUpdatingId(null);
    setDetailOrder(null);
  }

  async function openPaymentDialog(order: OrderWithItems) {
    setPaymentDialogOrder(order);
    setPaymentAmount("");
    setPaymentMethod("mpesa");
    setPaymentReference("");
    setPaymentNotes("");
    setBnplPlan(null);
    setShowBnplSetup(false);
    setShowInstPayForm(null);
    setLoadingRecords(true);

    const records = await getOrderPayments(order.id);
    setPaymentRecords(records as PaymentRecord[]);

    // Load BNPL plan if applicable
    if (order.payment_method === "bnpl") {
      const plan = await getOrderBnplPlan(order.id);
      if (plan) {
        setBnplPlan(plan as BnplPlanWithInstallments);
      } else {
        setShowBnplSetup(true);
        setBnplCostPrice(String(order.total));
      }
    }

    setLoadingRecords(false);
  }

  async function handleRecordPayment() {
    if (!paymentDialogOrder) return;
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) return;

    setRecordingPayment(true);
    const result = await repRecordPayment(rep.id, paymentDialogOrder.id, {
      amount,
      method: paymentMethod,
      reference: paymentReference.trim() || undefined,
      notes: paymentNotes.trim() || undefined,
    });

    if (!result.error) {
      // Refresh records
      const records = await getOrderPayments(paymentDialogOrder.id);
      setPaymentRecords(records as PaymentRecord[]);
      setPaymentAmount("");
      setPaymentReference("");
      setPaymentNotes("");
      router.refresh();
    }
    setRecordingPayment(false);
  }

  async function handleCreateBnplPlan() {
    if (!paymentDialogOrder) return;
    const costPrice = parseFloat(bnplCostPrice);
    const markup = parseFloat(bnplMarkup);
    const numInst = parseInt(bnplInstallments);
    const interval = parseInt(bnplInterval);
    if (!costPrice || isNaN(markup) || markup < 0 || !numInst || !bnplFirstDue || !interval) return;

    setCreatingBnpl(true);
    const result = await repCreateBnplPlan(rep.id, paymentDialogOrder.id, {
      cost_price: costPrice,
      markup_amount: markup,
      num_installments: numInst,
      first_due_date: bnplFirstDue,
      interval_days: interval,
    });

    if (result.error) {
      alert(result.error);
      setCreatingBnpl(false);
      return;
    }

    const plan = await getOrderBnplPlan(paymentDialogOrder.id);
    if (plan) {
      setBnplPlan(plan as BnplPlanWithInstallments);
      setShowBnplSetup(false);
    }
    router.refresh();
    setCreatingBnpl(false);
  }

  async function handlePayInstallment(installmentId: string) {
    setPayingInstallmentId(installmentId);
    const result = await repPayBnplInstallment(rep.id, installmentId, {
      method: instPayMethod,
      reference: instPayRef.trim() || undefined,
    });

    if (!result.error && paymentDialogOrder) {
      const plan = await getOrderBnplPlan(paymentDialogOrder.id);
      if (plan) setBnplPlan(plan as BnplPlanWithInstallments);
      const records = await getOrderPayments(paymentDialogOrder.id);
      setPaymentRecords(records as PaymentRecord[]);
      setShowInstPayForm(null);
      setInstPayRef("");
      router.refresh();
    }
    setPayingInstallmentId(null);
  }

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
          <OrderCard
            key={order.id}
            order={order}
            expanded
            onView={() => setDetailOrder(order)}
            onStatusUpdate={handleStatusUpdate}
            onRecordPayment={() => openPaymentDialog(order)}
            updating={updatingId === order.id}
          />
        ))
      )}

      {/* Order detail dialog */}
      <Dialog open={!!detailOrder} onOpenChange={() => setDetailOrder(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Order #{detailOrder?.id.slice(0, 8)}
            </DialogTitle>
          </DialogHeader>
          {detailOrder && (
            <div className="space-y-4">
              {/* Retailer info */}
              {detailOrder.retailers && (
                <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">Customer</p>
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">{detailOrder.retailers.name}</p>
                    {detailOrder.retailers.business_name && (
                      <p className="text-xs text-muted-foreground">{detailOrder.retailers.business_name}</p>
                    )}
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {detailOrder.retailers.phone}
                    </p>
                    {detailOrder.retailers.location && (
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {detailOrder.retailers.location}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <a
                      href={buildWhatsAppLink(
                        `Hi ${detailOrder.retailers.name}, following up on your order #${detailOrder.id.slice(0, 6).toUpperCase()} (${formatPrice(detailOrder.total)}). ${
                          detailOrder.payment_status === "pending"
                            ? "Kindly confirm payment."
                            : detailOrder.payment_status === "partial"
                              ? `Balance remaining: ${formatPrice(detailOrder.total - detailOrder.amount_paid)}.`
                              : "Thank you for your payment!"
                        }`,
                        detailOrder.retailers.phone
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 transition-colors"
                    >
                      <MessageCircle className="h-3 w-3" />
                      Follow Up
                    </a>
                    <a
                      href={`tel:${detailOrder.retailers.phone}`}
                      className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
                    >
                      <Phone className="h-3 w-3" />
                      Call
                    </a>
                  </div>
                </div>
              )}

              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge className={`text-xs ${ORDER_STATUSES[detailOrder.status as keyof typeof ORDER_STATUSES]?.color ?? ""}`}>
                  {ORDER_STATUSES[detailOrder.status as keyof typeof ORDER_STATUSES]?.label ?? detailOrder.status}
                </Badge>
              </div>

              {/* Order info */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-semibold">{formatPrice(detailOrder.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment</span>
                  <span className="capitalize">{detailOrder.payment_method}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Payment Status</span>
                  <Badge className={`text-[10px] ${PAYMENT_STATUSES[detailOrder.payment_status as keyof typeof PAYMENT_STATUSES]?.color ?? ""}`}>
                    {PAYMENT_STATUSES[detailOrder.payment_status as keyof typeof PAYMENT_STATUSES]?.label ?? detailOrder.payment_status}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paid</span>
                  <span className="font-semibold">{formatPrice(detailOrder.amount_paid)} / {formatPrice(detailOrder.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery</span>
                  <span className="text-right max-w-[200px]">{detailOrder.delivery_address || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Placed</span>
                  <span>{timeAgo(detailOrder.created_at)}</span>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-2 border-t pt-3">
                <p className="text-xs font-semibold text-muted-foreground">Items</p>
                {detailOrder.order_items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium">{item.products?.name ?? "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatPrice(item.unit_price)} × {item.quantity}
                      </p>
                    </div>
                    <span className="font-semibold">{formatPrice(item.total_price)}</span>
                  </div>
                ))}
              </div>

              {/* Record payment button */}
              {detailOrder.payment_status !== "paid" && (
                <div className="border-t pt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full gap-1.5"
                    onClick={() => {
                      setDetailOrder(null);
                      openPaymentDialog(detailOrder);
                    }}
                  >
                    <Banknote className="h-3.5 w-3.5" />
                    Record Payment
                  </Button>
                </div>
              )}

              {/* Status actions */}
              {detailOrder.status !== "delivered" && detailOrder.status !== "cancelled" && (
                <div className="space-y-2 border-t pt-3">
                  <p className="text-xs font-semibold text-muted-foreground">Update Status</p>
                  <div className="flex flex-wrap gap-2">
                    {detailOrder.status === "placed" && (
                      <Button
                        size="sm"
                        className="gap-1.5"
                        disabled={updatingId === detailOrder.id}
                        onClick={() => handleStatusUpdate(detailOrder.id, "confirmed")}
                      >
                        {updatingId === detailOrder.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                        Confirm Order
                      </Button>
                    )}
                    {detailOrder.status === "confirmed" && (
                      <Button
                        size="sm"
                        className="gap-1.5"
                        disabled={updatingId === detailOrder.id}
                        onClick={() => handleStatusUpdate(detailOrder.id, "out_for_delivery")}
                      >
                        {updatingId === detailOrder.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Truck className="h-3.5 w-3.5" />}
                        Out for Delivery
                      </Button>
                    )}
                    {detailOrder.status === "out_for_delivery" && (
                      <Button
                        size="sm"
                        className="gap-1.5"
                        disabled={updatingId === detailOrder.id}
                        onClick={() => handleStatusUpdate(detailOrder.id, "delivered")}
                      >
                        {updatingId === detailOrder.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                        Mark Delivered
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      className="gap-1.5"
                      disabled={updatingId === detailOrder.id}
                      onClick={() => handleStatusUpdate(detailOrder.id, "cancelled")}
                    >
                      {updatingId === detailOrder.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment recording dialog */}
      <Dialog open={!!paymentDialogOrder} onOpenChange={() => setPaymentDialogOrder(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Banknote className="h-4 w-4" />
              {paymentDialogOrder?.payment_method === "bnpl" ? "Murabaha Plan" : "Record Payment"}
            </DialogTitle>
          </DialogHeader>
          {paymentDialogOrder && (
            <div className="space-y-4">
              {/* Order summary */}
              <div className="rounded-lg bg-muted/50 p-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order</span>
                  <span className="font-mono">#{paymentDialogOrder.id.slice(0, 8)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-semibold">{formatPrice(paymentDialogOrder.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paid so far</span>
                  <span className="font-semibold text-primary">{formatPrice(paymentDialogOrder.amount_paid)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Balance</span>
                  <span className="font-semibold text-destructive">
                    {formatPrice(Math.max(0, paymentDialogOrder.total - paymentDialogOrder.amount_paid))}
                  </span>
                </div>
              </div>

              {/* ─── BNPL Section ─── */}
              {paymentDialogOrder.payment_method === "bnpl" && (
                <>
                  {loadingRecords ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : showBnplSetup ? (
                    /* BNPL Plan Setup Form */
                    <div className="space-y-3 border-t pt-3">
                      <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
                        <p className="text-xs font-semibold text-orange-800">🕌 Murabaha Financing</p>
                        <p className="text-xs text-orange-700 mt-1">
                          30% down payment required upfront. The remaining 70% (cost + markup) is split into equal installments.
                        </p>
                      </div>

                      <div>
                        <label className="text-xs text-muted-foreground">Cost Price (KSh)</label>
                        <Input
                          type="number"
                          value={bnplCostPrice}
                          onChange={(e) => setBnplCostPrice(e.target.value)}
                          min={1}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Markup / Profit (KSh)</label>
                        <Input
                          type="number"
                          placeholder="e.g. 500"
                          value={bnplMarkup}
                          onChange={(e) => setBnplMarkup(e.target.value)}
                          min={0}
                        />
                      </div>

                      {/* Price breakdown preview */}
                      {bnplCostPrice && bnplMarkup !== "" && (
                        <div className="rounded-lg bg-muted/50 p-3 space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total (cost + markup)</span>
                            <span className="font-semibold">{formatPrice(parseFloat(bnplCostPrice) + parseFloat(bnplMarkup || "0"))}</span>
                          </div>
                          <div className="flex justify-between text-primary">
                            <span>⬇ 30% Down Payment</span>
                            <span className="font-semibold">{formatPrice(Math.ceil((parseFloat(bnplCostPrice) + parseFloat(bnplMarkup || "0")) * 0.3 * 100) / 100)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Remaining (70%)</span>
                            <span>{formatPrice(Math.floor((parseFloat(bnplCostPrice) + parseFloat(bnplMarkup || "0")) * 0.7 * 100) / 100)}</span>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-muted-foreground">Installments</label>
                          <Input
                            type="number"
                            value={bnplInstallments}
                            onChange={(e) => setBnplInstallments(e.target.value)}
                            min={2}
                            max={24}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Interval (days)</label>
                          <Input
                            type="number"
                            value={bnplInterval}
                            onChange={(e) => setBnplInterval(e.target.value)}
                            min={7}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">First Installment Due</label>
                        <Input
                          type="date"
                          value={bnplFirstDue}
                          onChange={(e) => setBnplFirstDue(e.target.value)}
                          min={new Date().toISOString().split("T")[0]}
                        />
                      </div>
                      {bnplCostPrice && bnplMarkup !== "" && bnplInstallments && (
                        <p className="text-xs text-muted-foreground">
                          ≈ {formatPrice(Math.ceil(((parseFloat(bnplCostPrice) + parseFloat(bnplMarkup || "0")) * 0.7 / parseInt(bnplInstallments)) * 100) / 100)} per installment × {bnplInstallments} payments
                        </p>
                      )}
                      <Button
                        className="w-full gap-1.5"
                        disabled={creatingBnpl || !bnplCostPrice || bnplMarkup === "" || !bnplFirstDue}
                        onClick={handleCreateBnplPlan}
                      >
                        {creatingBnpl ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
                        Create Installment Plan
                      </Button>
                    </div>
                  ) : bnplPlan ? (
                    /* BNPL Installment Schedule */
                    <div className="space-y-3 border-t pt-3">
                      <div className="rounded-lg bg-muted/50 p-2 text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Cost Price</span>
                          <span>{formatPrice(bnplPlan.cost_price)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Markup</span>
                          <span>{formatPrice(bnplPlan.markup_amount)}</span>
                        </div>
                        <div className="flex justify-between font-semibold">
                          <span>Total (Murabaha)</span>
                          <span>{formatPrice(bnplPlan.total_with_markup)}</span>
                        </div>
                        <div className="flex justify-between text-primary">
                          <span>30% Down Payment</span>
                          <span className="font-semibold">{formatPrice(bnplPlan.down_payment)}</span>
                        </div>
                      </div>

                      <p className="text-xs font-semibold text-muted-foreground">
                        Installment Schedule ({bnplPlan.num_installments} payments of remaining 70%)
                      </p>
                      {(bnplPlan.bnpl_installments ?? [])
                        .sort((a, b) => a.installment_number - b.installment_number)
                        .map((inst) => (
                        <div key={inst.id} className="rounded border p-2 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <div>
                              <p className="font-medium">#{inst.installment_number} — {formatPrice(inst.amount)}</p>
                              <p className="text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Due: {new Date(inst.due_date).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                              </p>
                            </div>
                            <Badge className={`text-[10px] ${
                              inst.status === "paid" ? "bg-green-100 text-green-800" :
                              inst.status === "overdue" ? "bg-red-100 text-red-800" :
                              inst.status === "due" ? "bg-yellow-100 text-yellow-800" :
                              "bg-gray-100 text-gray-800"
                            }`}>
                              {inst.status === "paid" ? "Paid" : inst.status === "overdue" ? "Overdue" : inst.status === "due" ? "Due" : "Upcoming"}
                            </Badge>
                          </div>

                          {inst.status !== "paid" && (
                            <>
                              {showInstPayForm === inst.id ? (
                                <div className="space-y-2 pt-1 border-t">
                                  <div className="flex gap-1.5">
                                    {(["mpesa", "cash", "card"] as const).map((m) => (
                                      <button
                                        key={m}
                                        type="button"
                                        onClick={() => setInstPayMethod(m)}
                                        className={`flex-1 rounded border px-1.5 py-1 text-[10px] font-medium ${
                                          instPayMethod === m ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground"
                                        }`}
                                      >
                                        {m === "mpesa" ? "M-Pesa" : m === "cash" ? "Cash" : "Card"}
                                      </button>
                                    ))}
                                  </div>
                                  {instPayMethod !== "cash" && (
                                    <Input
                                      className="h-8 text-xs"
                                      placeholder={instPayMethod === "mpesa" ? "M-Pesa code" : "Receipt ref"}
                                      value={instPayRef}
                                      onChange={(e) => setInstPayRef(e.target.value.toUpperCase())}
                                    />
                                  )}
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      className="h-7 flex-1 gap-1 text-xs"
                                      disabled={payingInstallmentId === inst.id}
                                      onClick={() => handlePayInstallment(inst.id)}
                                    >
                                      {payingInstallmentId === inst.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                                      Confirm
                                    </Button>
                                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowInstPayForm(null)}>
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 w-full gap-1 text-xs"
                                  onClick={() => { setShowInstPayForm(inst.id); setInstPayRef(""); setInstPayMethod("mpesa"); }}
                                >
                                  <Banknote className="h-3 w-3" />
                                  Mark Paid
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </>
              )}

              {/* ─── Regular Payment Section (non-BNPL) ─── */}
              {paymentDialogOrder.payment_method !== "bnpl" && (
                <>
                  {/* Payment history */}
                  {loadingRecords ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : paymentRecords.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground">Payment History</p>
                      {paymentRecords.map((rec) => (
                        <div key={rec.id} className="flex items-center justify-between rounded border p-2 text-xs">
                          <div>
                            <p className="font-medium capitalize">{rec.method}</p>
                            {rec.reference && <p className="text-muted-foreground font-mono">{rec.reference}</p>}
                            {rec.notes && <p className="text-muted-foreground">{rec.notes}</p>}
                            <p className="text-muted-foreground">{timeAgo(rec.created_at)}</p>
                          </div>
                          <span className="font-semibold text-primary">{formatPrice(rec.amount)}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {/* Record new payment form */}
                  {paymentDialogOrder.amount_paid < paymentDialogOrder.total && (
                    <div className="space-y-3 border-t pt-3">
                      <p className="text-xs font-semibold text-muted-foreground">New Payment</p>

                      <div>
                        <label className="text-xs text-muted-foreground">Amount (KSh)</label>
                        <Input
                          type="number"
                          placeholder={`Max: ${Math.max(0, paymentDialogOrder.total - paymentDialogOrder.amount_paid)}`}
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          min={1}
                          max={paymentDialogOrder.total - paymentDialogOrder.amount_paid}
                        />
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setPaymentAmount(String(Math.max(0, paymentDialogOrder.total - paymentDialogOrder.amount_paid)))}
                      >
                        Fill full balance ({formatPrice(Math.max(0, paymentDialogOrder.total - paymentDialogOrder.amount_paid))})
                      </Button>

                      <div>
                        <label className="text-xs text-muted-foreground">Method</label>
                        <div className="flex gap-2 mt-1">
                          {(["mpesa", "cash", "card"] as const).map((m) => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => setPaymentMethod(m)}
                              className={`flex-1 rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${
                                paymentMethod === m
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "text-muted-foreground hover:bg-muted"
                              }`}
                            >
                              {m === "mpesa" ? "📱 M-Pesa" : m === "cash" ? "💵 Cash" : "💳 Card"}
                            </button>
                          ))}
                        </div>
                      </div>

                      {paymentMethod !== "cash" && (
                        <div>
                          <label className="text-xs text-muted-foreground">
                            {paymentMethod === "mpesa" ? "M-Pesa Transaction Code" : "Card Receipt / Reference"}
                          </label>
                          <Input
                            placeholder={paymentMethod === "mpesa" ? "e.g. SJK7ABCDEF" : "e.g. TXN-12345"}
                            value={paymentReference}
                            onChange={(e) => setPaymentReference(e.target.value.toUpperCase())}
                          />
                        </div>
                      )}

                      <div>
                        <label className="text-xs text-muted-foreground">Notes (optional)</label>
                        <Input
                          placeholder="e.g. Installment 2 of 4"
                          value={paymentNotes}
                          onChange={(e) => setPaymentNotes(e.target.value)}
                        />
                      </div>

                      <Button
                        className="w-full gap-1.5"
                        disabled={recordingPayment || !paymentAmount || parseFloat(paymentAmount) <= 0}
                        onClick={handleRecordPayment}
                      >
                        {recordingPayment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Banknote className="h-4 w-4" />}
                        Confirm Payment
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
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
  onView,
  onStatusUpdate,
  onRecordPayment,
  updating = false,
}: {
  order: OrderWithItems;
  expanded?: boolean;
  onView?: () => void;
  onStatusUpdate?: (orderId: string, status: "confirmed" | "out_for_delivery" | "delivered" | "cancelled") => void;
  onRecordPayment?: () => void;
  updating?: boolean;
}) {
  const statusInfo =
    ORDER_STATUSES[order.status as keyof typeof ORDER_STATUSES];
  const paymentInfo =
    PAYMENT_STATUSES[order.payment_status as keyof typeof PAYMENT_STATUSES];

  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="font-mono text-xs text-muted-foreground">
            #{order.id.slice(0, 8)}
          </p>
          {order.retailers && (
            <p className="mt-0.5 text-xs font-medium truncate">
              {order.retailers.business_name ?? order.retailers.name}
            </p>
          )}
          <p className="mt-0.5 text-xs text-muted-foreground">
            {timeAgo(order.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-semibold">{formatPrice(order.total)}</p>
          <Badge className={`text-[10px] ${statusInfo?.color ?? ""}`}>
            {statusInfo?.label ?? order.status}
          </Badge>
          <Badge className={`text-[10px] ${paymentInfo?.color ?? ""}`}>
            {paymentInfo?.label ?? order.payment_status}
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

      {/* Action buttons */}
      {(onView || onStatusUpdate || onRecordPayment) && (
        <div className="mt-2 flex items-center gap-1 border-t pt-2">
          {onView && (
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={onView}>
              <Eye className="h-3 w-3" />
              View
            </Button>
          )}
          {onRecordPayment && order.payment_status !== "paid" && (
            <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={onRecordPayment}>
              <Banknote className="h-3 w-3" />
              Pay
            </Button>
          )}
          {onStatusUpdate && order.status === "placed" && (
            <Button
              size="sm"
              className="h-7 gap-1 text-xs"
              disabled={updating}
              onClick={() => onStatusUpdate(order.id, "confirmed")}
            >
              {updating ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
              Confirm
            </Button>
          )}
          {onStatusUpdate && order.status === "confirmed" && (
            <Button
              size="sm"
              className="h-7 gap-1 text-xs"
              disabled={updating}
              onClick={() => onStatusUpdate(order.id, "out_for_delivery")}
            >
              {updating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Truck className="h-3 w-3" />}
              Dispatch
            </Button>
          )}
          {onStatusUpdate && order.status === "out_for_delivery" && (
            <Button
              size="sm"
              className="h-7 gap-1 text-xs"
              disabled={updating}
              onClick={() => onStatusUpdate(order.id, "delivered")}
            >
              {updating ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
              Delivered
            </Button>
          )}
          {onStatusUpdate && order.status !== "delivered" && order.status !== "cancelled" && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs text-destructive hover:text-destructive"
              disabled={updating}
              onClick={() => onStatusUpdate(order.id, "cancelled")}
            >
              <XCircle className="h-3 w-3" />
              Cancel
            </Button>
          )}
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
