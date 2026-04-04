"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  AlertTriangle,
  Upload,
  X,
  ImageIcon,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getProducts,
  getWholesalers,
  getCategories,
  getProductUnits,
  createProduct,
  updateProduct,
  deleteProduct,
} from "@/app/admin/actions";
import { uploadProductImage } from "@/lib/supabase/storage";
import { formatPrice, getStockInfo } from "@/lib/utils";
import type { Wholesaler, Category, ProductUnit } from "@/types/database";

interface ProductWithWholesaler {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  unit: string;
  min_order_qty: number;
  stock: number;
  image_url: string | null;
  wholesaler_id: string | null;
  is_trending: boolean;
  is_flash_deal: boolean;
  flash_deal_price: number | null;
  flash_deal_expires_at: string | null;
  location: string | null;
  created_at: string;
  updated_at: string;
  wholesalers: { name: string } | null;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductWithWholesaler[]>([]);
  const [wholesalers, setWholesalers] = useState<Wholesaler[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<ProductUnit[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] =
    useState<ProductWithWholesaler | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async () => {
    try {
      const [prods, whs, cats, uns] = await Promise.all([
        getProducts(),
        getWholesalers(),
        getCategories(),
        getProductUnits(),
      ]);
      setProducts(prods as ProductWithWholesaler[]);
      setWholesalers(whs);
      setCategories(cats);
      setUnits(uns);
    } catch {
      // Empty state shown on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = products.filter((p) => {
    const matchesSearch =
      !search || p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const totalProducts = products.length;
  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 20).length;
  const outOfStock = products.filter((p) => p.stock === 0).length;
  const totalValue = products.reduce((acc, p) => acc + p.price * p.stock, 0);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function clearImage() {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);

    try {
      const form = e.currentTarget;
      const formData = new FormData(form);

      const name = formData.get("name") as string;
      const description = formData.get("description") as string;
      const category = formData.get("category") as string;
      const price = parseFloat(formData.get("price") as string);
      const unit = formData.get("unit") as string;
      const min_order_qty = parseInt(formData.get("min_order_qty") as string);
      const stock = parseInt(formData.get("stock") as string);
      const wholesaler_id = formData.get("wholesaler_id") as string;
      const is_trending = formData.get("is_trending") === "on";
      const is_flash_deal = formData.get("is_flash_deal") === "on";
      const flash_deal_price = formData.get("flash_deal_price")
        ? parseFloat(formData.get("flash_deal_price") as string)
        : undefined;

      if (!name?.trim()) {
        setFormError("Product name is required");
        setSaving(false);
        return;
      }

      // Upload image if selected
      let image_url: string | undefined | null = editingProduct?.image_url;
      if (imageFile) {
        try {
          image_url = await uploadProductImage(imageFile);
        } catch (err) {
          setFormError(
            `Image upload failed: ${err instanceof Error ? err.message : "Unknown error"}`
          );
          setSaving(false);
          return;
        }
      }

      const productData = {
        name: name.trim(),
        description: description?.trim() || undefined,
        category,
        price,
        unit: unit || "bag",
        min_order_qty: min_order_qty || 1,
        stock: stock || 0,
        image_url: image_url ?? undefined,
        wholesaler_id: wholesaler_id || undefined,
        is_trending,
        is_flash_deal,
        flash_deal_price: is_flash_deal ? flash_deal_price : undefined,
      };

      const result = editingProduct
        ? await updateProduct(editingProduct.id, productData)
        : await createProduct(productData as Parameters<typeof createProduct>[0]);

      if (result.error) {
        setFormError(result.error);
        setSaving(false);
        return;
      }

      setDialogOpen(false);
      setEditingProduct(null);
      clearImage();
      await loadData();
    } catch {
      setFormError("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const result = await deleteProduct(id);
    if (result.error) {
      setFormError(result.error);
    } else {
      setDeleteConfirmId(null);
      setFormError(null);
      await loadData();
    }
  }

  function openEdit(product: ProductWithWholesaler) {
    setEditingProduct(product);
    setFormError(null);
    clearImage();
    if (product.image_url) setImagePreview(product.image_url);
    setDialogOpen(true);
  }

  function openAdd() {
    setEditingProduct(null);
    setFormError(null);
    clearImage();
    setDialogOpen(true);
  }

  const getCategoryIcon = (category: string) => {
    return (
      categories.find((c) => c.slug === category)?.icon ?? "📦"
    );
  };

  return (
    <div className="space-y-6">
      {/* Error banner */}
      {formError && !dialogOpen && (
        <div className="flex items-center justify-between rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3">
          <p className="text-sm text-destructive">{formError}</p>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setFormError(null)}>
            Dismiss
          </Button>
        </div>
      )}

      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-sm text-muted-foreground">
            Manage products, stock levels, pricing, and images
          </p>
        </div>
        <Button className="gap-2" onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalProducts}</p>
              <p className="text-xs text-muted-foreground">Total Products</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{lowStock}</p>
              <p className="text-xs text-muted-foreground">Low Stock</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
              <Package className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">{outOfStock}</p>
              <p className="text-xs text-muted-foreground">Out of Stock</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatPrice(totalValue)}</p>
              <p className="text-xs text-muted-foreground">Stock Value</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & filter */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={categoryFilter}
          onValueChange={(val) => setCategoryFilter(val ?? "all")}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.filter((c) => c.is_active).map((cat) => (
              <SelectItem key={cat.slug} value={cat.slug}>
                {cat.icon} {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Products table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm font-medium text-muted-foreground">
                {search || categoryFilter !== "all"
                  ? "No products found"
                  : "No products yet"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {search || categoryFilter !== "all"
                  ? "Try different filters"
                  : "Add your first product to get started"}
              </p>
            </div>
          ) : (
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
                {filtered.map((product) => {
                  const stockInfo = getStockInfo(product.stock, product.unit);
                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {product.image_url ? (
                            <div className="relative h-9 w-9 overflow-hidden rounded-lg">
                              <Image
                                src={product.image_url}
                                alt={product.name}
                                fill
                                className="object-cover"
                                sizes="36px"
                              />
                            </div>
                          ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-lg">
                              {getCategoryIcon(product.category)}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium">
                              {product.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              per {product.unit}
                            </p>
                          </div>
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
                        {formatPrice(product.price)}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {product.min_order_qty} {product.unit}s
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
                        {deleteConfirmId === product.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-xs text-destructive">
                              Delete?
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => setDeleteConfirmId(null)}
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => handleDelete(product.id)}
                            >
                              Confirm
                            </Button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEdit(product)}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setDeleteConfirmId(product.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingProduct(null);
            setFormError(null);
            clearImage();
          }
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Edit Product" : "Add New Product"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Image upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Product Image</label>
              <div className="flex items-center gap-4">
                {imagePreview ? (
                  <div className="relative h-20 w-20 overflow-hidden rounded-lg border">
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                    <button
                      type="button"
                      onClick={clearImage}
                      className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-dashed">
                    <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
                  </div>
                )}
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    {imagePreview ? "Change" : "Upload"}
                  </Button>
                  <p className="mt-1 text-xs text-muted-foreground">
                    JPEG, PNG, WebP (max 5MB)
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Product Name <span className="text-destructive">*</span>
              </label>
              <Input
                name="name"
                placeholder="e.g. Pishori Rice 25kg"
                defaultValue={editingProduct?.name ?? ""}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Price (KSh) <span className="text-destructive">*</span>
                </label>
                <Input
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  defaultValue={editingProduct?.price ?? ""}
                  required
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
                  defaultValue={editingProduct?.stock ?? 0}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Category <span className="text-destructive">*</span>
                </label>
                <select
                  name="category"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  defaultValue={editingProduct?.category ?? ""}
                  required
                >
                  <option value="">Select category...</option>
                  {categories.filter((c) => c.is_active).map((cat) => (
                    <option key={cat.slug} value={cat.slug}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Unit</label>
                <select
                  name="unit"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  defaultValue={editingProduct?.unit ?? "bag"}
                >
                  {units.filter((u) => u.is_active).map((u) => (
                    <option key={u.slug} value={u.slug}>
                      {u.name} ({u.plural_name})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Min Order Qty</label>
                <Input
                  name="min_order_qty"
                  type="number"
                  min="1"
                  placeholder="5"
                  defaultValue={editingProduct?.min_order_qty ?? 5}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Wholesaler <span className="text-destructive">*</span>
                </label>
                <select
                  name="wholesaler_id"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  defaultValue={editingProduct?.wholesaler_id ?? ""}
                  required
                >
                  <option value="">Select wholesaler...</option>
                  {wholesalers.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input
                name="description"
                placeholder="Product description..."
                defaultValue={editingProduct?.description ?? ""}
              />
            </div>

            {/* Flags */}
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="is_trending"
                  defaultChecked={editingProduct?.is_trending ?? false}
                  className="h-4 w-4 rounded border-input"
                />
                Mark as Trending 🔥
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="is_flash_deal"
                  defaultChecked={editingProduct?.is_flash_deal ?? false}
                  className="h-4 w-4 rounded border-input"
                />
                Flash Deal ⚡
              </label>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Flash Deal Price (optional)
              </label>
              <Input
                name="flash_deal_price"
                type="number"
                min="0"
                step="0.01"
                placeholder="Leave blank if not a flash deal"
                defaultValue={editingProduct?.flash_deal_price ?? ""}
              />
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
                  : editingProduct
                    ? "Update Product"
                    : "Add Product"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
