"use server";

import { createClient } from "@/lib/supabase/server";

// ── Category Queries ────────────────────────────────────────────

export async function getCategories() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return data;
}

// ── Product Queries ─────────────────────────────────────────────

export async function getPublicProducts() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "*, wholesalers(id, name, location, phone, sales_rep_id, sales_reps(id, name, phone, whatsapp_phone, bio, avatar_url)), manufacturers(id, name), product_unit_options(*), product_media(*)"
    )
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

export async function getProductById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "*, wholesalers(id, name, location, phone, sales_rep_id, sales_reps(id, name, phone, whatsapp_phone, bio, avatar_url)), manufacturers(id, name), product_unit_options(*), product_media(*)"
    )
    .eq("id", id)
    .single();
  if (error) return null;
  return data;
}

export async function getTrendingProducts() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, wholesalers(id, name, location), manufacturers(id, name), product_unit_options(*), product_media(*)")
    .eq("is_trending", true)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

export async function getFlashDeals() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, wholesalers(id, name, location), manufacturers(id, name), product_unit_options(*), product_media(*)")
    .eq("is_flash_deal", true)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

export async function getBulkStockProducts(limit = 4) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, wholesalers(id, name, location), manufacturers(id, name), product_unit_options(*), product_media(*)")
    .gt("stock", 0)
    .order("stock", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data;
}

// ── Order Queries ───────────────────────────────────────────────

export async function getOrders() {
  const supabase = await createClient();

  // Get current user's retailer record
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: retailer } = await supabase
    .from("retailers")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!retailer) return [];

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("retailer_id", retailer.id)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

export async function getOrderById(id: string) {
  const supabase = await createClient();

  // Get current user's retailer record
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: retailer } = await supabase
    .from("retailers")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!retailer) return null;

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .eq("retailer_id", retailer.id)
    .single();
  if (orderError) return null;

  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select("*, products(id, name, category, unit, image_url)")
    .eq("order_id", id);
  if (itemsError) throw new Error(itemsError.message);

  const { data: statusHistory } = await supabase
    .from("order_status_history")
    .select("*")
    .eq("order_id", id)
    .order("created_at", { ascending: true });

  return { order, items: items ?? [], statusHistory: statusHistory ?? [] };
}

// ── Order Mutations ─────────────────────────────────────────────

export async function placeOrder(data: {
  items: Array<{
    product_id: string;
    quantity: number;
    unit_price: number;
    unit: string;
  }>;
  delivery_address: string;
  payment_method: "mpesa" | "cash" | "card";
  notes?: string;
}): Promise<{ order_id: string; error: string | null }> {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { order_id: "", error: "Not authenticated" };

  // Get retailer record
  const { data: retailer } = await supabase
    .from("retailers")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!retailer) return { order_id: "", error: "Retailer profile not found" };

  // Calculate total
  const total = data.items.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0
  );

  // Insert order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      retailer_id: retailer.id,
      status: "placed",
      total,
      delivery_address: data.delivery_address,
      payment_method: data.payment_method,
      notes: data.notes ?? null,
    })
    .select("id")
    .single();

  if (orderError) return { order_id: "", error: orderError.message };

  // Insert order items
  const orderItems = data.items.map((item) => ({
    order_id: order.id,
    product_id: item.product_id,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total_price: item.unit_price * item.quantity,
    unit: item.unit,
  }));

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItems);

  if (itemsError) return { order_id: "", error: itemsError.message };

  // Record initial status in history
  await supabase.from("order_status_history").insert({
    order_id: order.id,
    status: "placed",
    changed_by: user.id,
  });

  return { order_id: order.id, error: null };
}

// ── Wholesaler Queries ──────────────────────────────────────────

export async function getWholesalerById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("wholesalers")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data;
}

export async function getWholesalerProducts(wholesalerId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("wholesaler_id", wholesalerId)
    .order("name");
  if (error) throw new Error(error.message);
  return data;
}

export async function getWholesalerPendingOrderCount(wholesalerId: string) {
  const supabase = await createClient();
  // Get product IDs for this wholesaler
  const { data: products } = await supabase
    .from("products")
    .select("id")
    .eq("wholesaler_id", wholesalerId);
  if (!products || products.length === 0) return 0;

  const productIds = products.map((p) => p.id);

  // Get order items for these products
  const { data: orderItems } = await supabase
    .from("order_items")
    .select("order_id")
    .in("product_id", productIds);
  if (!orderItems || orderItems.length === 0) return 0;

  const orderIds = [...new Set(orderItems.map((oi) => oi.order_id).filter(Boolean))] as string[];
  if (orderIds.length === 0) return 0;

  // Count orders that are not delivered or cancelled
  const { count } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .in("id", orderIds)
    .not("status", "in", '("delivered","cancelled")');

  return count ?? 0;
}

// ── Affiliate Queries ───────────────────────────────────────────

export async function getAffiliateByUserId(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("affiliates")
    .select("*")
    .eq("user_id", userId)
    .single();
  if (error) return null;
  return data;
}

export async function getAffiliateReferrals(affiliateId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("referrals")
    .select("*")
    .eq("affiliate_id", affiliateId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}
