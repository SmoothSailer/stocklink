"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendRetailerOnboardingEmail } from "@/lib/emails";

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
 * Get products belonging to the rep's assigned wholesalers or manufacturers.
 */
export async function getRepProducts(repId: string) {
  const supabase = await createClient();

  // Get wholesaler IDs assigned to this rep
  const { data: wholesalers } = await supabase
    .from("wholesalers")
    .select("id")
    .eq("sales_rep_id", repId);

  // Get manufacturer IDs assigned to this rep
  const { data: manufacturers } = await supabase
    .from("manufacturers")
    .select("id")
    .eq("sales_rep_id", repId);

  const wholesalerIds = wholesalers?.map((w) => w.id) ?? [];
  const manufacturerIds = manufacturers?.map((m) => m.id) ?? [];

  if (wholesalerIds.length === 0 && manufacturerIds.length === 0) return [];

  // Build query with OR conditions for wholesaler_id and manufacturer_id
  let query = supabase
    .from("products")
    .select("*, wholesalers(id, name, location), manufacturers(id, name), product_unit_options(*)")
    .order("created_at", { ascending: false });

  if (wholesalerIds.length > 0 && manufacturerIds.length > 0) {
    query = query.or(
      `wholesaler_id.in.(${wholesalerIds.join(",")}),manufacturer_id.in.(${manufacturerIds.join(",")})`
    );
  } else if (wholesalerIds.length > 0) {
    query = query.in("wholesaler_id", wholesalerIds);
  } else {
    query = query.in("manufacturer_id", manufacturerIds);
  }

  const { data } = await query;
  return data ?? [];
}

/**
 * Get orders that contain products from the rep's assigned wholesalers or manufacturers.
 */
export async function getRepOrders(repId: string) {
  const supabase = await createClient();

  // Get wholesaler IDs for this rep
  const { data: wholesalers } = await supabase
    .from("wholesalers")
    .select("id")
    .eq("sales_rep_id", repId);

  // Get manufacturer IDs for this rep
  const { data: manufacturers } = await supabase
    .from("manufacturers")
    .select("id")
    .eq("sales_rep_id", repId);

  const wholesalerIds = wholesalers?.map((w) => w.id) ?? [];
  const manufacturerIds = manufacturers?.map((m) => m.id) ?? [];

  if (wholesalerIds.length === 0 && manufacturerIds.length === 0) return [];

  // Get products for those wholesalers and manufacturers
  let productsQuery = supabase.from("products").select("id");

  if (wholesalerIds.length > 0 && manufacturerIds.length > 0) {
    productsQuery = productsQuery.or(
      `wholesaler_id.in.(${wholesalerIds.join(",")}),manufacturer_id.in.(${manufacturerIds.join(",")})`
    );
  } else if (wholesalerIds.length > 0) {
    productsQuery = productsQuery.in("wholesaler_id", wholesalerIds);
  } else {
    productsQuery = productsQuery.in("manufacturer_id", manufacturerIds);
  }

  const { data: products } = await productsQuery;

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
    .select("*, retailers(id, name, business_name, phone, location), order_items(*, products(name, unit, wholesaler_id, wholesalers(name)))")
    .in("id", orderIds)
    .order("created_at", { ascending: false })
    .limit(50);

  return orders ?? [];
}

/**
 * Update order status — sales rep can confirm, mark out_for_delivery, delivered, or cancel.
 * Verifies the order contains products belonging to the rep's wholesalers/manufacturers.
 */
