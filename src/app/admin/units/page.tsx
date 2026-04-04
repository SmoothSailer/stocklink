"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  GripVertical,
  Ruler,
  CheckCircle,
  XCircle,
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
  getProductUnits,
  createProductUnit,
  updateProductUnit,
  deleteProductUnit,
} from "@/app/admin/actions";
import type { ProductUnit } from "@/types/database";

export default function UnitsPage() {
  const [units, setUnits] = useState<ProductUnit[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<ProductUnit | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const data = await getProductUnits();
      setUnits(data);
    } catch {
      // Empty state shown on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = units.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.plural_name.toLowerCase().includes(q) ||
      u.slug.toLowerCase().includes(q) ||
      (u.abbreviation?.toLowerCase().includes(q) ?? false)
    );
  });

  const totalUnits = units.length;
  const activeUnits = units.filter((u) => u.is_active).length;
  const inactiveUnits = totalUnits - activeUnits;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);

    try {
      const formData = new FormData(e.currentTarget);
      if (editingUnit) {
        formData.set("is_active", editingUnit.is_active ? "true" : "false");
      }

      const result = editingUnit
        ? await updateProductUnit(editingUnit.id, formData)
        : await createProductUnit(formData);

      if (result.error) {
        setFormError(result.error);
        setSaving(false);
        return;
      }

      setDialogOpen(false);
      setEditingUnit(null);
      await loadData();
    } catch {
      setFormError("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const result = await deleteProductUnit(id);
    if (!result.error) {
      setDeleteConfirmId(null);
      await loadData();
    }
  }

  async function handleToggleActive(unit: ProductUnit) {
    const formData = new FormData();
    formData.set("name", unit.name);
    formData.set("plural_name", unit.plural_name);
    formData.set("abbreviation", unit.abbreviation ?? "");
    formData.set("sort_order", String(unit.sort_order));
    formData.set("is_active", unit.is_active ? "false" : "true");
    await updateProductUnit(unit.id, formData);
    await loadData();
  }

  function openEdit(unit: ProductUnit) {
    setEditingUnit(unit);
    setFormError(null);
    setDialogOpen(true);
  }

  function openAdd() {
    setEditingUnit(null);
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
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Product Units</h1>
          <p className="text-sm text-muted-foreground">
            Manage product measurement units (bag, carton, etc.)
          </p>
        </div>
        <Button className="gap-2" onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Add Unit
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Ruler className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalUnits}</p>
              <p className="text-xs text-muted-foreground">Total Units</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeUnits}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
              <XCircle className="h-5 w-5 text-gray-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{inactiveUnits}</p>
              <p className="text-xs text-muted-foreground">Inactive</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search units..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Order</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Plural</TableHead>
              <TableHead>Abbreviation</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center">
                  <Ruler className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="font-medium">No units found</p>
                  <p className="text-sm text-muted-foreground">
                    {search ? "Try a different search" : "Add your first unit"}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((unit) => (
                <TableRow key={unit.id}>
                  <TableCell>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <GripVertical className="h-4 w-4" />
                      <span className="text-sm">{unit.sort_order}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{unit.name}</TableCell>
                  <TableCell>{unit.plural_name}</TableCell>
                  <TableCell>
                    {unit.abbreviation ? (
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                        {unit.abbreviation}
                      </code>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                      {unit.slug}
                    </code>
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => handleToggleActive(unit)}
                      className="cursor-pointer"
                    >
                      <Badge variant={unit.is_active ? "default" : "secondary"}>
                        {unit.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(unit)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {deleteConfirmId === unit.id ? (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(unit.id)}
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
                          onClick={() => setDeleteConfirmId(unit.id)}
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
          if (!open) setEditingUnit(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingUnit ? "Edit Unit" : "Add Unit"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Name <span className="text-destructive">*</span>
                </label>
                <Input
                  name="name"
                  placeholder="e.g. Bag"
                  defaultValue={editingUnit?.name ?? ""}
                  required
                />
                <p className="text-[10px] text-muted-foreground">
                  Singular form
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Plural Name <span className="text-destructive">*</span>
                </label>
                <Input
                  name="plural_name"
                  placeholder="e.g. Bags"
                  defaultValue={editingUnit?.plural_name ?? ""}
                  required
                />
                <p className="text-[10px] text-muted-foreground">
                  Plural form for display
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Abbreviation</label>
                <Input
                  name="abbreviation"
                  placeholder="e.g. pkt, ctn, bag"
                  defaultValue={editingUnit?.abbreviation ?? ""}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Sort Order</label>
                <Input
                  name="sort_order"
                  type="number"
                  min="0"
                  placeholder="0"
                  defaultValue={editingUnit?.sort_order ?? 0}
                />
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
                  : editingUnit
                    ? "Update Unit"
                    : "Add Unit"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
