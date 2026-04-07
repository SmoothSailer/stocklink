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

// ── Manufacturer Actions ────────────────────────────────────────

export async function getManufacturers() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("manufacturers")
    .select("*, sales_reps(id, name)")
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return data;
}

export async function createManufacturer(formData: FormData) {
  const supabase = createAdminClient();
  const name = formData.get("name") as string;
  const description = formData.get("description") as string | null;
  const location = formData.get("location") as string | null;
  const website = formData.get("website") as string | null;
  const contact_person = formData.get("contact_person") as string | null;
  const contact_phone = formData.get("contact_phone") as string | null;
  const contact_email = formData.get("contact_email") as string | null;
  const sales_rep_id = formData.get("sales_rep_id") as string | null;

  if (!name?.trim()) {
    return { error: "Manufacturer name is required" };
  }

  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const { error } = await supabase.from("manufacturers").insert({
    name: name.trim(),
    slug,
    description: description?.trim() || null,
    location: location?.trim() || null,
    website: website?.trim() || null,
    contact_person: contact_person?.trim() || null,
    contact_phone: contact_phone?.trim() || null,
    contact_email: contact_email?.trim() || null,
    sales_rep_id: sales_rep_id || null,
  });

  if (error) return { error: error.message };
  revalidatePath("/admin/manufacturers");
  return { error: null };
}

export async function updateManufacturer(id: string, formData: FormData) {
  const supabase = createAdminClient();
  const name = formData.get("name") as string;
  const description = formData.get("description") as string | null;
  const location = formData.get("location") as string | null;
  const website = formData.get("website") as string | null;
  const contact_person = formData.get("contact_person") as string | null;
  const contact_phone = formData.get("contact_phone") as string | null;
  const contact_email = formData.get("contact_email") as string | null;
  const sales_rep_id = formData.get("sales_rep_id") as string | null;
  const is_active = formData.get("is_active") === "true";

  if (!name?.trim()) {
    return { error: "Manufacturer name is required" };
  }

  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const { error } = await supabase
    .from("manufacturers")
    .update({
      name: name.trim(),
      slug,
      description: description?.trim() || null,
      location: location?.trim() || null,
      website: website?.trim() || null,
      contact_person: contact_person?.trim() || null,
      contact_phone: contact_phone?.trim() || null,
      contact_email: contact_email?.trim() || null,
      sales_rep_id: sales_rep_id || null,
      is_active,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/admin/manufacturers");
  return { error: null };
}

export async function deleteManufacturer(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("manufacturers").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/manufacturers");
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
  const password = formData.get("password") as string | null;

  if (!name?.trim() || !phone?.trim() || !whatsapp_phone?.trim()) {
    return { error: "Name, phone, and WhatsApp phone are required", data: null };
  }

  // Normalize WhatsApp phone: strip +, spaces, dashes
  const normalizedWhatsApp = whatsapp_phone.trim().replace(/[\s\-+]/g, "");

  // If email + password provided, create a Supabase Auth user for dashboard access
  let userId: string | null = null;
  if (email?.trim() && password?.trim()) {
    if (password.trim().length < 6) {
      return { error: "Password must be at least 6 characters", data: null };
    }
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: email.trim().toLowerCase(),
        password: password.trim(),
        email_confirm: true,
        user_metadata: { full_name: name.trim(), role: "sales_rep" },
      });
    if (authError) {
      return { error: `Auth error: ${authError.message}`, data: null };
    }
    userId = authData.user.id;
  }

  const { data, error } = await supabase.from("sales_reps").insert({
    name: name.trim(),
    phone: phone.trim(),
    whatsapp_phone: normalizedWhatsApp,
    email: email?.trim() || null,
    bio: bio?.trim() || null,
    user_id: userId,
  }).select().single();

  if (error) return { error: error.message, data: null };
  revalidatePath("/admin/sales-reps");
  return { error: null, data };
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
    return { error: "Name, phone, and WhatsApp phone are required", data: null };
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

  if (error) return { error: error.message, data: null };
  revalidatePath("/admin/sales-reps");
  return { error: null, data: null };
}

export async function deleteSalesRep(id: string) {
  const supabase = createAdminClient();

  // If the rep has a linked auth user, delete that user first
  const { data: rep } = await supabase
    .from("sales_reps")
    .select("user_id")
    .eq("id", id)
    .single();

  if (rep?.user_id) {
    await supabase.auth.admin.deleteUser(rep.user_id, false);
  }

  const { error } = await supabase.from("sales_reps").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/sales-reps");
  return { error: null };
}

