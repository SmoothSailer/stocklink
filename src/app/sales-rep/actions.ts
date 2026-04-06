"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Get the current sales rep's profile from the authenticated session.
 */
export async function getCurrentSalesRep() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("sales_reps")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return data;
}

/** Verify the calling user owns the given rep id (guard for mutations). */
async function verifyRepOwnership(repId: string): Promise<boolean> {
  const rep = await getCurrentSalesRep();
  return rep?.id === repId;
}

/**
 * Get wholesalers assigned to a sales rep.
 */
export async function getRepWholesalers(repId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("wholesalers")
    .select("*")
    .eq("sales_rep_id", repId)
    .order("name", { ascending: true });

  return data ?? [];
}

/**
 * Get products belonging to the rep's assigned wholesalers.
 */
export async function getRepProducts(repId: string) {
  const supabase = await createClient();

  // First get wholesaler IDs assigned to this rep
  const { data: wholesalers } = await supabase
    .from("wholesalers")
    .select("id")
    .eq("sales_rep_id", repId);

  if (!wholesalers || wholesalers.length === 0) return [];

  const wholesalerIds = wholesalers.map((w) => w.id);

  const { data } = await supabase
    .from("products")
    .select("*, wholesalers(id, name, location)")
    .in("wholesaler_id", wholesalerIds)
    .order("created_at", { ascending: false });

  return data ?? [];
}

/**
 * Get orders that contain products from the rep's assigned wholesalers.
 */
export async function getRepOrders(repId: string) {
  const supabase = await createClient();

  // Get wholesaler IDs for this rep
  const { data: wholesalers } = await supabase
    .from("wholesalers")
    .select("id")
    .eq("sales_rep_id", repId);

  if (!wholesalers || wholesalers.length === 0) return [];

  const wholesalerIds = wholesalers.map((w) => w.id);

  // Get products for those wholesalers
  const { data: products } = await supabase
    .from("products")
    .select("id")
    .in("wholesaler_id", wholesalerIds);

  if (!products || products.length === 0) return [];

  const productIds = products.map((p) => p.id);

  // Get order_items for those products, then get distinct orders
  const { data: orderItems } = await supabase
    .from("order_items")
    .select("order_id")
    .in("product_id", productIds);

  if (!orderItems || orderItems.length === 0) return [];

  const orderIds = [...new Set(orderItems.map((oi) => oi.order_id).filter(Boolean))] as string[];

  if (orderIds.length === 0) return [];

  const { data: orders } = await supabase
    .from("orders")
    .select("*, order_items(*, products(name, unit, wholesaler_id, wholesalers(name)))")
    .in("id", orderIds)
    .order("created_at", { ascending: false })
    .limit(50);

  return orders ?? [];
}

/**
 * Get summary stats for a sales rep's dashboard.
 */
export async function getRepDashboardStats(repId: string) {
  const supabase = await createClient();

  // Get wholesalers
  const { data: wholesalers } = await supabase
    .from("wholesalers")
    .select("id")
    .eq("sales_rep_id", repId);

  const wholesalerIds = wholesalers?.map((w) => w.id) ?? [];

  if (wholesalerIds.length === 0) {
    return {
      totalWholesalers: 0,
      totalProducts: 0,
      lowStockProducts: 0,
      totalOrders: 0,
      pendingOrders: 0,
      totalRevenue: 0,
    };
  }

  // Get products
  const { data: products } = await supabase
    .from("products")
    .select("id, stock")
    .in("wholesaler_id", wholesalerIds);

  const productIds = products?.map((p) => p.id) ?? [];
  const lowStockProducts = products?.filter((p) => p.stock <= 5).length ?? 0;

  // Get orders
  let totalOrders = 0;
  let pendingOrders = 0;
  let totalRevenue = 0;

  if (productIds.length > 0) {
    const { data: orderItems } = await supabase
      .from("order_items")
      .select("order_id")
      .in("product_id", productIds);

    const orderIds = [
      ...new Set(orderItems?.map((oi) => oi.order_id).filter(Boolean)),
    ] as string[];

    if (orderIds.length > 0) {
      const { data: orders } = await supabase
        .from("orders")
        .select("id, status, total")
        .in("id", orderIds);

      totalOrders = orders?.length ?? 0;
      pendingOrders =
        orders?.filter(
          (o) => o.status === "placed" || o.status === "confirmed"
        ).length ?? 0;
      totalRevenue =
        orders
          ?.filter((o) => o.status !== "cancelled")
          .reduce((sum, o) => sum + (o.total ?? 0), 0) ?? 0;
    }
  }

  return {
    totalWholesalers: wholesalerIds.length,
    totalProducts: productIds.length,
    lowStockProducts,
    totalOrders,
    pendingOrders,
    totalRevenue,
  };
}

// ── Mutation Actions ────────────────────────────────────────────

/**
 * Get categories for product form dropdowns.
 */
export async function getCategories() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("id, name, slug, icon")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  return data ?? [];
}

/**
 * Get product units for product form dropdowns.
 */
export async function getProductUnits() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("product_units")
    .select("id, name, slug, abbreviation")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  return data ?? [];
}

/**
 * Create a new wholesaler assigned to the calling rep.
 */
