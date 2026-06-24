// Odoo ERP model type definitions for JSON-RPC integration

// ── Connection Config ──────────────────────────────────────────

export interface OdooConfig {
  url: string;
  db: string;
  username: string;
  apiKey: string;
}

// ── JSON-RPC Types ─────────────────────────────────────────────

export interface JsonRpcRequest {
  jsonrpc: "2.0";
  method: "call";
  params: Record<string, unknown>;
  id: number;
}

export interface JsonRpcResponse<T = unknown> {
  jsonrpc: "2.0";
  id: number;
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: {
      name: string;
      message: string;
      debug: string;
    };
  };
}

// ── Odoo Domain Filter ─────────────────────────────────────────

/** Odoo domain filter tuple: [field, operator, value] */
export type OdooDomainFilter = [string, string, unknown];

// ── Odoo Model Records ─────────────────────────────────────────

export interface OdooPartner {
  id: number;
  name: string;
  email?: string | false;
  phone?: string | false;
  street?: string | false;
  city?: string | false;
  country_id?: [number, string] | false;
  supplier_rank?: number;
  customer_rank?: number;
  is_company?: boolean;
  x_ristoka_id?: string | false;
}

export interface OdooProductTemplate {
  id: number;
  name: string;
  description_sale?: string | false;
  list_price: number;
  categ_id: [number, string];
  uom_id: [number, string];
  image_1920?: string | false; // base64
  x_ristoka_id?: string | false;
  x_min_order_qty?: number;
  x_supplier_id?: [number, string] | false;
  x_manufacturer_id?: [number, string] | false;
  product_variant_ids: number[];
}

export interface OdooProductProduct {
  id: number;
  product_tmpl_id: [number, string];
  name: string;
  qty_available: number;
  virtual_available: number;
  uom_id: [number, string];
  lst_price: number;
  x_ristoka_id?: string | false;
}

export interface OdooStockQuant {
  id: number;
  product_id: [number, string];
  location_id: [number, string];
  quantity: number;
  reserved_quantity: number;
}

export interface OdooProductCategory {
  id: number;
  name: string;
  complete_name: string;
  parent_id: [number, string] | false;
}

export interface OdooUom {
  id: number;
  name: string;
  category_id: [number, string];
  factor: number;
  uom_type: "bigger" | "reference" | "smaller";
}

export interface OdooSaleOrder {
  id: number;
  name: string;
  state: "draft" | "sent" | "sale" | "done" | "cancel";
  partner_id: [number, string];
  date_order: string;
  amount_total: number;
  client_order_ref?: string | false;
  order_line: number[];
  x_payment_method?: string | false;
  x_delivery_address?: string | false;
}

export interface OdooSaleOrderLine {
  id: number;
  order_id: [number, string];
  product_id: [number, string];
  product_uom_qty: number;
  price_unit: number;
  price_subtotal: number;
}

// ── Webhook Payload ────────────────────────────────────────────

export interface OdooWebhookPayload {
  event: "stock.update" | "product.update" | "product.create" | "product.delete";
  model: string;
  records: OdooWebhookRecord[];
  timestamp: string;
}

export interface OdooWebhookRecord {
  id: number;
  x_ristoka_id?: string;
  fields: Record<string, unknown>;
}

// ── Sync Result Types ──────────────────────────────────────────

export interface SyncResult {
  created: number;
  updated: number;
  skipped: number;
  errors: SyncError[];
}

export interface SyncError {
  entityType: string;
  entityId?: string;
  odooId?: number;
  message: string;
}

export type SyncDirection = "inbound" | "outbound";
export type SyncEntityType = "product" | "order" | "stock" | "partner" | "payment" | "category";
export type SyncAction = "create" | "update" | "delete" | "sync";
export type SyncStatus = "success" | "error" | "skipped";
