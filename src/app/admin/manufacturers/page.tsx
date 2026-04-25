"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Factory,
  CheckCircle,
  XCircle,
  MapPin,
  Globe,
  Phone,
  Mail,
  UserCheck,
  User,
  Plane,
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
  getManufacturers,
  getSalesReps,
  createManufacturer,
  updateManufacturer,
  deleteManufacturer,
} from "@/app/admin/actions";
import type { Manufacturer, SalesRep } from "@/types/database";
import { COUNTRIES, CURRENCIES, INCOTERMS } from "@/lib/constants";

type ManufacturerWithRep = Manufacturer & {
  sales_reps: { id: string; name: string } | null;
};

type FilterTab = "all" | "domestic" | "international";

export default function ManufacturersPage() {
  const [manufacturers, setManufacturers] = useState<ManufacturerWithRep[]>([]);
  const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ManufacturerWithRep | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isInternational, setIsInternational] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [mfrs, reps] = await Promise.all([
        getManufacturers(),
        getSalesReps(),
      ]);
      setManufacturers(mfrs as ManufacturerWithRep[]);
      setSalesReps(reps);
    } catch {
      // Empty state shown on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = manufacturers.filter((m) => {
    if (filterTab === "domestic" && m.is_international) return false;
    if (filterTab === "international" && !m.is_international) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.slug.toLowerCase().includes(q) ||
      (m.location ?? "").toLowerCase().includes(q) ||
      (m.contact_person ?? "").toLowerCase().includes(q) ||
      (m.sales_reps?.name ?? "").toLowerCase().includes(q) ||
      (m.country ?? "").toLowerCase().includes(q)
    );
  });

  const totalManufacturers = manufacturers.length;
  const activeManufacturers = manufacturers.filter((m) => m.is_active).length;
  const internationalCount = manufacturers.filter((m) => m.is_international).length;
  const domesticCount = totalManufacturers - internationalCount;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);

    try {
      const formData = new FormData(e.currentTarget);
      if (editing) {
        formData.set("is_active", editing.is_active ? "true" : "false");
      }

      const result = editing
        ? await updateManufacturer(editing.id, formData)
        : await createManufacturer(formData);

      if (result.error) {
        setFormError(result.error);
        setSaving(false);
        return;
      }

      setDialogOpen(false);
      setEditing(null);
      await loadData();
    } catch {
      setFormError("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const result = await deleteManufacturer(id);
    if (!result.error) {
      setDeleteConfirmId(null);
      await loadData();
    }
  }

  async function handleToggleActive(mfr: ManufacturerWithRep) {
    const formData = new FormData();
    formData.set("name", mfr.name);
    formData.set("description", mfr.description ?? "");
    formData.set("location", mfr.location ?? "");
    formData.set("website", mfr.website ?? "");
    formData.set("contact_person", mfr.contact_person ?? "");
    formData.set("contact_phone", mfr.contact_phone ?? "");
    formData.set("contact_email", mfr.contact_email ?? "");
    formData.set("sales_rep_id", mfr.sales_rep_id ?? "");
    formData.set("is_active", mfr.is_active ? "false" : "true");
    formData.set("is_international", mfr.is_international ? "true" : "false");
    formData.set("country", mfr.country ?? "KE");
    formData.set("country_code", mfr.country_code ?? "KE");
    formData.set("default_currency", mfr.default_currency ?? "KES");
    formData.set("default_incoterms", mfr.default_incoterms ?? "");
    formData.set("default_port_of_origin", mfr.default_port_of_origin ?? "");
    formData.set("payment_terms", mfr.payment_terms ?? "");
    formData.set("lead_time_days", mfr.lead_time_days?.toString() ?? "");
    formData.set("tax_id", mfr.tax_id ?? "");
    await updateManufacturer(mfr.id, formData);
    await loadData();
  }

  function openEdit(mfr: ManufacturerWithRep) {
    setEditing(mfr);
    setIsInternational(mfr.is_international);
    setFormError(null);
    setDialogOpen(true);
  }

  function openAdd() {
    setEditing(null);
    setIsInternational(false);
    setFormError(null);
    setDialogOpen(true);
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
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">Manufacturers</h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Manage product manufacturers and brands
          </p>
        </div>
        <Button className="w-full gap-2 sm:w-auto" onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Add Manufacturer
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Card>
          <CardContent className="flex items-center gap-2 p-3 sm:gap-3 sm:p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 sm:h-10 sm:w-10">
              <Factory className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold sm:text-2xl">{totalManufacturers}</p>
              <p className="truncate text-[10px] text-muted-foreground sm:text-xs">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-2 p-3 sm:gap-3 sm:p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-100 sm:h-10 sm:w-10">
              <CheckCircle className="h-4 w-4 text-green-600 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold sm:text-2xl">{domesticCount}</p>
              <p className="truncate text-[10px] text-muted-foreground sm:text-xs">Domestic</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-2 p-3 sm:gap-3 sm:p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 sm:h-10 sm:w-10">
              <Plane className="h-4 w-4 text-blue-600 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold sm:text-2xl">{internationalCount}</p>
              <p className="truncate text-[10px] text-muted-foreground sm:text-xs">International</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter tabs + Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-lg border border-border p-1">
          {(["all", "domestic", "international"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                filterTab === tab
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="relative sm:max-w-sm sm:flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search manufacturers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* ─── Mobile Card List ─── */}
      <div className="space-y-3 lg:hidden">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Factory className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="font-medium">No manufacturers found</p>
              <p className="text-sm text-muted-foreground">
                {search ? "Try a different search" : "Add your first manufacturer"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filtered.map((mfr) => (
            <Card key={mfr.id} className={mfr.is_active ? "" : "opacity-60"}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Factory className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold">{mfr.name}</p>
                      {mfr.is_international && (
                        <Badge variant="outline" className="shrink-0 gap-0.5 text-[10px]">
                          {COUNTRIES.find((c) => c.value === mfr.country_code)?.flag ?? "🌍"} Intl
                        </Badge>
                      )}
                      <Badge
                        variant={mfr.is_active ? "default" : "secondary"}
                        className="shrink-0 cursor-pointer text-[10px]"
                        onClick={() => handleToggleActive(mfr)}
                      >
                        {mfr.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    {mfr.description && (
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                        {mfr.description}
                      </p>
                    )}
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      {mfr.contact_person && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" /> {mfr.contact_person}
                        </span>
                      )}
                      {mfr.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {mfr.location}
                        </span>
                      )}
                      {mfr.contact_phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {mfr.contact_phone}
                        </span>
                      )}
                      {mfr.website && (
                        <span className="flex items-center gap-1">
                          <Globe className="h-3 w-3" /> Website
                        </span>
                      )}
                    </div>
                    {mfr.sales_reps && (
                      <div className="mt-1.5 flex items-center gap-1 text-xs text-primary">
                        <UserCheck className="h-3 w-3" />
                        <span>{mfr.sales_reps.name}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(mfr)}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => {
                        if (deleteConfirmId === mfr.id) handleDelete(mfr.id);
                        else setDeleteConfirmId(mfr.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* ─── Desktop Table ─── */}
      <Card className="hidden lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Contact Person</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Sales Rep</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center">
                  <Factory className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="font-medium">No manufacturers found</p>
                  <p className="text-sm text-muted-foreground">
                    {search ? "Try a different search" : "Add your first manufacturer"}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((mfr) => (
                <TableRow key={mfr.id} className={mfr.is_active ? "" : "opacity-60"}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{mfr.name}</p>
                      {mfr.description && (
                        <p className="line-clamp-1 text-xs text-muted-foreground">
                          {mfr.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm">
                      <span>{COUNTRIES.find((c) => c.value === mfr.country_code)?.flag ?? "🏳️"}</span>
                      <span>{COUNTRIES.find((c) => c.value === mfr.country_code)?.label ?? mfr.country}</span>
                      {mfr.is_international && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0">Intl</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {mfr.contact_person ? (
                      <span className="flex items-center gap-1 text-sm">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        {mfr.contact_person}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {mfr.location ? (
                      <span className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        {mfr.location}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {mfr.sales_reps ? (
                      <span className="flex items-center gap-1 text-sm text-primary">
                        <UserCheck className="h-3.5 w-3.5" />
                        {mfr.sales_reps.name}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <button onClick={() => handleToggleActive(mfr)} className="cursor-pointer">
                      <Badge variant={mfr.is_active ? "default" : "secondary"}>
                        {mfr.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(mfr)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      {deleteConfirmId === mfr.id ? (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(mfr.id)}
                          >
                            Confirm
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteConfirmId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteConfirmId(mfr.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(null);
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto max-w-[calc(100vw-2rem)] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Manufacturer" : "Add Manufacturer"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Name <span className="text-destructive">*</span>
              </label>
              <Input
                name="name"
                placeholder="e.g. Bidco Africa"
                defaultValue={editing?.name ?? ""}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input
                name="description"
                placeholder="Brief description of the manufacturer"
                defaultValue={editing?.description ?? ""}
              />
            </div>

            {/* International toggle */}
            <div className="flex items-center gap-3 rounded-lg border border-border p-3">
              <input
                type="checkbox"
                name="is_international"
                value="true"
                checked={isInternational}
                onChange={(e) => setIsInternational(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <div>
                <p className="text-sm font-medium">International Manufacturer</p>
                <p className="text-xs text-muted-foreground">Ships goods into Kenya via Sambaza cargo</p>
              </div>
            </div>

            {/* Country & Currency (shown for all, defaults differ) */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Country</label>
                <select
                  name="country_code"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  defaultValue={editing?.country_code ?? "KE"}
                  onChange={(e) => {
                    // Also update hidden country name field
                    const el = e.target.form?.querySelector<HTMLInputElement>('[name="country"]');
                    if (el) el.value = COUNTRIES.find((c) => c.value === e.target.value)?.label ?? e.target.value;
                  }}
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.flag} {c.label}
                    </option>
                  ))}
                </select>
                <input type="hidden" name="country" defaultValue={editing?.country ?? "Kenya"} />
              </div>
              {isInternational && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Default Currency</label>
                  <select
                    name="default_currency"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    defaultValue={editing?.default_currency ?? "USD"}
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.symbol} {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* International-only fields */}
            {isInternational && (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Default Incoterms</label>
                    <select
                      name="default_incoterms"
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      defaultValue={editing?.default_incoterms ?? ""}
                    >
                      <option value="">Select incoterms</option>
                      {INCOTERMS.map((i) => (
                        <option key={i.value} value={i.value}>
                          {i.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Port of Origin</label>
                    <Input
                      name="default_port_of_origin"
                      placeholder="e.g. Shanghai, Dubai"
                      defaultValue={editing?.default_port_of_origin ?? ""}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Payment Terms</label>
                    <Input
                      name="payment_terms"
                      placeholder="e.g. Net 30, LC at sight"
                      defaultValue={editing?.payment_terms ?? ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Lead Time (days)</label>
                    <Input
                      name="lead_time_days"
                      type="number"
                      min="0"
                      placeholder="e.g. 45"
                      defaultValue={editing?.lead_time_days?.toString() ?? ""}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Tax / Registration ID</label>
                  <Input
                    name="tax_id"
                    placeholder="Foreign tax or registration number"
                    defaultValue={editing?.tax_id ?? ""}
                  />
                </div>
              </>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Contact Person</label>
                <Input
                  name="contact_person"
                  placeholder="e.g. John Kamau"
                  defaultValue={editing?.contact_person ?? ""}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone</label>
                <Input
                  name="contact_phone"
                  type="tel"
                  placeholder="+254 7XX XXX XXX"
                  defaultValue={editing?.contact_phone ?? ""}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  name="contact_email"
                  type="email"
                  placeholder="info@manufacturer.com"
                  defaultValue={editing?.contact_email ?? ""}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Location</label>
                <Input
                  name="location"
                  placeholder="e.g. Nairobi, Kenya"
                  defaultValue={editing?.location ?? ""}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Website</label>
                <Input
                  name="website"
                  type="url"
                  placeholder="https://example.com"
                  defaultValue={editing?.website ?? ""}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Assigned Sales Rep</label>
                <select
                  name="sales_rep_id"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  defaultValue={editing?.sales_rep_id ?? ""}
                >
                  <option value="">No sales rep</option>
                  {salesReps
                    .filter((r) => r.is_active)
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {formError && (
              <p className="text-sm text-destructive">{formError}</p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving
                  ? "Saving..."
                  : editing
                    ? "Update Manufacturer"
                    : "Add Manufacturer"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