export async function repUpdateOrderStatus(
  repId: string,
  orderId: string,
  status: "confirmed" | "out_for_delivery" | "delivered" | "cancelled"
) {
  if (!(await verifyRepOwnership(repId))) {
    return { error: "Unauthorized" };
  }

  const supabase = await createClient();

  // Verify this order belongs to the rep's products
  const { data: wholesalers } = await supabase
    .from("wholesalers")
    .select("id")
    .eq("sales_rep_id", repId);

  const { data: manufacturers } = await supabase
    .from("manufacturers")
    .select("id")
    .eq("sales_rep_id", repId);

  const wholesalerIds = wholesalers?.map((w) => w.id) ?? [];
  const manufacturerIds = manufacturers?.map((m) => m.id) ?? [];

  if (wholesalerIds.length === 0 && manufacturerIds.length === 0) {
    return { error: "No wholesalers or manufacturers assigned" };
  }

  // Check that at least one order item has a product from this rep's scope
  const { data: orderItems } = await supabase
    .from("order_items")
    .select("product_id, products(wholesaler_id, manufacturer_id)")
    .eq("order_id", orderId);

  if (!orderItems || orderItems.length === 0) {
    return { error: "Order not found or has no items" };
  }

  const hasAccess = orderItems.some((item) => {
    const p = item.products as { wholesaler_id: string | null; manufacturer_id: string | null } | null;
    if (!p) return false;
    return (
      (p.wholesaler_id && wholesalerIds.includes(p.wholesaler_id)) ||
      (p.manufacturer_id && manufacturerIds.includes(p.manufacturer_id))
    );
  });

  if (!hasAccess) {
    return { error: "You don't have permission to manage this order" };
  }

  // Update order status
  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId);

  if (error) return { error: error.message };

  // Get current user for history
  const { data: { user } } = await supabase.auth.getUser();

  // Log status change in history
  await supabase.from("order_status_history").insert({
    order_id: orderId,
    status,
    changed_by: user?.id ?? null,
  });

  revalidatePath("/sales-rep/dashboard");
  return { error: null };
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

  // Get manufacturers
  const { data: manufacturers } = await supabase
    .from("manufacturers")
    .select("id")
    .eq("sales_rep_id", repId);

  const wholesalerIds = wholesalers?.map((w) => w.id) ?? [];
  const manufacturerIds = manufacturers?.map((m) => m.id) ?? [];

  if (wholesalerIds.length === 0 && manufacturerIds.length === 0) {
    return {
      totalWholesalers: 0,
      totalManufacturers: 0,
      totalProducts: 0,
      lowStockProducts: 0,
      totalOrders: 0,
      pendingOrders: 0,
      totalRevenue: 0,
    };
  }

  // Get products from both wholesalers and manufacturers
  let productsQuery = supabase
    .from("products")
    .select("id, stock");

  if (wholesalerIds.length > 0 && manufacturerIds.length > 0) {
    productsQuery = productsQuery.or(
      `wholesaler_id.in.(${wholesalerIds.join(",")}),manufacturer_id.in.(${manufacturerIds.join(",")})`
    );
  } else if (wholesalerIds.length > 0) {
    productsQuery = productsQuery.in("wholesaler_id", wholesalerIds);
  } else {
    productsQuery = productsQuery.in("manufacturer_id", manufacturerIds);
  }

  const { data: products } = await productsQuery;

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
    totalManufacturers: manufacturerIds.length,
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
 * Get manufacturers assigned to a sales rep.
 */
export async function getRepManufacturers(repId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("manufacturers")
    .select("*")
    .eq("sales_rep_id", repId)
    .order("name", { ascending: true });
  return data ?? [];
}

/**
 * Create a new manufacturer assigned to the calling rep.
 */
export async function repCreateManufacturer(repId: string, formData: FormData) {
  if (!(await verifyRepOwnership(repId))) {
    return { error: "Unauthorized", data: null };
  }

  const supabase = await createClient();
  const name = formData.get("name") as string;
  const location = formData.get("location") as string | null;
  const contact_person = formData.get("contact_person") as string | null;
  const contact_phone = formData.get("contact_phone") as string | null;

  if (!name?.trim()) return { error: "Name is required", data: null };

  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const { data, error } = await supabase
    .from("manufacturers")
    .insert({
      name: name.trim(),
      slug,
      location: location?.trim() || null,
      contact_person: contact_person?.trim() || null,
      contact_phone: contact_phone?.trim() || null,
      sales_rep_id: repId,
    })
    .select()
    .single();

  if (error) return { error: error.message, data: null };
  revalidatePath("/sales-rep/dashboard");
  return { error: null, data };
}

/**
 * Update a manufacturer (must be assigned to the calling rep).
 */
export async function repUpdateManufacturer(
  repId: string,
  manufacturerId: string,
  formData: FormData
) {
  if (!(await verifyRepOwnership(repId))) {
    return { error: "Unauthorized" };
  }

  const supabase = await createClient();

  // Confirm this manufacturer belongs to the rep
  const { data: existing } = await supabase
    .from("manufacturers")
    .select("id")
    .eq("id", manufacturerId)
    .eq("sales_rep_id", repId)
    .single();

  if (!existing) return { error: "Manufacturer not found or not assigned to you" };

  const name = formData.get("name") as string;
  const location = formData.get("location") as string | null;
  const contact_person = formData.get("contact_person") as string | null;
  const contact_phone = formData.get("contact_phone") as string | null;

  if (!name?.trim()) return { error: "Name is required" };

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
      location: location?.trim() || null,
      contact_person: contact_person?.trim() || null,
      contact_phone: contact_phone?.trim() || null,
    })
    .eq("id", manufacturerId);

  if (error) return { error: error.message };
  revalidatePath("/sales-rep/dashboard");
  return { error: null };
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
 * Create a product for one of the rep's assigned wholesalers or manufacturers.
 */