export async function repCreateWholesaler(repId: string, formData: FormData) {
  if (!(await verifyRepOwnership(repId))) {
    return { error: "Unauthorized", data: null };
  }

  const supabase = await createClient();
  const name = formData.get("name") as string;
  const location = formData.get("location") as string | null;
  const phone = formData.get("phone") as string | null;

  if (!name?.trim()) return { error: "Name is required", data: null };

  const { data, error } = await supabase
    .from("wholesalers")
    .insert({
      name: name.trim(),
      location: location?.trim() || null,
      phone: phone?.trim() || null,
      sales_rep_id: repId,
    })
    .select()
    .single();

  if (error) return { error: error.message, data: null };
  revalidatePath("/sales-rep/dashboard");
  return { error: null, data };
}

/**
 * Update an existing wholesaler (must be assigned to the calling rep).
 */
export async function repUpdateWholesaler(
  repId: string,
  wholesalerId: string,
  formData: FormData
) {
  if (!(await verifyRepOwnership(repId))) {
    return { error: "Unauthorized" };
  }

  const supabase = await createClient();

  // Confirm this wholesaler belongs to the rep
  const { data: existing } = await supabase
    .from("wholesalers")
    .select("id")
    .eq("id", wholesalerId)
    .eq("sales_rep_id", repId)
    .single();

  if (!existing) return { error: "Wholesaler not found or not assigned to you" };

  const name = formData.get("name") as string;
  const location = formData.get("location") as string | null;
  const phone = formData.get("phone") as string | null;

  if (!name?.trim()) return { error: "Name is required" };

  const { error } = await supabase
    .from("wholesalers")
    .update({
      name: name.trim(),
      location: location?.trim() || null,
      phone: phone?.trim() || null,
    })
    .eq("id", wholesalerId);

  if (error) return { error: error.message };
  revalidatePath("/sales-rep/dashboard");
  return { error: null };
}

/**
 * Create a product for one of the rep's assigned wholesalers.
 */
export async function repCreateProduct(repId: string, formData: FormData) {
  if (!(await verifyRepOwnership(repId))) {
    return { error: "Unauthorized" };
  }

  const supabase = await createClient();
  const wholesaler_id = formData.get("wholesaler_id") as string;
  const name = formData.get("name") as string;
  const category = formData.get("category") as string;
  const price = parseFloat(formData.get("price") as string);
  const unit = formData.get("unit") as string;
  const stock = parseInt(formData.get("stock") as string, 10);
  const min_order_qty = parseInt(formData.get("min_order_qty") as string, 10) || 1;
  const description = formData.get("description") as string | null;

  if (!name?.trim() || !category || isNaN(price) || !unit || isNaN(stock)) {
    return { error: "Name, category, price, unit, and stock are required" };
  }

  // Confirm wholesaler belongs to the rep
  const { data: w } = await supabase
    .from("wholesalers")
    .select("id")
    .eq("id", wholesaler_id)
    .eq("sales_rep_id", repId)
    .single();

  if (!w) return { error: "Wholesaler not found or not assigned to you" };

  const { error } = await supabase.from("products").insert({
    name: name.trim(),
    description: description?.trim() || null,
    category,
    price,
    unit,
    stock: Math.max(0, stock),
    min_order_qty: Math.max(1, min_order_qty),
    wholesaler_id,
  });

  if (error) return { error: error.message };
  revalidatePath("/sales-rep/dashboard");
  revalidatePath("/");
  return { error: null };
}

/**
 * Update product stock and/or price (must belong to one of the rep's wholesalers).
 */
export async function repUpdateProduct(
  repId: string,
  productId: string,
  formData: FormData
) {
  if (!(await verifyRepOwnership(repId))) {
    return { error: "Unauthorized" };
  }

  const supabase = await createClient();

  // Ensure the product's wholesaler is assigned to the rep
  const { data: product } = await supabase
    .from("products")
    .select("id, wholesaler_id")
    .eq("id", productId)
    .single();

  if (!product) return { error: "Product not found" };

  if (product.wholesaler_id) {
    const { data: w } = await supabase
      .from("wholesalers")
      .select("id")
      .eq("id", product.wholesaler_id)
      .eq("sales_rep_id", repId)
      .single();

    if (!w) return { error: "Product not assigned to your wholesalers" };
  }

  const name = formData.get("name") as string | null;
  const price = formData.get("price") ? parseFloat(formData.get("price") as string) : undefined;
  const stock = formData.get("stock") ? parseInt(formData.get("stock") as string, 10) : undefined;
  const min_order_qty = formData.get("min_order_qty")
    ? parseInt(formData.get("min_order_qty") as string, 10)
    : undefined;

  const updateData: Record<string, unknown> = {};
  if (name?.trim()) updateData.name = name.trim();
  if (price !== undefined && !isNaN(price)) updateData.price = price;
  if (stock !== undefined && !isNaN(stock)) updateData.stock = Math.max(0, stock);
  if (min_order_qty !== undefined && !isNaN(min_order_qty))
    updateData.min_order_qty = Math.max(1, min_order_qty);

  if (Object.keys(updateData).length === 0) {
    return { error: "Nothing to update" };
  }

  const { error } = await supabase
    .from("products")
    .update(updateData)
    .eq("id", productId);

  if (error) return { error: error.message };
  revalidatePath("/sales-rep/dashboard");
  revalidatePath("/");
  return { error: null };
}
