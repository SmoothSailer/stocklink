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
  Film,
  GripVertical,
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
  getManufacturers,
  createProduct,
  updateProduct,
  deleteProduct,
  saveProductUnitOptions,
  saveProductMedia,
} from "@/app/admin/actions";
import { uploadProductMedia, deleteProductMedia, isVideoFile, getMediaType } from "@/lib/supabase/storage";
import { formatPrice, getStockInfo } from "@/lib/utils";
import type { Wholesaler, Category, ProductUnit, Manufacturer, ProductUnitOption, ProductMedia } from "@/types/database";

interface UnitOptionRow {
  unit_slug: string;
  price: number;
  stock: number;
  min_order_qty: number;
  pieces_per_unit?: number;
}

interface MediaItem {
  id?: string;
  url: string;
  type: "image" | "video";
  file?: File;
  preview?: string;
}

interface ProductWithWholesaler {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  unit: string;
  min_order_qty: number;
  stock: number;
  pieces_per_unit: number | null;
  image_url: string | null;
  wholesaler_id: string | null;
  manufacturer_id: string | null;
  is_trending: boolean;
  is_flash_deal: boolean;
  is_coming_soon: boolean;
  expected_arrival_date: string | null;
  flash_deal_price: number | null;
  flash_deal_expires_at: string | null;
  location: string | null;
  created_at: string;
  updated_at: string;
  wholesalers: { name: string } | null;
  manufacturers: { name: string } | null;
  product_unit_options: ProductUnitOption[];
  product_media: ProductMedia[];
}

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductWithWholesaler[]>([]);
  const [wholesalers, setWholesalers] = useState<Wholesaler[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
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
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [unitOptions, setUnitOptions] = useState<UnitOptionRow[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedUnit, setSelectedUnit] = useState<string>("bag");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async () => {
    try {
      const [prods, whs, cats, uns, mfrs] = await Promise.allSettled([
        getProducts(),
        getWholesalers(),
        getCategories(),
        getProductUnits(),
        getManufacturers(),
      ]);
      if (prods.status === "fulfilled") setProducts(prods.value as ProductWithWholesaler[]);
      if (whs.status === "fulfilled") setWholesalers(whs.value);
      if (cats.status === "fulfilled") setCategories(cats.value);
      if (uns.status === "fulfilled") setUnits(uns.value);
      if (mfrs.status === "fulfilled") setManufacturers(mfrs.value);
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

  function handleMediaAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    const newItems: MediaItem[] = Array.from(files).map((file) => ({
      url: "",
      type: isVideoFile(file) ? "video" as const : "image" as const,
      file,
      preview: URL.createObjectURL(file),
    }));
    setMediaItems((prev) => [...prev, ...newItems]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeMediaItem(index: number) {
    setMediaItems((prev) => {
      const item = prev[index];
      if (item.preview && item.file) URL.revokeObjectURL(item.preview);
      return prev.filter((_, i) => i !== index);
    });
  }

  function clearAllMedia() {
    mediaItems.forEach((item) => {
      if (item.preview && item.file) URL.revokeObjectURL(item.preview);
    });
    setMediaItems([]);
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
      const pieces_per_unit = formData.get("pieces_per_unit")
        ? parseInt(formData.get("pieces_per_unit") as string)
        : undefined;
      const wholesaler_id = formData.get("wholesaler_id") as string;
      const manufacturer_id = formData.get("manufacturer_id") as string;
      const is_trending = formData.get("is_trending") === "on";
      const is_flash_deal = formData.get("is_flash_deal") === "on";
      const is_coming_soon = formData.get("is_coming_soon") === "on";
      const expected_arrival_date = formData.get("expected_arrival_date") as string || undefined;
      const flash_deal_price = formData.get("flash_deal_price")
        ? parseFloat(formData.get("flash_deal_price") as string)
        : undefined;
      const flash_deal_expires_at = formData.get("flash_deal_expires_at") as string || undefined;

      if (!name?.trim()) {
        setFormError("Product name is required");
        setSaving(false);
        return;
      }

      // Upload new media files
      const uploadedMedia: { url: string; type: "image" | "video"; sort_order: number }[] = [];
      let firstImageUrl: string | undefined | null = editingProduct?.image_url;

      for (let i = 0; i < mediaItems.length; i++) {
        const item = mediaItems[i];
        if (item.file) {
          try {
            const url = await uploadProductMedia(item.file);
            uploadedMedia.push({ url, type: item.type, sort_order: i });
            if (!firstImageUrl && item.type === "image") firstImageUrl = url;
          } catch (err) {
            setFormError(
              `Upload failed: ${err instanceof Error ? err.message : "Unknown error"}`
            );
            setSaving(false);
            return;
          }
        } else {
          // Existing media (already uploaded)
          uploadedMedia.push({ url: item.url, type: item.type, sort_order: i });
          if (!firstImageUrl && item.type === "image") firstImageUrl = item.url;
        }
      }

      // Use the first image as the product thumbnail (image_url)
      if (uploadedMedia.length > 0) {
        const firstImage = uploadedMedia.find((m) => m.type === "image");
        firstImageUrl = firstImage?.url ?? uploadedMedia[0].url;
      } else {
        firstImageUrl = null;
      }

      const productData = {
        name: name.trim(),
        description: description?.trim() || undefined,
        category,
        price,
        unit: unit || "bag",
        min_order_qty: min_order_qty || 1,
        stock: stock || 0,
        pieces_per_unit: pieces_per_unit || undefined,
        image_url: firstImageUrl ?? undefined,
        wholesaler_id: wholesaler_id || undefined,
        manufacturer_id: manufacturer_id || undefined,
        is_trending,
        is_flash_deal,
        is_coming_soon,
        expected_arrival_date: is_coming_soon ? expected_arrival_date : undefined,
        flash_deal_price: is_flash_deal ? flash_deal_price : undefined,
        flash_deal_expires_at: is_flash_deal && flash_deal_expires_at
          ? new Date(flash_deal_expires_at).toISOString()
          : undefined,
      };

      const result = editingProduct
        ? await updateProduct(editingProduct.id, productData)
        : await createProduct(productData as Parameters<typeof createProduct>[0]);

      if (result.error) {
        setFormError(result.error);
        setSaving(false);
        return;
      }

      // Save unit options
      const productId = editingProduct?.id ?? (result as { id?: string }).id;
      if (productId) {
        const unitResult = await saveProductUnitOptions(productId, unitOptions);
        if (unitResult.error) {
          setFormError(unitResult.error);
          setSaving(false);
          return;
        }

        // Save product media
        if (uploadedMedia.length > 0) {
          const mediaResult = await saveProductMedia(productId, uploadedMedia);
          if (mediaResult.error) {
            setFormError(mediaResult.error);
            setSaving(false);
            return;
          }
        }
      }

      setDialogOpen(false);
      setEditingProduct(null);
      clearAllMedia();
      setUnitOptions([]);
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
    clearAllMedia();
    // Load existing media
    const existingMedia: MediaItem[] = (product.product_media ?? [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((m) => ({
        id: m.id,
        url: m.url,
        type: m.type as "image" | "video",
      }));
    // If no product_media but has image_url, use that as fallback
    if (existingMedia.length === 0 && product.image_url) {
      existingMedia.push({
        url: product.image_url,
        type: getMediaType(product.image_url),
      });
    }
    setMediaItems(existingMedia);
    setUnitOptions(
      (product.product_unit_options ?? []).map((o) => ({
        unit_slug: o.unit_slug,
        price: o.price,
        stock: o.stock,
        min_order_qty: o.min_order_qty,
        pieces_per_unit: o.pieces_per_unit ?? undefined,
      }))
    );
    setSelectedCategory(product.category);
    setSelectedUnit(product.unit);
    setDialogOpen(true);
  }

  function openAdd() {
    setEditingProduct(null);
    setFormError(null);
    clearAllMedia();
    setUnitOptions([]);
    setSelectedCategory("");
    setSelectedUnit("bag");
    setDialogOpen(true);
  }

  const getCategoryIcon = (category: string) => {
    return (
      categories.find((c) => c.slug === category)?.icon ?? "📦"
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">Products</h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Manage products, stock levels, pricing, and images
          </p>
        </div>
        <Button className="w-full gap-2 sm:w-auto" onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-2 p-3 sm:gap-3 sm:p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 sm:h-10 sm:w-10">
              <Package className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold sm:text-2xl">{totalProducts}</p>
              <p className="truncate text-[10px] text-muted-foreground sm:text-xs">Total Products</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-2 p-3 sm:gap-3 sm:p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-100 sm:h-10 sm:w-10">
              <AlertTriangle className="h-4 w-4 text-orange-600 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold sm:text-2xl">{lowStock}</p>
              <p className="truncate text-[10px] text-muted-foreground sm:text-xs">Low Stock</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-2 p-3 sm:gap-3 sm:p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100 sm:h-10 sm:w-10">
              <Package className="h-4 w-4 text-destructive sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold sm:text-2xl">{outOfStock}</p>
              <p className="truncate text-[10px] text-muted-foreground sm:text-xs">Out of Stock</p>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-2 lg:col-span-1">
          <CardContent className="flex items-center gap-2 p-3 sm:gap-3 sm:p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-100 sm:h-10 sm:w-10">
              <Package className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-lg font-bold sm:text-2xl">{formatPrice(totalValue)}</p>
              <p className="truncate text-[10px] text-muted-foreground sm:text-xs">Stock Value</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & filter */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1 sm:max-w-sm">
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
          <SelectTrigger className="w-full sm:w-[180px]">
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

      {/* Products */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
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
          </CardContent>
        </Card>
      ) : (
        <>
          {/* ─── Mobile Card List ─── */}
          <div className="space-y-3 lg:hidden">
            {filtered.map((product) => {
              const stockInfo = getStockInfo(product.stock, product.unit);
              return (
                <Card key={product.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {product.image_url ? (
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg">
                          <Image
                            src={product.image_url}
                            alt={product.name}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        </div>
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted text-xl">
                          {getCategoryIcon(product.category)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">{product.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {product.wholesalers?.name ?? "No wholesaler"}
                              {product.manufacturers?.name ? ` · ${product.manufacturers.name}` : ""}
                              {" "}· per {product.unit}
                              {(product.product_unit_options?.length ?? 0) > 0 && (
                                <span className="ml-1 text-primary">+{product.product_unit_options.length} unit{product.product_unit_options.length > 1 ? "s" : ""}</span>
                              )}
                            </p>
                          </div>
                          <Badge variant={stockInfo.variant} className="shrink-0 text-[10px]">
                            {product.stock} {product.unit}s
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-primary">{formatPrice(product.price)}</span>
                        <Badge variant="outline" className="text-[10px] capitalize">{product.category}</Badge>
                        {product.is_trending && <span className="text-[10px]">🔥</span>}
                        {product.is_flash_deal && <span className="text-[10px]">⚡</span>}
                      </div>
                      <p className="text-[10px] text-muted-foreground">MOQ: {product.min_order_qty}</p>
                    </div>
                    <div className="mt-3 flex gap-2 border-t pt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 flex-1 gap-1.5 text-xs"
                        onClick={() => openEdit(product)}
                      >
                        <Edit className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 gap-1.5 text-xs text-destructive hover:text-destructive"
                        onClick={() => {
                          if (deleteConfirmId === product.id) {
                            handleDelete(product.id);
                          } else {
                            setDeleteConfirmId(product.id);
                          }
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {deleteConfirmId === product.id ? "Confirm" : "Delete"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* ─── Desktop Table ─── */}
          <Card className="hidden lg:block">
            <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">MOQ</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead>Wholesaler</TableHead>
                  <TableHead>Manufacturer</TableHead>
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
                              {(product.product_unit_options?.length ?? 0) > 0 && (
                                <span className="ml-1 text-primary">+{product.product_unit_options.length}</span>
                              )}
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
                      <TableCell className="text-sm text-muted-foreground">
                        {product.manufacturers?.name ?? "—"}
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
            </CardContent>
          </Card>
        </>
      )}

      {/* Add/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingProduct(null);
            setFormError(null);
            clearAllMedia();
          }
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto max-w-[calc(100vw-2rem)] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Edit Product" : "Add New Product"}
            </DialogTitle>
          </DialogHeader>
          <form key={editingProduct?.id ?? "new"} onSubmit={handleSubmit} className="space-y-4">
            {/* Media upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Product Media</label>
              <div className="flex flex-wrap gap-2">
                {mediaItems.map((item, idx) => (
                  <div key={idx} className="group relative h-20 w-20 overflow-hidden rounded-lg border">
                    {item.type === "video" ? (
                      <div className="flex h-full w-full items-center justify-center bg-muted">
                        <Film className="h-6 w-6 text-muted-foreground" />
                        <span className="absolute bottom-0.5 left-0.5 rounded bg-black/60 px-1 text-[8px] text-white">
                          Video
                        </span>
                      </div>
                    ) : (
                      <Image
                        src={item.preview ?? item.url}
                        alt={`Media ${idx + 1}`}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => removeMediaItem(idx)}
                      className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    {idx === 0 && (
                      <span className="absolute bottom-0.5 right-0.5 rounded bg-primary/80 px-1 text-[8px] text-white">
                        Cover
                      </span>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border border-dashed hover:border-primary/50 hover:bg-muted/50 transition-colors"
                >
                  <Upload className="h-4 w-4 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">Add</span>
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Images (JPEG, PNG, WebP) & short videos (MP4, WebM) — max 5MB each. First image is the cover.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
                className="hidden"
                onChange={handleMediaAdd}
                multiple
              />
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
                <input type="hidden" name="category" value={selectedCategory} />
                <Select
                  value={selectedCategory}
                  onValueChange={(v) => setSelectedCategory(v ?? "")}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.filter((c) => c.is_active).map((cat) => (
                      <SelectItem key={cat.slug} value={cat.slug}>
                        {cat.icon} {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Unit</label>
                <input type="hidden" name="unit" value={selectedUnit} />
                <Select
                  value={selectedUnit}
                  onValueChange={(v) => setSelectedUnit(v ?? "bag")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit..." />
                  </SelectTrigger>
                  <SelectContent>
                    {units.filter((u) => u.is_active).map((u) => (
                      <SelectItem key={u.slug} value={u.slug}>
                        {u.name} ({u.plural_name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              {selectedCategory !== "lpg" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Pieces per Unit</label>
                  <Input
                    name="pieces_per_unit"
                    type="number"
                    min="1"
                    placeholder="e.g. 12 pieces per box"
                    defaultValue={editingProduct?.pieces_per_unit ?? ""}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Wholesaler
                </label>
                <select
                  name="wholesaler_id"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  defaultValue={editingProduct?.wholesaler_id ?? ""}
                >
                  <option value="">No wholesaler</option>
                  {wholesalers.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Additional Unit Options */}
            <div className="space-y-3 rounded-lg border border-dashed p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Additional Unit Options</p>
                  <p className="text-xs text-muted-foreground">
                    Sell this product in multiple units (e.g. pieces and boxes)
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 text-xs"
                  onClick={() =>
                    setUnitOptions([...unitOptions, { unit_slug: "", price: 0, stock: 0, min_order_qty: 1, pieces_per_unit: undefined }])
                  }
                >
                  <Plus className="h-3 w-3" />
                  Add Unit
                </Button>
              </div>
              {unitOptions.map((opt, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_auto] gap-2">
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-2 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      value={opt.unit_slug}
                      onChange={(e) => {
                        const updated = [...unitOptions];
                        updated[idx] = { ...updated[idx], unit_slug: e.target.value };
                        setUnitOptions(updated);
                      }}
                      required
                    >
                      <option value="">Unit...</option>
                      {units.filter((u) => u.is_active).map((u) => (
                        <option key={u.slug} value={u.slug}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Price"
                      className="h-9 text-xs"
                      value={opt.price || ""}
                      onChange={(e) => {
                        const updated = [...unitOptions];
                        updated[idx] = { ...updated[idx], price: parseFloat(e.target.value) || 0 };
                        setUnitOptions(updated);
                      }}
                      required
                    />
                    <Input
                      type="number"
                      min="0"
                      placeholder="Stock"
                      className="h-9 text-xs"
                      value={opt.stock || ""}
                      onChange={(e) => {
                        const updated = [...unitOptions];
                        updated[idx] = { ...updated[idx], stock: parseInt(e.target.value) || 0 };
                        setUnitOptions(updated);
                      }}
                    />
                    <Input
                      type="number"
                      min="1"
                      placeholder="MOQ"
                      className="h-9 text-xs"
                      value={opt.min_order_qty || ""}
                      onChange={(e) => {
                        const updated = [...unitOptions];
                        updated[idx] = { ...updated[idx], min_order_qty: parseInt(e.target.value) || 1 };
                        setUnitOptions(updated);
                      }}
                    />
                    <Input
                      type="number"
                      min="1"
                      placeholder="Pcs/unit"
                      className="h-9 text-xs"
                      value={opt.pieces_per_unit || ""}
                      onChange={(e) => {
                        const updated = [...unitOptions];
                        updated[idx] = { ...updated[idx], pieces_per_unit: parseInt(e.target.value) || undefined };
                        setUnitOptions(updated);
                      }}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 shrink-0 text-destructive hover:text-destructive"
                    onClick={() => setUnitOptions(unitOptions.filter((_, i) => i !== idx))}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              {unitOptions.length === 0 && (
                <p className="text-center text-xs text-muted-foreground py-1">
                  No additional units. The default unit above will be used.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Manufacturer</label>
              <select
                name="manufacturer_id"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                defaultValue={editingProduct?.manufacturer_id ?? ""}
              >
                <option value="">No manufacturer</option>
                {manufacturers.filter((m) => m.is_active).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
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
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="is_coming_soon"
                  defaultChecked={editingProduct?.is_coming_soon ?? false}
                  className="h-4 w-4 rounded border-input"
                />
                Coming Soon 🕐
              </label>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Expected Arrival Date (optional)
              </label>
              <Input
                name="expected_arrival_date"
                type="date"
                defaultValue={editingProduct?.expected_arrival_date ?? ""}
              />
              <p className="text-xs text-muted-foreground">
                Retailers can join a waitlist for Coming Soon products.
              </p>
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

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Flash Deal Expires At
              </label>
              <Input
                name="flash_deal_expires_at"
                type="datetime-local"
                defaultValue={
                  editingProduct?.flash_deal_expires_at
                    ? new Date(editingProduct.flash_deal_expires_at)
                        .toISOString()
                        .slice(0, 16)
                    : ""
                }
              />
              <p className="text-xs text-muted-foreground">
                Set when this deal expires. A countdown will show on the storefront.
              </p>
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