export async function repCreateProduct(repId: string, formData: FormData) {
  if (!(await verifyRepOwnership(repId))) {
    return { error: "Unauthorized" };
  }

  const supabase = await createClient();
  const wholesaler_id = formData.get("wholesaler_id") as string;
  const manufacturer_id = formData.get("manufacturer_id") as string;
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

  if (!wholesaler_id && !manufacturer_id) {
    return { error: "Please assign a wholesaler or manufacturer" };
  }

  // Confirm wholesaler belongs to the rep (if provided)
  if (wholesaler_id) {
    const { data: w } = await supabase
      .from("wholesalers")
      .select("id")
      .eq("id", wholesaler_id)
      .eq("sales_rep_id", repId)
      .single();

    if (!w) return { error: "Wholesaler not found or not assigned to you" };
  }

  // Confirm manufacturer belongs to the rep (if provided)
  if (manufacturer_id) {
    const { data: m } = await supabase
      .from("manufacturers")
      .select("id")
      .eq("id", manufacturer_id)
      .eq("sales_rep_id", repId)
      .single();

    if (!m) return { error: "Manufacturer not found or not assigned to you" };
  }

  const { data: inserted, error } = await supabase.from("products").insert({
    name: name.trim(),
    description: description?.trim() || null,
    category,
    price,
    unit,
    stock: Math.max(0, stock),
    min_order_qty: Math.max(1, min_order_qty),
    wholesaler_id: wholesaler_id || null,
    manufacturer_id: manufacturer_id || null,
  }).select("id").single();

  if (error) return { error: error.message };
  revalidatePath("/sales-rep/dashboard");
  revalidatePath("/");
  return { error: null, id: inserted.id };
}

/**
 * Save additional unit options for a product (owned by rep's wholesaler/manufacturer).
 */
export async function repSaveProductUnitOptions(
  repId: string,
  productId: string,
  options: { unit_slug: string; price: number; stock: number; min_order_qty: number }[]
) {
  if (!(await verifyRepOwnership(repId))) {
    return { error: "Unauthorized" };
  }

  const supabase = await createClient();

  // Delete existing options
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

// ── Payment Tracking Actions ────────────────────────────────────

/**
 * Record a payment against an order.
 * Updates order's amount_paid, payment_status, and paid_at.
 */
export async function repRecordPayment(
  repId: string,
  orderId: string,
  payment: {
    amount: number;
    method: "mpesa" | "cash" | "card";
    reference?: string;
    notes?: string;
  }
) {
  if (!(await verifyRepOwnership(repId))) {
    return { error: "Unauthorized" };
  }

  const supabase = await createClient();

  // Verify ownership of the order (same check as repUpdateOrderStatus)
  const { data: wholesalers } = await supabase
    .from("wholesalers")
    .select("id")
    .eq("sales_rep_id", repId);

  const { data: manufacturers } = await supabase
    .from("manufacturers")
    .select("id")
    .eq("sales_rep_id", repId);

  const wholesalerIds = wholesalers?.map((w) => w.id) ?? [];
  const manufacturerIds = manufacturers?.map((m) => m.id) ?? [];

  if (wholesalerIds.length === 0 && manufacturerIds.length === 0) {
    return { error: "No wholesalers or manufacturers assigned" };
  }

  const { data: orderItems } = await supabase
    .from("order_items")
    .select("product_id, products(wholesaler_id, manufacturer_id)")
    .eq("order_id", orderId);

  if (!orderItems || orderItems.length === 0) {
    return { error: "Order not found or has no items" };
  }

  const hasAccess = orderItems.some((item) => {
    const p = item.products as { wholesaler_id: string | null; manufacturer_id: string | null } | null;
    if (!p) return false;
    return (
      (p.wholesaler_id && wholesalerIds.includes(p.wholesaler_id)) ||
      (p.manufacturer_id && manufacturerIds.includes(p.manufacturer_id))
    );
  });

  if (!hasAccess) {
    return { error: "You don't have permission to manage this order" };
  }

  // Get the order to calculate new amount_paid
  const { data: order } = await supabase
    .from("orders")
    .select("total, amount_paid")
    .eq("id", orderId)
    .single();

  if (!order) return { error: "Order not found" };

  const { data: { user } } = await supabase.auth.getUser();

  // Insert payment record
  const { error: insertError } = await supabase.from("payment_records").insert({
    order_id: orderId,
    amount: payment.amount,
    method: payment.method,
    reference: payment.reference || null,
    notes: payment.notes || null,
    recorded_by: user?.id ?? null,
  });

  if (insertError) return { error: insertError.message };

  // Update order totals
  const newAmountPaid = (order.amount_paid ?? 0) + payment.amount;
  const isPaid = newAmountPaid >= order.total;
  const paymentStatus: "pending" | "partial" | "paid" =
    newAmountPaid <= 0 ? "pending" : isPaid ? "paid" : "partial";

  const { error: updateError } = await supabase
    .from("orders")
    .update({
      amount_paid: newAmountPaid,
      payment_status: paymentStatus,
      ...(isPaid ? { paid_at: new Date().toISOString() } : {}),
    })
    .eq("id", orderId);

  if (updateError) return { error: updateError.message };

  revalidatePath("/sales-rep/dashboard");
  return { error: null };
}

/**
 * Get payment records for an order.
 */
export async function getOrderPayments(orderId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("payment_records")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });

  return data ?? [];
}

