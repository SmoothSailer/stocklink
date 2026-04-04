"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

// ── Category Actions ────────────────────────────────────────────

export async function getCategories() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return data;
}

export async function createCategory(formData: FormData) {
  const supabase = createAdminClient();
  const name = formData.get("name") as string;
  const icon = formData.get("icon") as string;
  const sort_order = parseInt(formData.get("sort_order") as string) || 0;

  if (!name?.trim()) return { error: "Name is required" };

  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const { error } = await supabase.from("categories").insert({
    name: name.trim(),
    slug,
    icon: icon?.trim() || "📦",
    sort_order,
  });

  if (error) return { error: error.message };
  revalidatePath("/admin/categories");
  return { error: null };
}

export async function updateCategory(id: string, formData: FormData) {
  const supabase = createAdminClient();
  const name = formData.get("name") as string;
  const icon = formData.get("icon") as string;
  const sort_order = parseInt(formData.get("sort_order") as string) || 0;
  const is_active = formData.get("is_active") === "true";

  if (!name?.trim()) return { error: "Name is required" };

  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const { error } = await supabase
    .from("categories")
    .update({
      name: name.trim(),
      slug,
      icon: icon?.trim() || "📦",
      sort_order,
      is_active,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/admin/categories");
  return { error: null };
}

export async function deleteCategory(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/categories");
  return { error: null };
}

// ── Product Unit Actions ────────────────────────────────────────

export async function getProductUnits() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("product_units")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return data;
}

export async function createProductUnit(formData: FormData) {
  const supabase = createAdminClient();
  const name = formData.get("name") as string;
  const plural_name = formData.get("plural_name") as string;
  const abbreviation = formData.get("abbreviation") as string | null;
  const sort_order = parseInt(formData.get("sort_order") as string) || 0;

  if (!name?.trim() || !plural_name?.trim()) {
    return { error: "Name and plural name are required" };
  }

  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const { error } = await supabase.from("product_units").insert({
    name: name.trim(),
    slug,
    plural_name: plural_name.trim(),
    abbreviation: abbreviation?.trim() || null,
    sort_order,
  });

  if (error) return { error: error.message };
  revalidatePath("/admin/units");
  return { error: null };
}

export async function updateProductUnit(id: string, formData: FormData) {
  const supabase = createAdminClient();
  const name = formData.get("name") as string;
  const plural_name = formData.get("plural_name") as string;
  const abbreviation = formData.get("abbreviation") as string | null;
  const sort_order = parseInt(formData.get("sort_order") as string) || 0;
  const is_active = formData.get("is_active") === "true";

  if (!name?.trim() || !plural_name?.trim()) {
    return { error: "Name and plural name are required" };
  }

  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const { error } = await supabase
    .from("product_units")
    .update({
      name: name.trim(),
      slug,
      plural_name: plural_name.trim(),
      abbreviation: abbreviation?.trim() || null,
      sort_order,
      is_active,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/admin/units");
  return { error: null };
}

export async function deleteProductUnit(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("product_units").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/units");
  return { error: null };
}

// ── Sales Rep Actions ───────────────────────────────────────────

export async function getSalesReps() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("sales_reps")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return data;
}

export async function createSalesRep(formData: FormData) {
  const supabase = createAdminClient();
  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const whatsapp_phone = formData.get("whatsapp_phone") as string;
  const email = formData.get("email") as string | null;
  const bio = formData.get("bio") as string | null;

  if (!name?.trim() || !phone?.trim() || !whatsapp_phone?.trim()) {
    return { error: "Name, phone, and WhatsApp phone are required" };
  }

  // Normalize WhatsApp phone: strip +, spaces, dashes
  const normalizedWhatsApp = whatsapp_phone.trim().replace(/[\s\-+]/g, "");

  const { error } = await supabase.from("sales_reps").insert({
    name: name.trim(),
    phone: phone.trim(),
    whatsapp_phone: normalizedWhatsApp,
    email: email?.trim() || null,
    bio: bio?.trim() || null,
  });

  if (error) return { error: error.message };
  revalidatePath("/admin/sales-reps");
  return { error: null };
}

export async function updateSalesRep(id: string, formData: FormData) {
  const supabase = createAdminClient();
  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const whatsapp_phone = formData.get("whatsapp_phone") as string;
  const email = formData.get("email") as string | null;
  const bio = formData.get("bio") as string | null;
  const is_active = formData.get("is_active") === "true";

  if (!name?.trim() || !phone?.trim() || !whatsapp_phone?.trim()) {
    return { error: "Name, phone, and WhatsApp phone are required" };
  }

  const normalizedWhatsApp = whatsapp_phone.trim().replace(/[\s\-+]/g, "");

  const { error } = await supabase
    .from("sales_reps")
    .update({
      name: name.trim(),
      phone: phone.trim(),
      whatsapp_phone: normalizedWhatsApp,
      email: email?.trim() || null,
      bio: bio?.trim() || null,
      is_active,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/admin/sales-reps");
  return { error: null };
}

export async function deleteSalesRep(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("sales_reps").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/sales-reps");
  return { error: null };
}

// ── Wholesaler Actions ──────────────────────────────────────────

export async function getWholesalers() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("wholesalers")
    .select("*, sales_reps(id, name, whatsapp_phone)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

export async function createWholesaler(formData: FormData) {
  const supabase = createAdminClient();
  const name = formData.get("name") as string;
  const location = formData.get("location") as string | null;
  const phone = formData.get("phone") as string | null;
  const sales_rep_id = formData.get("sales_rep_id") as string | null;

  if (!name?.trim()) return { error: "Name is required" };

  const { error } = await supabase
    .from("wholesalers")
    .insert({
      name: name.trim(),
      location: location?.trim() || null,
      phone: phone?.trim() || null,
      sales_rep_id: sales_rep_id || null,
    });

  if (error) return { error: error.message };
  revalidatePath("/admin/wholesalers");
  return { error: null };
}

export async function updateWholesaler(id: string, formData: FormData) {
  const supabase = createAdminClient();
  const name = formData.get("name") as string;
  const location = formData.get("location") as string | null;
  const phone = formData.get("phone") as string | null;
  const sales_rep_id = formData.get("sales_rep_id") as string | null;

  if (!name?.trim()) return { error: "Name is required" };

  const { error } = await supabase
    .from("wholesalers")
    .update({
      name: name.trim(),
      location: location?.trim() || null,
      phone: phone?.trim() || null,
      sales_rep_id: sales_rep_id || null,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/admin/wholesalers");
  return { error: null };
}

export async function deleteWholesaler(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("wholesalers").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/wholesalers");
  return { error: null };
}

// ── Product Actions ─────────────────────────────────────────────

export async function getProducts() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, wholesalers(name, sales_rep_id, sales_reps(id, name, whatsapp_phone))")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

export async function createProduct(data: {
  name: string;
  description?: string;
  category: string;
  price: number;
  unit: string;
  min_order_qty: number;
  stock: number;
  image_url?: string;
  wholesaler_id?: string;
  is_trending?: boolean;
  is_flash_deal?: boolean;
  flash_deal_price?: number;
  flash_deal_expires_at?: string;
}) {
  const supabase = createAdminClient();

  const { error } = await supabase.from("products").insert({
    name: data.name,
    description: data.description || null,
    category: data.category,
    price: data.price,
    unit: data.unit,
    min_order_qty: data.min_order_qty,
    stock: data.stock,
    image_url: data.image_url || null,
    wholesaler_id: data.wholesaler_id || null,
    is_trending: data.is_trending ?? false,
    is_flash_deal: data.is_flash_deal ?? false,
    flash_deal_price: data.flash_deal_price ?? null,
    flash_deal_expires_at: data.flash_deal_expires_at || null,
  });

  if (error) return { error: error.message };
  revalidatePath("/admin/products");
  revalidatePath("/");
  return { error: null };
}

export async function updateProduct(
  id: string,
  data: {
    name?: string;
    description?: string | null;
    category?: string;
    price?: number;
    unit?: string;
    min_order_qty?: number;
    stock?: number;
    image_url?: string | null;
    wholesaler_id?: string | null;
    is_trending?: boolean;
    is_flash_deal?: boolean;
    flash_deal_price?: number | null;
    flash_deal_expires_at?: string | null;
  }
) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("products").update(data).eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/admin/products");
  revalidatePath("/");
  return { error: null };
}

export async function deleteProduct(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/products");
  revalidatePath("/");
  return { error: null };
}

// ── Order Actions ───────────────────────────────────────────────

export async function getOrders() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*, products(name, unit))")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

export async function updateOrderStatus(
  id: string,
  status: "placed" | "confirmed" | "out_for_delivery" | "delivered" | "cancelled"
) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/admin/orders");
  return { error: null };
}

// ── Dashboard Stats ─────────────────────────────────────────────

export async function getDashboardStats() {
  const supabase = createAdminClient();

  const [productsRes, ordersRes, wholesalersRes, demandRes, salesRepsRes] = await Promise.all([
    supabase.from("products").select("id, stock, price, is_trending, category"),
    supabase.from("orders").select("id, status, total, created_at"),
    supabase.from("wholesalers").select("id"),
    supabase.from("demand_requests").select("*").order("created_at", { ascending: false }).limit(10),
    supabase.from("sales_reps").select("id").eq("is_active", true),
  ]);

  return {
    products: productsRes.data ?? [],
    orders: ordersRes.data ?? [],
    wholesalers: wholesalersRes.data ?? [],
    demandRequests: demandRes.data ?? [],
    salesReps: salesRepsRes.data ?? [],
  };
}
