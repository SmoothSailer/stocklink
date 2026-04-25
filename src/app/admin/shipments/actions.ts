"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

// ── Shipment CRUD ───────────────────────────────────────────────

export async function getShipments() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("sambaza_shipments")
    .select("*, manufacturers(id, name, country_code)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

export async function getShipment(id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("sambaza_shipments")
    .select("*, manufacturers(id, name, country_code, default_currency, default_incoterms, default_port_of_origin)")
    .eq("id", id)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function createShipment(formData: FormData) {
  const supabase = createAdminClient();

  const manufacturer_id = formData.get("manufacturer_id") as string | null;
  const origin_country = formData.get("origin_country") as string;
  const origin_port = formData.get("origin_port") as string | null;
  const destination_port = formData.get("destination_port") as string | null;
  const destination_warehouse = formData.get("destination_warehouse") as string | null;
  const shipping_method = formData.get("shipping_method") as string;
  const container_type = formData.get("container_type") as string | null;
  const currency = formData.get("currency") as string | null;
  const estimated_departure = formData.get("estimated_departure") as string | null;
  const estimated_arrival = formData.get("estimated_arrival") as string | null;
  const notes = formData.get("notes") as string | null;

  if (!origin_country?.trim() || !shipping_method?.trim()) {
    return { error: "Origin country and shipping method are required" };
  }

  // Generate shipment number: SMB-YYYY-NNNN
  const year = new Date().getFullYear();
  const { count } = await supabase
    .from("sambaza_shipments")
    .select("*", { count: "exact", head: true });
  const seq = String((count ?? 0) + 1).padStart(4, "0");
  const shipment_number = `SMB-${year}-${seq}`;

  const { data, error } = await supabase
    .from("sambaza_shipments")
    .insert({
      shipment_number,
      manufacturer_id: manufacturer_id || null,
      origin_country: origin_country.trim(),
      origin_port: origin_port?.trim() || null,
      destination_port: destination_port?.trim() || "Mombasa",
      destination_warehouse: destination_warehouse?.trim() || null,
      shipping_method: shipping_method as "sea" | "air" | "road",
      container_type: container_type?.trim() || null,
      currency: currency?.trim() || "USD",
      estimated_departure: estimated_departure || null,
      estimated_arrival: estimated_arrival || null,
      notes: notes?.trim() || null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  // Log initial status
  await supabase.from("sambaza_shipment_status_history").insert({
    shipment_id: data.id,
    status: "draft",
    notes: "Shipment created",
  });

  revalidatePath("/admin/shipments");
  return { error: null, id: data.id };
}

export async function updateShipment(
  id: string,
  data: Record<string, unknown>
) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("sambaza_shipments")
    .update(data)
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/admin/shipments");
  revalidatePath(`/admin/shipments/${id}`);
  return { error: null };
}

export async function updateShipmentStatus(
  id: string,
  status: string,
  notes?: string,
  location?: string
) {
  const supabase = createAdminClient();

  const { error: updateError } = await supabase
    .from("sambaza_shipments")
    .update({ status })
    .eq("id", id);

  if (updateError) return { error: updateError.message };

  // Log status change
  await supabase.from("sambaza_shipment_status_history").insert({
    shipment_id: id,
    status,
    notes: notes || null,
    location: location || null,
  });

  // If delivered, update product stock from shipment items
  if (status === "delivered") {
    await receiveShipmentStock(id);
  }

  revalidatePath("/admin/shipments");
  revalidatePath(`/admin/shipments/${id}`);
  return { error: null };
}

export async function deleteShipment(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("sambaza_shipments")
    .delete()
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/shipments");
  return { error: null };
}

// ── Shipment Items ──────────────────────────────────────────────

export async function getShipmentItems(shipmentId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("sambaza_shipment_items")
    .select("*, products(id, name, unit, stock)")
    .eq("shipment_id", shipmentId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data;
}

export async function addShipmentItem(
  shipmentId: string,
  item: {
    product_id?: string | null;
    description: string;
    quantity: number;
    unit?: string;
    unit_cost_foreign?: number;
    hs_code?: string;
    country_of_origin?: string;
  }
) {
  const supabase = createAdminClient();

  const total_cost_foreign =
    item.unit_cost_foreign && item.quantity
      ? item.unit_cost_foreign * item.quantity
      : null;

  const { error } = await supabase.from("sambaza_shipment_items").insert({
    shipment_id: shipmentId,
    product_id: item.product_id || null,
    description: item.description,
    quantity: item.quantity,
    unit: item.unit || null,
    unit_cost_foreign: item.unit_cost_foreign ?? null,
    total_cost_foreign: total_cost_foreign ?? null,
    hs_code: item.hs_code || null,
    country_of_origin: item.country_of_origin || null,
  });

  if (error) return { error: error.message };

  // Recalculate total_cost_foreign on shipment
  await recalculateShipmentTotals(shipmentId);

  revalidatePath(`/admin/shipments/${shipmentId}`);
  return { error: null };
}

export async function updateShipmentItem(
  itemId: string,
  shipmentId: string,
  data: Record<string, unknown>
) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("sambaza_shipment_items")
    .update(data)
    .eq("id", itemId);

  if (error) return { error: error.message };

  await recalculateShipmentTotals(shipmentId);
  revalidatePath(`/admin/shipments/${shipmentId}`);
  return { error: null };
}

export async function deleteShipmentItem(itemId: string, shipmentId: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("sambaza_shipment_items")
    .delete()
    .eq("id", itemId);

  if (error) return { error: error.message };

  await recalculateShipmentTotals(shipmentId);
  revalidatePath(`/admin/shipments/${shipmentId}`);
  return { error: null };
}

// ── Shipment Status History ─────────────────────────────────────

export async function getShipmentStatusHistory(shipmentId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("sambaza_shipment_status_history")
    .select("*")
    .eq("shipment_id", shipmentId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data;
}

// ── Exchange Rates ──────────────────────────────────────────────

export async function getLatestExchangeRate(fromCurrency: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("exchange_rates")
    .select("*")
    .eq("from_currency", fromCurrency)
    .eq("to_currency", "KES")
    .order("effective_date", { ascending: false })
    .limit(1)
    .single();
  return data;
}

export async function saveExchangeRate(
  fromCurrency: string,
  rate: number,
  source?: string
) {
  const supabase = createAdminClient();
  const today = new Date().toISOString().split("T")[0];

  const { error } = await supabase.from("exchange_rates").upsert(
    {
      from_currency: fromCurrency,
      to_currency: "KES",
      rate,
      source: source || "manual",
      effective_date: today,
    },
    { onConflict: "from_currency,to_currency,effective_date" }
  );

  if (error) return { error: error.message };
  return { error: null };
}

// ── Helpers ─────────────────────────────────────────────────────

async function recalculateShipmentTotals(shipmentId: string) {
  const supabase = createAdminClient();

  const { data: items } = await supabase
    .from("sambaza_shipment_items")
    .select("total_cost_foreign")
    .eq("shipment_id", shipmentId);

  const totalItemsCost = (items ?? []).reduce(
    (sum, item) => sum + (item.total_cost_foreign ?? 0),
    0
  );

  await supabase
    .from("sambaza_shipments")
    .update({ total_cost_foreign: totalItemsCost })
    .eq("id", shipmentId);
}

async function receiveShipmentStock(shipmentId: string) {
  const supabase = createAdminClient();

  // Get shipment details for exchange rate
  const { data: shipment } = await supabase
    .from("sambaza_shipments")
    .select("exchange_rate, total_cost_foreign, total_cost_kes")
    .eq("id", shipmentId)
    .single();

  // Get all items with product links
  const { data: items } = await supabase
    .from("sambaza_shipment_items")
    .select("*")
    .eq("shipment_id", shipmentId);

  if (!items || items.length === 0) return;

  const exchangeRate = shipment?.exchange_rate ?? 1;

  for (const item of items) {
    // Calculate landed cost per unit
    const landedCostPerUnit = item.total_cost_foreign
      ? (item.total_cost_foreign * exchangeRate) / item.quantity
      : null;

    // Update item with landed cost
    await supabase
      .from("sambaza_shipment_items")
      .update({ landed_cost_per_unit_kes: landedCostPerUnit })
      .eq("id", item.id);

    // If linked to a product, increment stock
    if (item.product_id) {
      const { data: product } = await supabase
        .from("products")
        .select("stock")
        .eq("id", item.product_id)
        .single();

      if (product) {
        await supabase
          .from("products")
          .update({
            stock: product.stock + item.quantity,
            last_landed_cost_kes: landedCostPerUnit,
            supplier_cost_foreign: item.unit_cost_foreign,
          })
          .eq("id", item.product_id);
      }
    }
  }

  // Update shipment warehouse receipt date
  await supabase
    .from("sambaza_shipments")
    .update({ warehouse_receipt_date: new Date().toISOString().split("T")[0] })
    .eq("id", shipmentId);

  revalidatePath("/admin/products");
  revalidatePath("/");
}

// ── International Manufacturers ─────────────────────────────────

export async function getInternationalManufacturers() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("manufacturers")
    .select("id, name, country_code, default_currency, default_port_of_origin")
    .eq("is_international", true)
    .eq("is_active", true)
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return data;
}