// ── Murabaha BNPL Actions ───────────────────────────────────────

/**
 * Create a Murabaha BNPL plan for an order.
 * Sets up the installment schedule with due dates.
 */
export async function repCreateBnplPlan(
  repId: string,
  orderId: string,
  plan: {
    cost_price: number;
    markup_amount: number;
    num_installments: number;
    first_due_date: string;
    interval_days: number;
  }
) {
  if (!(await verifyRepOwnership(repId))) {
    return { error: "Unauthorized" };
  }

  const supabase = await createClient();

  // Verify order exists and belongs to rep's wholesalers/manufacturers
  const { data: wholesalers } = await supabase
    .from("wholesalers")
    .select("id")
    .eq("sales_rep_id", repId);

  const { data: manufacturers } = await supabase
    .from("manufacturers")
    .select("id")
    .eq("sales_rep_id", repId);

  const wholesalerIds = wholesalers?.map((w) => w.id) ?? [];
  const manufacturerIds = manufacturers?.map((m) => m.id) ?? [];

  const { data: orderItems } = await supabase
    .from("order_items")
    .select("product_id, products(wholesaler_id, manufacturer_id)")
    .eq("order_id", orderId);

  if (!orderItems || orderItems.length === 0) {
    return { error: "Order not found or has no items" };
  }

  const hasAccess = orderItems.some((item) => {
    const p = item.products as { wholesaler_id: string | null; manufacturer_id: string | null } | null;
    if (!p) return false;
    return (
      (p.wholesaler_id && wholesalerIds.includes(p.wholesaler_id)) ||
      (p.manufacturer_id && manufacturerIds.includes(p.manufacturer_id))
    );
  });

  if (!hasAccess) {
    return { error: "You don't have permission to manage this order" };
  }

  // Get the order to check retailer eligibility
  const { data: order } = await supabase
    .from("orders")
    .select("retailer_id")
    .eq("id", orderId)
    .single();

  if (!order?.retailer_id) {
    return { error: "Order has no associated retailer" };
  }

  // Check retailer BNPL eligibility
  const { data: retailer } = await supabase
    .from("retailers")
    .select("id, verification_status, credit_limit, bnpl_enabled")
    .eq("id", order.retailer_id)
    .single();

  if (!retailer) return { error: "Retailer not found" };
  if (retailer.verification_status !== "verified") {
    return { error: "Retailer is not verified — BNPL cannot be created" };
  }
  if (!retailer.bnpl_enabled) {
    return { error: "BNPL is not enabled for this retailer" };
  }

  // Check credit limit
  const { data: exposure } = await supabase.rpc("get_retailer_bnpl_exposure", { p_retailer_id: retailer.id });
  const creditUsed = typeof exposure === "number" ? exposure : 0;
  const totalWithMarkupCheck = plan.cost_price + plan.markup_amount;
  const availableCredit = retailer.credit_limit - creditUsed;

  if (totalWithMarkupCheck > availableCredit) {
    return { error: `Plan total (KSh ${totalWithMarkupCheck.toLocaleString()}) exceeds retailer's available credit (KSh ${Math.floor(availableCredit).toLocaleString()})` };
  }

  // Check for overdue installments
  const { data: retailerOrders } = await supabase
    .from("orders")
    .select("id")
    .eq("retailer_id", retailer.id);

  const retailerOrderIds = retailerOrders?.map(o => o.id) ?? [];
  if (retailerOrderIds.length > 0) {
    const { data: existingPlans } = await supabase
      .from("bnpl_plans")
      .select("id")
      .in("order_id", retailerOrderIds);

    const planIds = existingPlans?.map(p => p.id) ?? [];
    if (planIds.length > 0) {
      const { count: overdueCount } = await supabase
        .from("bnpl_installments")
        .select("id", { count: "exact", head: true })
        .eq("status", "overdue")
        .in("plan_id", planIds);

      if (overdueCount && overdueCount > 0) {
        return { error: "Retailer has overdue installments — cannot create new BNPL plan" };
      }
    }
  }

  // Check no plan exists already
  const { data: existingPlan } = await supabase
    .from("bnpl_plans")
    .select("id")
    .eq("order_id", orderId)
    .maybeSingle();

  if (existingPlan) {
    return { error: "A BNPL plan already exists for this order" };
  }

  const DOWN_PAYMENT_RATE = 0.3;
  const totalWithMarkup = plan.cost_price + plan.markup_amount;
  const downPayment = Math.ceil(totalWithMarkup * DOWN_PAYMENT_RATE * 100) / 100;
  const remainingAmount = totalWithMarkup - downPayment;
  const installmentAmount = Math.ceil((remainingAmount / plan.num_installments) * 100) / 100;

  const { data: { user } } = await supabase.auth.getUser();

  // Create the plan
  const { data: bnplPlan, error: planError } = await supabase
    .from("bnpl_plans")
    .insert({
      order_id: orderId,
      cost_price: plan.cost_price,
      markup_amount: plan.markup_amount,
      total_with_markup: totalWithMarkup,
      num_installments: plan.num_installments,
      installment_amount: installmentAmount,
      down_payment_rate: DOWN_PAYMENT_RATE,
      down_payment: downPayment,
      created_by: user?.id ?? null,
    })
    .select("id")
    .single();

  if (planError) return { error: planError.message };

  // Create installment schedule (only the remaining 70%)
  const installments = [];
  const firstDue = new Date(plan.first_due_date);
  for (let i = 0; i < plan.num_installments; i++) {
    const dueDate = new Date(firstDue);
    dueDate.setDate(dueDate.getDate() + i * plan.interval_days);
    // Last installment gets the remainder to avoid rounding issues
    const amount = i === plan.num_installments - 1
      ? remainingAmount - installmentAmount * (plan.num_installments - 1)
      : installmentAmount;
    installments.push({
      plan_id: bnplPlan.id,
      installment_number: i + 1,
      amount,
      due_date: dueDate.toISOString().split("T")[0],
      status: "upcoming" as const,
    });
  }

  const { error: instError } = await supabase
    .from("bnpl_installments")
    .insert(installments);

  if (instError) return { error: instError.message };

  // Update the order total to reflect the markup
  await supabase
    .from("orders")
    .update({ total: totalWithMarkup })
    .eq("id", orderId);

  revalidatePath("/sales-rep/dashboard");
  return { error: null };
}

