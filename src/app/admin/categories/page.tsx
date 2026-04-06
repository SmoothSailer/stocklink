"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  GripVertical,
  Tag,
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
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/app/admin/actions";
import type { Category } from "@/types/database";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch {
      // Empty state shown on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = categories.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.slug.toLowerCase().includes(q)
    );
  });

  const totalCategories = categories.length;
  const activeCategories = categories.filter((c) => c.is_active).length;
  const inactiveCategories = totalCategories - activeCategories;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);

    try {
      const formData = new FormData(e.currentTarget);
      if (editingCategory) {
        formData.set("is_active", editingCategory.is_active ? "true" : "false");
      }

      const result = editingCategory
        ? await updateCategory(editingCategory.id, formData)
        : await createCategory(formData);

      if (result.error) {
        setFormError(result.error);
        setSaving(false);
        return;
      }

      setDialogOpen(false);
      setEditingCategory(null);
      await loadData();
    } catch {
      setFormError("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const result = await deleteCategory(id);
    if (!result.error) {
      setDeleteConfirmId(null);
      await loadData();
    }
  }

  async function handleToggleActive(category: Category) {
    const formData = new FormData();
    formData.set("name", category.name);
    formData.set("icon", category.icon);
    formData.set("sort_order", String(category.sort_order));
    formData.set("is_active", category.is_active ? "false" : "true");
    await updateCategory(category.id, formData);
    await loadData();
  }

  function openEdit(category: Category) {
    setEditingCategory(category);
    setFormError(null);
    setDialogOpen(true);
  }

  function openAdd() {
    setEditingCategory(null);
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
          <h1 className="text-xl font-bold sm:text-2xl">Categories</h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Manage product categories displayed to retailers
          </p>
        </div>
        <Button className="w-full gap-2 sm:w-auto" onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Card>
          <CardContent className="flex items-center gap-2 p-3 sm:gap-3 sm:p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 sm:h-10 sm:w-10">
              <Tag className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold sm:text-2xl">{totalCategories}</p>
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
              <p className="text-lg font-bold sm:text-2xl">{activeCategories}</p>
              <p className="truncate text-[10px] text-muted-foreground sm:text-xs">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-2 p-3 sm:gap-3 sm:p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 sm:h-10 sm:w-10">
              <XCircle className="h-4 w-4 text-gray-500 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold sm:text-2xl">{inactiveCategories}</p>
              <p className="truncate text-[10px] text-muted-foreground sm:text-xs">Inactive</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative sm:max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search categories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* ─── Mobile Card List ─── */}
      <div className="space-y-3 lg:hidden">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Tag className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="font-medium">No categories found</p>
              <p className="text-sm text-muted-foreground">
                {search ? "Try a different search" : "Add your first category"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filtered.map((cat) => (
            <Card key={cat.id} className={cat.is_active ? "" : "opacity-60"}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{cat.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold">{cat.name}</p>
                      <Badge
                        variant={cat.is_active ? "default" : "secondary"}
                        className="shrink-0 cursor-pointer text-[10px]"
                        onClick={() => handleToggleActive(cat)}
                      >
                        {cat.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                      <code className="rounded bg-muted px-1 text-[10px]">{cat.slug}</code>
                      <span>· Order: {cat.sort_order}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(cat)}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => {
                        if (deleteConfirmId === cat.id) handleDelete(cat.id);
                        else setDeleteConfirmId(cat.id);
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
              <TableHead className="w-12">Order</TableHead>
              <TableHead className="w-16">Icon</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center">
                  <Tag className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="font-medium">No categories found</p>
                  <p className="text-sm text-muted-foreground">
                    {search ? "Try a different search" : "Add your first category"}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <GripVertical className="h-4 w-4" />
                      <span className="text-sm">{cat.sort_order}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-2xl">{cat.icon}</span>
                  </TableCell>
                  <TableCell className="font-medium">{cat.name}</TableCell>
                  <TableCell>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                      {cat.slug}
                    </code>
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => handleToggleActive(cat)}
                      className="cursor-pointer"
                    >
                      <Badge variant={cat.is_active ? "default" : "secondary"}>
                        {cat.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(cat)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {deleteConfirmId === cat.id ? (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(cat.id)}
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
                          onClick={() => setDeleteConfirmId(cat.id)}
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
          if (!open) setEditingCategory(null);
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto max-w-[calc(100vw-2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit Category" : "Add Category"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Name <span className="text-destructive">*</span>
              </label>
              <Input
                name="name"
                placeholder="e.g. Rice"
                defaultValue={editingCategory?.name ?? ""}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Icon <span className="text-destructive">*</span>
                </label>
                <Input
                  name="icon"
                  placeholder="e.g. 🍚"
                  defaultValue={editingCategory?.icon ?? "📦"}
                  required
                />
                <p className="text-[10px] text-muted-foreground">
                  Paste an emoji icon
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Sort Order</label>
                <Input
                  name="sort_order"
                  type="number"
                  min="0"
                  placeholder="0"
                  defaultValue={editingCategory?.sort_order ?? 0}
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
                  : editingCategory
                    ? "Update Category"
                    : "Add Category"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