export async function resetSalesRepPassword(repId: string, newPassword: string) {
  const supabase = createAdminClient();

  if (!newPassword || newPassword.length < 6) {
    return { error: "Password must be at least 6 characters" };
  }

  const { data: rep, error: fetchError } = await supabase
    .from("sales_reps")
    .select("user_id")
    .eq("id", repId)
    .single();

  if (fetchError || !rep) return { error: "Sales rep not found" };
  if (!rep.user_id) return { error: "This rep does not have dashboard access" };

  const { error } = await supabase.auth.admin.updateUserById(rep.user_id, {
    password: newPassword,
  });

  if (error) return { error: error.message };
  return { error: null };
}

export async function revokeSalesRepAccess(repId: string) {
  const supabase = createAdminClient();

  const { data: rep, error: fetchError } = await supabase
    .from("sales_reps")
    .select("user_id")
    .eq("id", repId)
    .single();

  if (fetchError || !rep) return { error: "Sales rep not found" };
  if (!rep.user_id) return { error: "This rep does not have dashboard access" };

  // Hard-delete the auth user so the email can be reused
  const { error: authError } = await supabase.auth.admin.deleteUser(rep.user_id, false);
  if (authError) return { error: authError.message };

  // Clear user_id on the sales_reps record
  const { error: updateError } = await supabase
    .from("sales_reps")
    .update({ user_id: null })
    .eq("id", repId);

  if (updateError) return { error: updateError.message };
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

  if (!name?.trim()) return { error: "Name is required", data: null };

  const { data, error } = await supabase
    .from("wholesalers")
    .insert({
      name: name.trim(),
      location: location?.trim() || null,
      phone: phone?.trim() || null,
      sales_rep_id: sales_rep_id || null,
    })
    .select("*, sales_reps(id, name, whatsapp_phone)")
    .single();

  if (error) return { error: error.message, data: null };
  revalidatePath("/admin/wholesalers");
  return { error: null, data };
}

export async function updateWholesaler(id: string, formData: FormData) {
  const supabase = createAdminClient();
  const name = formData.get("name") as string;
  const location = formData.get("location") as string | null;
  const phone = formData.get("phone") as string | null;
  const sales_rep_id = formData.get("sales_rep_id") as string | null;

  if (!name?.trim()) return { error: "Name is required", data: null };

  const { error } = await supabase
    .from("wholesalers")
    .update({
      name: name.trim(),
      location: location?.trim() || null,
      phone: phone?.trim() || null,
      sales_rep_id: sales_rep_id || null,
    })
    .eq("id", id);

  if (error) return { error: error.message, data: null };
  revalidatePath("/admin/wholesalers");
  return { error: null, data: null };
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
    .select("*, wholesalers(name, sales_rep_id, sales_reps(id, name, whatsapp_phone)), manufacturers(name), product_unit_options(*)")
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
  manufacturer_id?: string;
  is_trending?: boolean;
  is_flash_deal?: boolean;
  flash_deal_price?: number;
  flash_deal_expires_at?: string;
}) {
  const supabase = createAdminClient();

  const { data: inserted, error } = await supabase.from("products").insert({
    name: data.name,
    description: data.description || null,
    category: data.category,
    price: data.price,
    unit: data.unit,
    min_order_qty: data.min_order_qty,
    stock: data.stock,
    image_url: data.image_url || null,
    wholesaler_id: data.wholesaler_id || null,
    manufacturer_id: data.manufacturer_id || null,
    is_trending: data.is_trending ?? false,
    is_flash_deal: data.is_flash_deal ?? false,
    flash_deal_price: data.flash_deal_price ?? null,
    flash_deal_expires_at: data.flash_deal_expires_at || null,
  }).select("id").single();

  if (error) return { error: error.message };
  revalidatePath("/admin/products");
  revalidatePath("/");
  return { error: null, id: inserted.id };
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
    manufacturer_id?: string | null;
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

// ── Product Unit Options Actions ────────────────────────────────

export async function getProductUnitOptions(productId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("product_unit_options")
    .select("*")
    .eq("product_id", productId)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return data;
}

export async function saveProductUnitOptions(
  productId: string,
  options: { unit_slug: string; price: number; stock: number; min_order_qty: number }[]
) {
  const supabase = createAdminClient();

  // Delete existing options for this product
  const { error: deleteError } = await supabase
    .from("product_unit_options")
    .delete()
    .eq("product_id", productId);
  if (deleteError) return { error: deleteError.message };

  // Insert new options (if any)
  if (options.length > 0) {
    const rows = options.map((opt, idx) => ({
      product_id: productId,
      unit_slug: opt.unit_slug,
      price: opt.price,
      stock: opt.stock,
      min_order_qty: opt.min_order_qty,
      sort_order: idx,
    }));
    const { error: insertError } = await supabase
      .from("product_unit_options")
      .insert(rows);
    if (insertError) return { error: insertError.message };
  }

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