/**
 * Record the 30% down payment for a BNPL plan.
 * Creates a payment_record, updates bnpl_plans.down_payment_paid_at,
 * and updates the order's amount_paid / payment_status.
 */
export async function repRecordDownPayment(
  repId: string,
  orderId: string,
  payment: {
    method: "mpesa" | "cash" | "card";
    reference?: string;
    notes?: string;
  }
) {
  if (!(await verifyRepOwnership(repId))) {
    return { error: "Unauthorized" };
  }

  const supabase = await createClient();

  // Get the BNPL plan for this order
  const { data: plan } = await supabase
    .from("bnpl_plans")
    .select("id, down_payment, down_payment_paid_at, order_id")
    .eq("order_id", orderId)
    .single();

  if (!plan) return { error: "No BNPL plan found for this order" };
  if (plan.down_payment_paid_at) return { error: "Down payment already recorded" };

  const { data: { user } } = await supabase.auth.getUser();

  // Create payment record for the down payment
  const { error: insertError } = await supabase.from("payment_records").insert({
    order_id: orderId,
    amount: plan.down_payment,
    method: payment.method,
    reference: payment.reference || null,
    notes: payment.notes || `BNPL 30% down payment`,
    recorded_by: user?.id ?? null,
  });

  if (insertError) return { error: insertError.message };

  // Mark down payment as paid on the plan
  const { error: planError } = await supabase
    .from("bnpl_plans")
    .update({ down_payment_paid_at: new Date().toISOString() })
    .eq("id", plan.id);

  if (planError) return { error: planError.message };

  // Update order amount_paid and payment_status
  const { data: order } = await supabase
    .from("orders")
    .select("total, amount_paid")
    .eq("id", orderId)
    .single();

  if (order) {
    const newAmountPaid = (order.amount_paid ?? 0) + plan.down_payment;
    const isPaid = newAmountPaid >= order.total;
    const paymentStatus: "pending" | "partial" | "paid" =
      newAmountPaid <= 0 ? "pending" : isPaid ? "paid" : "partial";

    await supabase
      .from("orders")
      .update({
        amount_paid: newAmountPaid,
        payment_status: paymentStatus,
        ...(isPaid ? { paid_at: new Date().toISOString() } : {}),
      })
      .eq("id", orderId);
  }

  revalidatePath("/sales-rep/dashboard");
  return { error: null };
}

