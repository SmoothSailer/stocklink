import { createAdminClient } from "@/lib/supabase/admin";
import { odoo } from "./client";
import {
  productToOdoo,
  odooToProductUpdate,
  wholesalerToOdoo,
  manufacturerToOdoo,
  retailerToOdoo,
  categoryToOdoo,
  orderToOdoo,
  orderStatusToOdooState,
} from "./mappers";
import type {
  OdooProductTemplate,
  OdooProductProduct,
  OdooPartner,
  OdooProductCategory,
  SyncResult,
  SyncEntityType,
  SyncDirection,
  SyncAction,
  SyncStatus,
} from "./types";

// ── Feature Flags ──────────────────────────────────────────────

export function isSyncEnabled(): boolean {
  return process.env.ODOO_SYNC_ENABLED === "true";
}

export function isStockSyncEnabled(): boolean {
  return isSyncEnabled() && process.env.ODOO_STOCK_SYNC === "true";
}

export function isOrderSyncEnabled(): boolean {
  return isSyncEnabled() && process.env.ODOO_ORDER_SYNC === "true";
}

// ── Sync Logging ───────────────────────────────────────────────

async function logSync(params: {
  entityType: SyncEntityType;
  entityId?: string;
  odooId?: number;
  direction: SyncDirection;
  action: SyncAction;
  status: SyncStatus;
  errorMessage?: string;
  payload?: unknown;
}): Promise<void> {
  const supabase = createAdminClient();
  await supabase.from("odoo_sync_log").insert({
    entity_type: params.entityType,
    entity_id: params.entityId ?? null,
    odoo_id: params.odooId ?? null,
    direction: params.direction,
    action: params.action,
    status: params.status,
    error_message: params.errorMessage ?? null,
    payload: params.payload as Record<string, unknown> ?? null,
  });
}

// ── Product Sync ───────────────────────────────────────────────

/**
 * Pull products from Odoo → Supabase.
 * Creates new products found via x_ristoka_id or updates existing linked products.
 */
