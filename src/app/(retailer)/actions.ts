"use server";

import { createClient } from "@/lib/supabase/server";

// ── Product Queries ─────────────────────────────────────────────

export async function getPublicProducts() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "*, wholesalers(id, name, location, phone, sales_rep_id, sales_reps(id, name, phone, whatsapp_phone, bio, avatar_url)), manufacturers(id, name)"
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
      "*, wholesalers(id, name, location, phone, sales_rep_id, sales_reps(id, name, phone, whatsapp_phone, bio, avatar_url)), manufacturers(id, name)"
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
    .select("*, wholesalers(id, name, location), manufacturers(id, name)")
    .eq("is_trending", true)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

export async function getFlashDeals() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, wholesalers(id, name, location), manufacturers(id, name)")
    .eq("is_flash_deal", true)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

export async function getBulkStockProducts(limit = 4) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, wholesalers(id, name, location), manufacturers(id, name)")
    .gt("stock", 0)
    .order("stock", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data;
}

// ── Order Queries ───────────────────────────────────────────────

export async function getOrders() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

export async function getOrderById(id: string) {
  const supabase = await createClient();
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();
  if (orderError) return null;

  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select("*, products(id, name, category, unit, image_url)")
    .eq("order_id", id);
  if (itemsError) throw new Error(itemsError.message);

  return { order, items: items ?? [] };
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