/**
 * Get the BNPL plan and installments for an order.
 */
export async function getOrderBnplPlan(orderId: string) {
  const supabase = await createClient();

  const { data: plan } = await supabase
    .from("bnpl_plans")
    .select("*, bnpl_installments(*)")
    .eq("order_id", orderId)
    .maybeSingle();

  return plan;
}

/**
 * Mark a BNPL installment as paid by linking it to a payment record.
 */
export async function repPayBnplInstallment(
  repId: string,
  installmentId: string,
  payment: {
    method: "mpesa" | "cash" | "card";
    reference?: string;
    notes?: string;
  }
) {
  if (!(await verifyRepOwnership(repId))) {
    return { error: "Unauthorized" };
  }

  const supabase = await createClient();

  const { data: installment } = await supabase
    .from("bnpl_installments")
    .select("*, bnpl_plans(order_id, total_with_markup)")
    .eq("id", installmentId)
    .single();

  if (!installment) return { error: "Installment not found" };
  if (installment.status === "paid") return { error: "Installment already paid" };

  const plan = installment.bnpl_plans as { order_id: string; total_with_markup: number };
  const { data: { user } } = await supabase.auth.getUser();

  // Create payment record
  const { data: paymentRecord, error: payError } = await supabase
    .from("payment_records")
    .insert({
      order_id: plan.order_id,
      amount: installment.amount,
      method: payment.method,
      reference: payment.reference || null,
      notes: payment.notes || `Installment ${installment.installment_number}`,
      recorded_by: user?.id ?? null,
    })
    .select("id")
    .single();

  if (payError) return { error: payError.message };

  // Mark installment as paid
  await supabase
    .from("bnpl_installments")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      payment_record_id: paymentRecord.id,
    })
    .eq("id", installmentId);

  // Update order amount_paid and payment_status
  const { data: order } = await supabase
    .from("orders")
    .select("total, amount_paid")
    .eq("id", plan.order_id)
    .single();

  if (order) {
    const newAmountPaid = (order.amount_paid ?? 0) + installment.amount;
    const isPaid = newAmountPaid >= order.total;
    await supabase
      .from("orders")
      .update({
        amount_paid: newAmountPaid,
        payment_status: isPaid ? "paid" : "partial",
        ...(isPaid ? { paid_at: new Date().toISOString() } : {}),
      })
      .eq("id", plan.order_id);
  }

  revalidatePath("/sales-rep/dashboard");
  return { error: null };
}

// ── Retailer Management Actions ─────────────────────────────────

/**
 * Get retailers assigned to this sales rep.
 */
export async function getRepRetailers(repId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("retailers")
    .select("*")
    .eq("sales_rep_id", repId)
    .order("created_at", { ascending: false });

  return data ?? [];
}

/**
 * Get retailers with their last order date and total spent.
 */
export async function getRepRetailersWithStats(repId: string) {
  const supabase = await createClient();

  const { data: retailers } = await supabase
    .from("retailers")
    .select("*")
    .eq("sales_rep_id", repId)
    .order("name", { ascending: true });

  if (!retailers || retailers.length === 0) return [];

  const retailerIds = retailers.map((r) => r.id);

  // Get order stats per retailer
  const { data: orders } = await supabase
    .from("orders")
    .select("retailer_id, total, created_at, status")
    .in("retailer_id", retailerIds)
    .neq("status", "cancelled")
    .order("created_at", { ascending: false });

  const statsMap = new Map<string, { lastOrder: string | null; totalSpent: number; orderCount: number }>();

  for (const order of orders ?? []) {
    if (!order.retailer_id) continue;
    const existing = statsMap.get(order.retailer_id);
    if (!existing) {
      statsMap.set(order.retailer_id, {
        lastOrder: order.created_at,
        totalSpent: order.total,
        orderCount: 1,
      });
    } else {
      existing.totalSpent += order.total;
      existing.orderCount += 1;
    }
  }

  return retailers.map((r) => ({
    ...r,
    lastOrder: statsMap.get(r.id)?.lastOrder ?? null,
    totalSpent: statsMap.get(r.id)?.totalSpent ?? 0,
    orderCount: statsMap.get(r.id)?.orderCount ?? 0,
  }));
}

/**
 * Onboard (register) a new retailer assigned to the calling rep.
 */
