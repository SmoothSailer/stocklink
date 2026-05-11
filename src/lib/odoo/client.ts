import type {
  OdooConfig,
  JsonRpcResponse,
  OdooDomainFilter,
} from "./types";

// ── Configuration ──────────────────────────────────────────────

function getConfig(): OdooConfig {
  const url = process.env.ODOO_URL;
  const db = process.env.ODOO_DB;
  const username = process.env.ODOO_USERNAME;
  const apiKey = process.env.ODOO_API_KEY;

  if (!url || !db || !username || !apiKey) {
    throw new Error(
      "Missing Odoo configuration. Set ODOO_URL, ODOO_DB, ODOO_USERNAME, ODOO_API_KEY."
    );
  }

  return { url, db, username, apiKey };
}

// ── JSON-RPC Transport ─────────────────────────────────────────

async function jsonRpc<T = unknown>(
  url: string,
  params: Record<string, unknown>
): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "call",
      params,
      id: Date.now(),
    }),
  });

  if (!res.ok) {
    throw new Error(`Odoo HTTP error: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as JsonRpcResponse<T>;

  if (data.error) {
    const msg =
      data.error.data?.message ?? data.error.message ?? "Unknown Odoo error";
    throw new Error(`Odoo RPC error: ${msg}`);
  }

  return data.result as T;
}

// ── Authentication ─────────────────────────────────────────────

let cachedUid: number | null = null;

async function authenticate(): Promise<number> {
  if (cachedUid !== null) return cachedUid;

  const config = getConfig();
  const uid = await jsonRpc<number>(
    `${config.url}/jsonrpc`,
    {
      service: "common",
      method: "authenticate",
      args: [config.db, config.username, config.apiKey, {}],
    }
  );

  if (!uid) {
    throw new Error("Odoo authentication failed — check credentials.");
  }

  cachedUid = uid;
  return uid;
}

// ── ORM Methods ────────────────────────────────────────────────

interface CallKwArgs {
  model: string;
  method: string;
  args?: unknown[];
  kwargs?: Record<string, unknown>;
}

async function callKw<T = unknown>({
  model,
  method,
  args = [],
  kwargs = {},
}: CallKwArgs): Promise<T> {
  const config = getConfig();
  const uid = await authenticate();

  return jsonRpc<T>(`${config.url}/jsonrpc`, {
    service: "object",
    method: "execute_kw",
    args: [config.db, uid, config.apiKey, model, method, args, kwargs],
  });
}

// ── Public Client API ──────────────────────────────────────────

export const odoo = {
  /**
   * Authenticate and return the user ID. Used to verify connectivity.
   */
  authenticate,

  /**
   * Search for record IDs matching a domain filter.
   */
  async search(
    model: string,
    domain: OdooDomainFilter[],
    options?: { limit?: number; offset?: number; order?: string }
  ): Promise<number[]> {
    return callKw<number[]>({
      model,
      method: "search",
      args: [domain],
      kwargs: {
        limit: options?.limit ?? 0,
        offset: options?.offset ?? 0,
        order: options?.order ?? "",
      },
    });
  },

  /**
   * Search + read records in a single call (most common operation).
   */
  async searchRead<T = Record<string, unknown>>(
    model: string,
    domain: OdooDomainFilter[],
    fields: string[],
    options?: { limit?: number; offset?: number; order?: string }
  ): Promise<T[]> {
    return callKw<T[]>({
      model,
      method: "search_read",
      args: [domain],
      kwargs: {
        fields,
        limit: options?.limit ?? 0,
        offset: options?.offset ?? 0,
        order: options?.order ?? "",
      },
    });
  },

  /**
   * Read specific records by ID.
   */
  async read<T = Record<string, unknown>>(
    model: string,
    ids: number[],
    fields: string[]
  ): Promise<T[]> {
    return callKw<T[]>({
      model,
      method: "read",
      args: [ids],
      kwargs: { fields },
    });
  },

  /**
   * Create a new record. Returns the created record ID.
   */
  async create(
    model: string,
    values: Record<string, unknown>
  ): Promise<number> {
    return callKw<number>({
      model,
      method: "create",
      args: [values],
    });
  },

  /**
   * Update existing records by ID.
   */
  async write(
    model: string,
    ids: number[],
    values: Record<string, unknown>
  ): Promise<boolean> {
    return callKw<boolean>({
      model,
      method: "write",
      args: [ids, values],
    });
  },

  /**
   * Delete records by ID.
   */
  async unlink(model: string, ids: number[]): Promise<boolean> {
    return callKw<boolean>({
      model,
      method: "unlink",
      args: [ids],
    });
  },

  /**
   * Count records matching a domain.
   */
  async searchCount(
    model: string,
    domain: OdooDomainFilter[]
  ): Promise<number> {
    return callKw<number>({
      model,
      method: "search_count",
      args: [domain],
    });
  },

  /**
   * Call a model workflow/action method (e.g., action_confirm on sale.order).
   */
  async callKwAction(
    model: string,
    ids: number[],
    method: string
  ): Promise<unknown> {
    return callKw({
      model,
      method,
      args: [ids],
    });
  },

  /**
   * Get Odoo server version info (no auth required).
   */
  async version(): Promise<Record<string, unknown>> {
    const config = getConfig();
    return jsonRpc<Record<string, unknown>>(
      `${config.url}/jsonrpc`,
      { service: "common", method: "version", args: [] }
    );
  },
};
