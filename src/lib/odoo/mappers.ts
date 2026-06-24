import type { Database } from "@/types/database";
import type { OdooProductTemplate, OdooPartner, OdooProductCategory } from "./types";

// ── Database row type aliases ──────────────────────────────────

type Product = Database["public"]["Tables"]["products"]["Row"];
type Wholesaler = Database["public"]["Tables"]["wholesalers"]["Row"];
type Manufacturer = Database["public"]["Tables"]["manufacturers"]["Row"];
type Retailer = Database["public"]["Tables"]["retailers"]["Row"];
type Category = Database["public"]["Tables"]["categories"]["Row"];
type Order = Database["public"]["Tables"]["orders"]["Row"];
type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];

// ── Product Mappers ────────────────────────────────────────────

/**
 * Map a Ristoka product to Odoo product.template field values.
 */
export function productToOdoo(
  product: Product,
  odooMappings: {
    categoryId?: number;
    uomId?: number;
    supplierId?: number;
    manufacturerId?: number;
  }
): Record<string, unknown> {
  const values: Record<string, unknown> = {
    name: product.name,
    list_price: product.price,
    x_ristoka_id: product.id,
    x_min_order_qty: product.min_order_qty,
  };

  if (product.description) {
    values.description_sale = product.description;
  }

  if (odooMappings.categoryId) {
    values.categ_id = odooMappings.categoryId;
  }
  if (odooMappings.uomId) {
    values.uom_id = odooMappings.uomId;
    values.uom_po_id = odooMappings.uomId;
  }
  if (odooMappings.supplierId) {
    values.x_supplier_id = odooMappings.supplierId;
  }
  if (odooMappings.manufacturerId) {
    values.x_manufacturer_id = odooMappings.manufacturerId;
  }

  return values;
}

/**
 * Map an Odoo product.template record to Ristoka product update fields.
 */
export function odooToProductUpdate(
  odooProduct: OdooProductTemplate,
  stockQty?: number
): Partial<Product> {
  const update: Partial<Product> = {
    name: odooProduct.name,
    price: odooProduct.list_price,
    odoo_template_id: odooProduct.id,
  };

  if (odooProduct.description_sale) {
    update.description = odooProduct.description_sale as string;
  }

  if (odooProduct.x_min_order_qty) {
    update.min_order_qty = odooProduct.x_min_order_qty;
  }

  if (stockQty !== undefined) {
    update.stock = stockQty;
  }

  return update;
}

// ── Partner Mappers ────────────────────────────────────────────

/**
 * Map a Ristoka wholesaler to Odoo res.partner field values.
 */
export function wholesalerToOdoo(wholesaler: Wholesaler): Record<string, unknown> {
  return {
    name: wholesaler.name,
    phone: wholesaler.phone ?? false,
    city: wholesaler.location ?? false,
    is_company: true,
    supplier_rank: 1,
    customer_rank: 0,
    x_ristoka_id: wholesaler.id,
  };
}

/**
 * Map a Ristoka manufacturer to Odoo res.partner field values.
 */
export function manufacturerToOdoo(manufacturer: Manufacturer): Record<string, unknown> {
  return {
    name: manufacturer.name,
    phone: manufacturer.contact_phone ?? false,
    email: manufacturer.contact_email ?? false,
    website: manufacturer.website ?? false,
    city: manufacturer.location ?? false,
    is_company: true,
    supplier_rank: 1,
    customer_rank: 0,
    x_ristoka_id: manufacturer.id,
  };
}

/**
 * Map a Ristoka retailer to Odoo res.partner field values (customer).
 */
export function retailerToOdoo(retailer: Retailer): Record<string, unknown> {
  return {
    name: retailer.business_name ?? retailer.name,
    phone: retailer.phone,
    email: retailer.email ?? false,
    city: retailer.location ?? false,
    is_company: !!retailer.business_name,
    supplier_rank: 0,
    customer_rank: 1,
    x_ristoka_id: retailer.id,
  };
}

/**
 * Map an Odoo res.partner to partial Ristoka wholesaler update.
 */
export function odooToWholesalerUpdate(partner: OdooPartner): Partial<Wholesaler> {
  return {
    name: partner.name,
    phone: partner.phone || null,
    location: partner.city || null,
    odoo_partner_id: partner.id,
  };
}

// ── Category Mappers ───────────────────────────────────────────

/**
 * Map a Ristoka category to Odoo product.category values.
 */
export function categoryToOdoo(category: Category): Record<string, unknown> {
  return {
    name: category.name,
    x_ristoka_id: category.id,
  };
}

/**
 * Map an Odoo product.category to partial Ristoka category update.
 */
export function odooToCategoryUpdate(odooCategory: OdooProductCategory): Partial<Category> {
  return {
    name: odooCategory.name,
    odoo_category_id: odooCategory.id,
  };
}

// ── Order Mappers ──────────────────────────────────────────────

/**
 * Map a Ristoka order + items to Odoo sale.order creation values.
 */
export function orderToOdoo(
  order: Order,
  items: OrderItem[],
  odooPartnerId: number,
  productIdMap: Map<string, number> // Ristoka product ID → Odoo product.product ID
): Record<string, unknown> {
  const orderLines = items
    .filter((item) => item.product_id && productIdMap.has(item.product_id))
    .map((item) => [
      0,
      0,
      {
        product_id: productIdMap.get(item.product_id!),
        product_uom_qty: item.quantity,
        price_unit: item.unit_price,
      },
    ]);

  return {
    partner_id: odooPartnerId,
    client_order_ref: order.id,
    x_payment_method: order.payment_method,
    x_delivery_address: order.delivery_address,
    order_line: orderLines,
  };
}

/**
 * Map Ristoka order status to Odoo sale.order state.
 */
export function orderStatusToOdooState(
  status: Order["status"]
): "draft" | "sale" | "cancel" {
  switch (status) {
    case "placed":
      return "draft";
    case "confirmed":
    case "out_for_delivery":
    case "delivered":
      return "sale";
    case "cancelled":
      return "cancel";
  }
}