export async function repOnboardRetailer(repId: string, formData: FormData) {
  if (!(await verifyRepOwnership(repId))) {
    return { error: "Unauthorized", data: null };
  }

  const supabase = await createClient();
  const name = formData.get("name") as string;
  const business_name = formData.get("business_name") as string | null;
  const phone = formData.get("phone") as string;
  const email = formData.get("email") as string | null;
  const location = formData.get("location") as string | null;

  if (!name?.trim()) return { error: "Name is required", data: null };
  if (!phone?.trim()) return { error: "Phone is required", data: null };

  const { data, error } = await supabase
    .from("retailers")
    .insert({
      name: name.trim(),
      business_name: business_name?.trim() || null,
      phone: phone.trim(),
      email: email?.trim() || null,
      location: location?.trim() || null,
      sales_rep_id: repId,
      verification_status: "unverified" as const,
    })
    .select()
    .single();

  if (error) return { error: error.message, data: null };

  // Log the activity
  await supabase.from("rep_activities").insert({
    sales_rep_id: repId,
    retailer_id: data.id,
    type: "onboarding",
    notes: `Onboarded retailer: ${data.name}`,
  });

  // Send onboarding email if retailer provided an email
  if (data.email) {
    const rep = await getCurrentSalesRep();
    await sendRetailerOnboardingEmail({
      to: data.email,
      name: data.name,
      businessName: data.business_name,
      phone: data.phone,
      location: data.location,
      repName: rep?.name ?? "Your sales representative",
      retailerId: data.id,
    });
  }

  revalidatePath("/sales-rep/dashboard");
  return { error: null, data };
}

/**
 * Update a retailer assigned to this rep.
 */
export async function repUpdateRetailer(
  repId: string,
  retailerId: string,
  formData: FormData
) {
  if (!(await verifyRepOwnership(repId))) {
    return { error: "Unauthorized" };
  }

  const supabase = await createClient();

  // Confirm retailer belongs to the rep
  const { data: existing } = await supabase
    .from("retailers")
    .select("id")
    .eq("id", retailerId)
    .eq("sales_rep_id", repId)
    .single();

  if (!existing) return { error: "Retailer not found or not assigned to you" };

  const name = formData.get("name") as string;
  const business_name = formData.get("business_name") as string | null;
  const phone = formData.get("phone") as string | null;
  const email = formData.get("email") as string | null;
  const location = formData.get("location") as string | null;

  if (!name?.trim()) return { error: "Name is required" };

  const { error } = await supabase
    .from("retailers")
    .update({
      name: name.trim(),
      business_name: business_name?.trim() || null,
      phone: phone?.trim() || undefined,
      email: email?.trim() || null,
      location: location?.trim() || null,
    })
    .eq("id", retailerId);

  if (error) return { error: error.message };
  revalidatePath("/sales-rep/dashboard");
  return { error: null };
}

// ── Lead Management Actions ──────────────────────────────────────

/**
 * Get all leads for a sales rep.
 */
export async function getRepLeads(repId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("leads")
    .select("*")
    .eq("sales_rep_id", repId)
    .order("created_at", { ascending: false });

  return data ?? [];
}

/**
 * Create a new lead for a sales rep.
 */
export async function repCreateLead(repId: string, formData: FormData) {
  if (!(await verifyRepOwnership(repId))) {
    return { error: "Unauthorized", data: null };
  }

  const supabase = await createClient();
  const name = formData.get("name") as string;
  const business_name = formData.get("business_name") as string | null;
  const phone = formData.get("phone") as string;
  const location = formData.get("location") as string | null;
  const notes = formData.get("notes") as string | null;
  const source = (formData.get("source") as string) || "field_visit";
  const follow_up_date = formData.get("follow_up_date") as string | null;

  if (!name?.trim()) return { error: "Name is required", data: null };
  if (!phone?.trim()) return { error: "Phone is required", data: null };

  const { data, error } = await supabase
    .from("leads")
    .insert({
      sales_rep_id: repId,
      name: name.trim(),
      business_name: business_name?.trim() || null,
      phone: phone.trim(),
      location: location?.trim() || null,
      notes: notes?.trim() || null,
      source: source as "field_visit" | "referral" | "whatsapp" | "walk_in" | "other",
      follow_up_date: follow_up_date || null,
    })
    .select()
    .single();

  if (error) return { error: error.message, data: null };
  revalidatePath("/sales-rep/dashboard");
  return { error: null, data };
}

/**
 * Update a lead's status or details.
 */