export async function syncProductsFromOdoo(): Promise<SyncResult> {
  const result: SyncResult = { created: 0, updated: 0, skipped: 0, errors: [] };
  const supabase = createAdminClient();

  // Fetch all products from Odoo that have a ristoka cross-reference
  const odooProducts = await odoo.searchRead<OdooProductTemplate>(
    "product.template",
    [["x_ristoka_id", "!=", false]],
    [
      "id", "name", "description_sale", "list_price", "categ_id",
      "uom_id", "x_ristoka_id", "x_min_order_qty", "product_variant_ids",
    ]
  );

  for (const odooProduct of odooProducts) {
    const ristokaId = odooProduct.x_ristoka_id as string;
    if (!ristokaId) {
      result.skipped++;
      continue;
    }

    try {
      // Get stock quantity for the default variant
      let stockQty: number | undefined;
      if (isStockSyncEnabled() && odooProduct.product_variant_ids.length > 0) {
        const variants = await odoo.searchRead<OdooProductProduct>(
          "product.product",
          [["id", "in", odooProduct.product_variant_ids]],
          ["id", "qty_available"]
        );
        stockQty = variants.reduce((sum, v) => sum + v.qty_available, 0);
      }

      const update = odooToProductUpdate(odooProduct, stockQty);

      const { error } = await supabase
        .from("products")
        .update({ ...update, odoo_template_id: odooProduct.id })
        .eq("id", ristokaId);

      if (error) {
        result.errors.push({
          entityType: "product",
          entityId: ristokaId,
          odooId: odooProduct.id,
          message: error.message,
        });
        await logSync({
          entityType: "product",
          entityId: ristokaId,
          odooId: odooProduct.id,
          direction: "inbound",
          action: "update",
          status: "error",
          errorMessage: error.message,
        });
      } else {
        result.updated++;
        await logSync({
          entityType: "product",
          entityId: ristokaId,
          odooId: odooProduct.id,
          direction: "inbound",
          action: "update",
          status: "success",
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      result.errors.push({
        entityType: "product",
        entityId: ristokaId,
        odooId: odooProduct.id,
        message,
      });
      await logSync({
        entityType: "product",
        entityId: ristokaId,
        odooId: odooProduct.id,
        direction: "inbound",
        action: "update",
        status: "error",
        errorMessage: message,
      });
    }
  }

  return result;
}

/**
 * Push a single Ristoka product to Odoo (create or update).
 */
export async function pushProductToOdoo(productId: string): Promise<void> {
  const supabase = createAdminClient();

  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .single();

  if (error || !product) {
    throw new Error(`Product not found: ${productId}`);
  }

  // Resolve category mapping
  let categoryOdooId: number | undefined;
  if (product.category) {
    const { data: category } = await supabase
      .from("categories")
      .select("odoo_category_id")
      .eq("slug", product.category)
      .single();
    categoryOdooId = category?.odoo_category_id ?? undefined;
  }

  // Resolve wholesaler mapping
  let supplierOdooId: number | undefined;
  if (product.wholesaler_id) {
    const { data: wholesaler } = await supabase
      .from("wholesalers")
      .select("odoo_partner_id")
      .eq("id", product.wholesaler_id)
      .single();
    supplierOdooId = wholesaler?.odoo_partner_id ?? undefined;
  }

  // Resolve manufacturer mapping
  let manufacturerOdooId: number | undefined;
  if (product.manufacturer_id) {
    const { data: manufacturer } = await supabase
      .from("manufacturers")
      .select("odoo_partner_id")
      .eq("id", product.manufacturer_id)
      .single();
    manufacturerOdooId = manufacturer?.odoo_partner_id ?? undefined;
  }

  const odooValues = productToOdoo(product, {
    categoryId: categoryOdooId,
    supplierId: supplierOdooId,
    manufacturerId: manufacturerOdooId,
  });

  if (product.odoo_template_id) {
    // Update existing Odoo record
    await odoo.write("product.template", [product.odoo_template_id], odooValues);
    await logSync({
      entityType: "product",
      entityId: productId,
      odooId: product.odoo_template_id,
      direction: "outbound",
      action: "update",
      status: "success",
    });
  } else {
    // Create new Odoo record
    const odooId = await odoo.create("product.template", odooValues);
    await supabase
      .from("products")
      .update({ odoo_template_id: odooId })
      .eq("id", productId);
    await logSync({
      entityType: "product",
      entityId: productId,
      odooId: odooId,
      direction: "outbound",
      action: "create",
      status: "success",
    });
  }
}

// ── Stock Sync ─────────────────────────────────────────────────

/**
 * Pull stock levels from Odoo and update Ristoka products.
 * Odoo is the source of truth for stock.
 */
export async function syncStockLevels(): Promise<SyncResult> {
  const result: SyncResult = { created: 0, updated: 0, skipped: 0, errors: [] };

  if (!isStockSyncEnabled()) {
    return result;
  }

  const supabase = createAdminClient();

  // Get all products with an Odoo link
  const { data: products, error } = await supabase
    .from("products")
    .select("id, odoo_template_id, stock")
    .not("odoo_template_id", "is", null);

  if (error || !products) {
    result.errors.push({ entityType: "stock", message: error?.message ?? "No linked products" });
    return result;
  }

  for (const product of products) {
    try {
      // Get variants for this template
      const variants = await odoo.searchRead<OdooProductProduct>(
        "product.product",
        [["product_tmpl_id", "=", product.odoo_template_id]],
        ["id", "qty_available"]
      );

      const totalStock = variants.reduce((sum, v) => sum + v.qty_available, 0);

      // Only update if stock actually changed
      if (totalStock !== product.stock) {
        await supabase
          .from("products")
          .update({ stock: totalStock })
          .eq("id", product.id);

        result.updated++;
        await logSync({
          entityType: "stock",
          entityId: product.id,
          odooId: product.odoo_template_id!,
          direction: "inbound",
          action: "sync",
          status: "success",
          payload: { previous: product.stock, current: totalStock },
        });
      } else {
        result.skipped++;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      result.errors.push({
        entityType: "stock",
        entityId: product.id,
        odooId: product.odoo_template_id ?? undefined,
        message,
      });
    }
  }

  return result;
}

// ── Partner Sync ───────────────────────────────────────────────

/**
 * Push all unlinked wholesalers to Odoo as suppliers.
 */
export async function syncWholesalersToOdoo(): Promise<SyncResult> {
  const result: SyncResult = { created: 0, updated: 0, skipped: 0, errors: [] };
  const supabase = createAdminClient();

  const { data: wholesalers } = await supabase
    .from("wholesalers")
    .select("*")
    .is("odoo_partner_id", null);

  if (!wholesalers?.length) return result;

  for (const wholesaler of wholesalers) {
    try {
      // Check if partner already exists in Odoo by x_ristoka_id
      const existing = await odoo.searchRead<OdooPartner>(
        "res.partner",
        [["x_ristoka_id", "=", wholesaler.id]],
        ["id"]
      );

      let odooId: number;
      if (existing.length > 0) {
        odooId = existing[0].id;
        await odoo.write("res.partner", [odooId], wholesalerToOdoo(wholesaler));
        result.updated++;
      } else {
        odooId = await odoo.create("res.partner", wholesalerToOdoo(wholesaler));
        result.created++;
      }

      await supabase
        .from("wholesalers")
        .update({ odoo_partner_id: odooId })
        .eq("id", wholesaler.id);

      await logSync({
        entityType: "partner",
        entityId: wholesaler.id,
        odooId,
        direction: "outbound",
        action: existing.length > 0 ? "update" : "create",
        status: "success",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      result.errors.push({ entityType: "partner", entityId: wholesaler.id, message });
      await logSync({
        entityType: "partner",
        entityId: wholesaler.id,
        direction: "outbound",
        action: "create",
        status: "error",
        errorMessage: message,
      });
    }
  }

  return result;
}

/**
 * Push all unlinked manufacturers to Odoo as suppliers.
 */
export async function syncManufacturersToOdoo(): Promise<SyncResult> {
  const result: SyncResult = { created: 0, updated: 0, skipped: 0, errors: [] };
  const supabase = createAdminClient();

  const { data: manufacturers } = await supabase
    .from("manufacturers")
    .select("*")
    .is("odoo_partner_id", null);

  if (!manufacturers?.length) return result;

  for (const mfr of manufacturers) {
    try {
      const existing = await odoo.searchRead<OdooPartner>(
        "res.partner",
        [["x_ristoka_id", "=", mfr.id]],
        ["id"]
      );

      let odooId: number;
      if (existing.length > 0) {
        odooId = existing[0].id;
        await odoo.write("res.partner", [odooId], manufacturerToOdoo(mfr));
        result.updated++;
      } else {
        odooId = await odoo.create("res.partner", manufacturerToOdoo(mfr));
        result.created++;
      }

      await supabase
        .from("manufacturers")
        .update({ odoo_partner_id: odooId })
        .eq("id", mfr.id);

      await logSync({
        entityType: "partner",
        entityId: mfr.id,
        odooId,
        direction: "outbound",
        action: existing.length > 0 ? "update" : "create",
        status: "success",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      result.errors.push({ entityType: "partner", entityId: mfr.id, message });
    }
  }

  return result;
}

/**
 * Push all unlinked retailers to Odoo as customers.
 */
export async function syncRetailersToOdoo(): Promise<SyncResult> {
  const result: SyncResult = { created: 0, updated: 0, skipped: 0, errors: [] };
  const supabase = createAdminClient();

  const { data: retailers } = await supabase
    .from("retailers")
    .select("*")
    .is("odoo_partner_id", null);

  if (!retailers?.length) return result;

  for (const retailer of retailers) {
    try {
      const existing = await odoo.searchRead<OdooPartner>(
        "res.partner",
        [["x_ristoka_id", "=", retailer.id]],
        ["id"]
      );

      let odooId: number;
      if (existing.length > 0) {
        odooId = existing[0].id;
        await odoo.write("res.partner", [odooId], retailerToOdoo(retailer));
        result.updated++;
      } else {
        odooId = await odoo.create("res.partner", retailerToOdoo(retailer));
        result.created++;
      }

      await supabase
        .from("retailers")
        .update({ odoo_partner_id: odooId })
        .eq("id", retailer.id);

      await logSync({
        entityType: "partner",
        entityId: retailer.id,
        odooId,
        direction: "outbound",
        action: existing.length > 0 ? "update" : "create",
        status: "success",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      result.errors.push({ entityType: "partner", entityId: retailer.id, message });
    }
  }

  return result;
}

// ── Category Sync ──────────────────────────────────────────────

/**
 * Push all unlinked categories to Odoo.
 */
export async function syncCategoriesToOdoo(): Promise<SyncResult> {
  const result: SyncResult = { created: 0, updated: 0, skipped: 0, errors: [] };
  const supabase = createAdminClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .is("odoo_category_id", null);

  if (!categories?.length) return result;

  for (const category of categories) {
    try {
      const existing = await odoo.searchRead<OdooProductCategory>(
        "product.category",
        [["name", "=", category.name]],
        ["id"]
      );

      let odooId: number;
      if (existing.length > 0) {
        odooId = existing[0].id;
        result.updated++;
      } else {
        odooId = await odoo.create("product.category", categoryToOdoo(category));
        result.created++;
      }

      await supabase
        .from("categories")
        .update({ odoo_category_id: odooId })
        .eq("id", category.id);

      await logSync({
        entityType: "category",
        entityId: category.id,
        odooId,
        direction: "outbound",
        action: existing.length > 0 ? "update" : "create",
        status: "success",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      result.errors.push({ entityType: "category", entityId: category.id, message });
    }
  }

  return result;
}

// ── Order Sync ─────────────────────────────────────────────────

/**
 * Push a Ristoka order to Odoo as a sale.order.
 */
export async function pushOrderToOdoo(orderId: string): Promise<void> {
  if (!isOrderSyncEnabled()) return;

  const supabase = createAdminClient();

  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (!order) throw new Error(`Order not found: ${orderId}`);

  // Already synced?
  if (order.odoo_order_id) return;

  // Get retailer's Odoo partner ID
  if (!order.retailer_id) {
    throw new Error(`Order ${orderId} has no retailer`);
  }

  const { data: retailer } = await supabase
    .from("retailers")
    .select("odoo_partner_id")
    .eq("id", order.retailer_id)
    .single();

  if (!retailer?.odoo_partner_id) {
    throw new Error(
      `Retailer ${order.retailer_id} is not synced to Odoo. Sync partners first.`
    );
  }

  // Get order items
  const { data: items } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", orderId);

  if (!items?.length) {
    throw new Error(`Order ${orderId} has no items`);
  }

  // Build product ID map
  const productIds = items
    .map((i) => i.product_id)
    .filter((id): id is string => id !== null);

  const { data: products } = await supabase
    .from("products")
    .select("id, odoo_product_id")
    .in("id", productIds)
    .not("odoo_product_id", "is", null);

  const productIdMap = new Map<string, number>();
  for (const p of products ?? []) {
    if (p.odoo_product_id) {
      productIdMap.set(p.id, p.odoo_product_id);
    }
  }

  const odooValues = orderToOdoo(order, items, retailer.odoo_partner_id, productIdMap);

  const odooOrderId = await odoo.create("sale.order", odooValues);

  // If order is confirmed, confirm in Odoo too
  if (order.status !== "placed") {
    await odoo.callKwAction("sale.order", [odooOrderId], "action_confirm");
  }

  await supabase
    .from("orders")
    .update({ odoo_order_id: odooOrderId })
    .eq("id", orderId);

  await logSync({
    entityType: "order",
    entityId: orderId,
    odooId: odooOrderId,
    direction: "outbound",
    action: "create",
    status: "success",
  });
}

// ── Full Sync (Reconciliation) ─────────────────────────────────

export interface FullSyncResult {
  categories: SyncResult;
  wholesalers: SyncResult;
  manufacturers: SyncResult;
  retailers: SyncResult;
  products: SyncResult;
  stock: SyncResult;
}

/**
 * Run a full reconciliation sync across all entities.
 * Intended for admin-triggered or cron usage.
 */
export async function runFullSync(): Promise<FullSyncResult> {
  // Sync in dependency order: categories/partners first, then products, then stock
  const categories = await syncCategoriesToOdoo();
  const wholesalers = await syncWholesalersToOdoo();
  const manufacturers = await syncManufacturersToOdoo();
  const retailers = await syncRetailersToOdoo();
  const products = await syncProductsFromOdoo();
  const stock = await syncStockLevels();

  return { categories, wholesalers, manufacturers, retailers, products, stock };
}