export async function repUpdateLead(
  repId: string,
  leadId: string,
  formData: FormData
) {
  if (!(await verifyRepOwnership(repId))) {
    return { error: "Unauthorized" };
  }

  const supabase = await createClient();

  // Confirm lead belongs to rep
  const { data: existing } = await supabase
    .from("leads")
    .select("id")
    .eq("id", leadId)
    .eq("sales_rep_id", repId)
    .single();

  if (!existing) return { error: "Lead not found" };

  const name = formData.get("name") as string | null;
  const business_name = formData.get("business_name") as string | null;
  const phone = formData.get("phone") as string | null;
  const location = formData.get("location") as string | null;
  const notes = formData.get("notes") as string | null;
  const status = formData.get("status") as string | null;
  const follow_up_date = formData.get("follow_up_date") as string | null;

  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (name?.trim()) updateData.name = name.trim();
  if (business_name !== null) updateData.business_name = business_name?.trim() || null;
  if (phone?.trim()) updateData.phone = phone.trim();
  if (location !== null) updateData.location = location?.trim() || null;
  if (notes !== null) updateData.notes = notes?.trim() || null;
  if (status) updateData.status = status;
  if (follow_up_date !== null) updateData.follow_up_date = follow_up_date || null;

  const { error } = await supabase
    .from("leads")
    .update(updateData)
    .eq("id", leadId);

  if (error) return { error: error.message };
  revalidatePath("/sales-rep/dashboard");
  return { error: null };
}

/**
 * Convert a lead to a retailer. Creates the retailer, updates the lead status,
 * and links the converted_retailer_id.
 */
export async function repConvertLead(repId: string, leadId: string) {
  if (!(await verifyRepOwnership(repId))) {
    return { error: "Unauthorized" };
  }

  const supabase = await createClient();

  const { data: lead } = await supabase
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .eq("sales_rep_id", repId)
    .single();

  if (!lead) return { error: "Lead not found" };
  if (lead.status === "converted") return { error: "Lead already converted" };

  // Create the retailer
  const { data: retailer, error: retailerError } = await supabase
    .from("retailers")
    .insert({
      name: lead.name,
      business_name: lead.business_name,
      phone: lead.phone,
      location: lead.location,
      sales_rep_id: repId,
      verification_status: "unverified" as const,
    })
    .select()
    .single();

  if (retailerError) return { error: retailerError.message };

  // Update lead status
  await supabase
    .from("leads")
    .update({
      status: "converted",
      converted_retailer_id: retailer.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", leadId);

  // Log activity
  await supabase.from("rep_activities").insert({
    sales_rep_id: repId,
    retailer_id: retailer.id,
    lead_id: leadId,
    type: "onboarding",
    notes: `Converted lead "${lead.name}" to retailer`,
  });

  revalidatePath("/sales-rep/dashboard");
  return { error: null, retailer };
}

// ── Restock Alerts Actions ───────────────────────────────────────

/**
 * Get retailers who are likely running low on products based on order frequency.
 * Uses the database function get_restock_alerts.
 */
export async function getRestockAlerts(repId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .rpc("get_restock_alerts", { p_sales_rep_id: repId });

  if (error) {
    console.error("Restock alerts error:", error);
    return [];
  }

  return data ?? [];
}

// ── Activity Logging Actions ─────────────────────────────────────

/**
 * Get recent activities for a sales rep.
 */
export async function getRepActivities(repId: string, limit = 20) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("rep_activities")
    .select("*, retailers(id, name), leads(id, name)")
    .eq("sales_rep_id", repId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return data ?? [];
}

/**
 * Log a new activity for a sales rep.
 */
export async function repLogActivity(
  repId: string,
  activity: {
    type: "visit" | "call" | "whatsapp" | "order_follow_up" | "payment_collection" | "onboarding" | "note";
    retailer_id?: string | null;
    lead_id?: string | null;
    notes?: string | null;
    outcome?: string | null;
  }
) {
  if (!(await verifyRepOwnership(repId))) {
    return { error: "Unauthorized" };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("rep_activities").insert({
    sales_rep_id: repId,
    type: activity.type,
    retailer_id: activity.retailer_id || null,
    lead_id: activity.lead_id || null,
    notes: activity.notes || null,
    outcome: activity.outcome || null,
  });

  if (error) return { error: error.message };
  revalidatePath("/sales-rep/dashboard");
  return { error: null };
}

// ── WhatsApp Product Catalog Sharing ─────────────────────────────

/**
 * Generate a formatted product catalog message for WhatsApp sharing.
 */
export async function generateProductCatalogMessage(repId: string) {
  const products = await getRepProducts(repId);

  if (products.length === 0) return "";

  // Group by category
  const byCategory = new Map<string, typeof products>();
  for (const p of products) {
    const cat = p.category || "Other";
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(p);
  }

  let message = "📦 *Product Catalog*\n\n";

  for (const [category, items] of byCategory) {
    message += `*${category}*\n`;
    for (const item of items) {
      const stockBadge = item.stock <= 5 ? "⚠️" : "✅";
      message += `${stockBadge} ${item.name} — KSh ${item.price.toLocaleString()}/${item.unit}`;
      if (item.stock <= 0) message += " (Out of stock)";
      message += "\n";
    }
    message += "\n";
  }

  message += "📞 Contact me to order!";
  return message;
}
