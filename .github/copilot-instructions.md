# Copilot Instructions — StockLink

## Project Overview

StockLink is a **Wholesale Brokerage Platform** connecting wholesalers and retailers. The platform manages inventory on behalf of wholesalers. Retailers browse, order, and track via WhatsApp. The focus is on simplicity, speed, and low-tech user accessibility.

---

## Tech Stack

- **Framework:** Next.js 15 (App Router, React Server Components)
- **Language:** TypeScript (strict mode)
- **Backend / Database:** Supabase (PostgreSQL, Auth, Realtime, Storage)
- **Styling:** Tailwind CSS 4
- **UI Components:** shadcn/ui + Radix Primitives
- **Icons:** Lucide React
- **Font:** Inter (Google Fonts)
- **Deployment:** Vercel
- **WhatsApp:** WhatsApp Business Cloud API
- **Payments:** M-Pesa / Stripe

---

## Architecture Rules

### Next.js App Router

- Use the **App Router** (`src/app/`) exclusively — no Pages Router.
- Default to **React Server Components (RSC)**. Only add `"use client"` when the component needs browser APIs, state, effects, or event handlers.
- Use **route groups** for logical grouping:
  - `(retailer)/` — retailer-facing pages
  - `admin/` — admin dashboard pages
  - `wholesaler/` — wholesaler read-only view
- Colocate page-specific components near their route when they are not shared.
- Use `loading.tsx` and `error.tsx` for each route segment.
- Use `Suspense` boundaries with skeleton fallbacks for streaming.

### Data Fetching

- Fetch data in **server components** using Supabase server client (`lib/supabase/server.ts`).
- Use **server actions** (`"use server"`) for mutations (create order, update stock, etc.).
- Use Supabase Realtime subscriptions in client components for live updates (stock changes, order status).
- Never expose the `SUPABASE_SERVICE_ROLE_KEY` to the client.

### File & Folder Conventions

```
src/
├── app/              # Routes (App Router)
├── components/
│   ├── ui/           # shadcn/ui primitives (Button, Card, Input, etc.)
│   ├── shared/       # Cross-cutting components (Navbar, BottomNav, SearchBar)
│   ├── retailer/     # Retailer UI components
│   └── admin/        # Admin UI components
├── lib/
│   ├── supabase/     # Supabase client setup (client.ts, server.ts, middleware.ts)
│   ├── utils.ts      # Utility functions
│   └── constants.ts  # App-wide constants
├── hooks/            # Custom React hooks
├── types/            # TypeScript type definitions
└── styles/           # Design tokens
```

---

## TypeScript Standards

- **Strict mode** enabled — no `any` types.
- Define explicit return types for functions that are not trivially inferred.
- Use `interface` for object shapes; use `type` for unions, intersections, and mapped types.
- Supabase types are auto-generated in `types/database.ts` via `supabase gen types typescript`.
- Prefer `unknown` over `any` when the type is genuinely unknown; narrow with type guards.

### Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Files / folders | kebab-case | `product-card.tsx`, `use-products.ts` |
| Components | PascalCase | `ProductCard`, `FlashDealCard` |
| Functions / hooks | camelCase | `useProducts`, `formatPrice` |
| Types / interfaces | PascalCase | `Product`, `OrderStatus` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_QUANTITY`, `DEFAULT_PAGE_SIZE` |
| Database columns | snake_case | `wholesaler_id`, `created_at` |
| CSS variables | kebab-case with `--` prefix | `--primary`, `--accent` |

---

## Design System

### Color Palette

```
Primary:       #16A34A (Green 600)    — trust, commerce, primary CTA
Primary Dark:  #15803D (Green 700)    — hover / pressed states
Primary Light: #DCFCE7 (Green 100)    — backgrounds, success badges
Secondary:     #1F2937 (Gray 800)     — headings, body text
Accent:        #F97316 (Orange 500)   — deals, flash sales, urgency
Accent Light:  #FFF7ED (Orange 50)    — deal card backgrounds
Surface:       #FFFFFF                — card surfaces
Background:    #F9FAFB (Gray 50)      — page backgrounds
Muted:         #6B7280 (Gray 500)     — secondary / helper text
Border:        #E5E7EB (Gray 200)     — dividers, card borders
Destructive:   #EF4444 (Red 500)      — errors, out-of-stock
```

### Typography

- **Font:** Inter (fallback: `system-ui, -apple-system, sans-serif`)
- **Scale:** 12 / 14 / 16 / 18 / 20 / 24 / 30 / 36px
- **Weights:** 400 (Regular), 500 (Medium), 600 (Semibold), 700 (Bold)

### Spacing

- Base unit: **4px**
- Use Tailwind's spacing scale consistently (1 = 4px, 2 = 8px, 3 = 12px, 4 = 16px, etc.)

### Component Styling

- Border radius: `rounded-lg` (8px) for cards, `rounded-xl` (12px) for modals, `rounded-full` for pills/avatars.
- Shadows: `shadow-sm`, `shadow-md`, `shadow-lg` as defined in Tailwind.
- **Minimum touch target:** 44×44px for all interactive elements.
- Use `ring` utilities for focus states — never remove focus indicators.

---

## UI / UX Principles

### Mobile-First

- Design and implement for **mobile viewport first** (`375px`), then scale up.
- Use responsive breakpoints: `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px).
- Retailer screens use a **bottom navigation bar** on mobile.
- Admin dashboard uses a **collapsible sidebar** on desktop, bottom nav on mobile.

### Accessibility & Low Literacy

- Always pair **icons with text labels**.
- Use **large, descriptive buttons** — not small text links.
- Minimize free-text input — prefer selectors, toggles, pre-filled options.
- Use **color + icon** for status (never color alone).
- Support screen readers: use semantic HTML (`nav`, `main`, `section`, `article`), ARIA labels.
- Images must have `alt` text.

### Performance

- Use **skeleton loaders** (not spinners) for loading states.
- Implement **optimistic UI** for actions like adding to cart.
- Use `next/image` for all images with proper `width`, `height`, `sizes`, and `priority` on LCP images.
- Lazy load below-the-fold content.
- Keep client-side JS bundle minimal — prefer server components.

### WhatsApp-First UX

- The primary CTA on product pages is **"Order via WhatsApp"** (green button with WhatsApp icon).
- Order confirmations and tracking updates follow a **WhatsApp message bubble** visual style.
- Include "Share to WhatsApp" buttons on deal cards and product pages.
- Format WhatsApp messages with structured templates (product name, quantity, price, delivery info).

---

## Component Guidelines

### Shared Components

- **`SearchBar`** — sticky at top of retailer pages, large input with search icon, instant search as you type.
- **`BottomNav`** — 4 tabs: Home, Products, Orders, Deals. Active tab uses primary green.
- **`WhatsAppButton`** — reusable green button that opens WhatsApp with pre-filled message.
- **`ProductCard`** — image, name, price, stock badge, wholesaler location. Used in grids/lists.
- **`FlashDealCard`** — accent-colored card with countdown timer, original/deal price, "Share" button.
- **`OrderTimeline`** — vertical timeline with status icons (placed → confirmed → out for delivery → delivered).
- **`QuantitySelector`** — increment/decrement buttons with number display (no manual typing required).
- **`CategoryGrid`** — icon + label grid for product categories (Rice, Oil, Sugar, LPG, etc.).

### Admin Components

- **`Sidebar`** — collapsible navigation: Inventory, Orders, Insights, Settings.
- **`InventoryTable`** — sortable table with inline edit capability, stock warnings.
- **`OrderTable`** — filterable by status, bulk actions, delivery assignment.
- **`ProductModal`** — form for add/edit product with image upload to Supabase Storage.
- **`InsightsChart`** — Recharts or similar for trending products, demand visualization.

---

## Supabase Patterns

### Client Setup

```typescript
// lib/supabase/client.ts — browser client (use in client components)
import { createBrowserClient } from "@supabase/ssr";
export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

// lib/supabase/server.ts — server client (use in server components / actions)
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
export const createClient = async () => {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { /* cookie handlers */ } }
  );
};
```

### Row-Level Security

- Always enable RLS on all tables.
- Retailers: `SELECT` on `products`, `wholesalers`; `INSERT`/`SELECT` on own `orders` and `order_items`.
- Admins: all operations on all tables (authenticated with admin role).
- Wholesalers: `SELECT` on own products and related order items.

### Realtime

- Subscribe to `products` table changes for live stock updates on product pages.
- Subscribe to `orders` table changes for live order status on tracking page.

---

## Routing Map

### Retailer (Mobile-First)

| Path | Page | Description |
|------|------|-------------|
| `/` | Home | Search, categories, trending, flash deals, nearby stock |
| `/products` | Product Listing | Filterable grid of products |
| `/products/[id]` | Product Detail | Full product info + "Order via WhatsApp" CTA |
| `/orders/confirm` | Order Confirmation | Summary, address, payment selection |
| `/orders/[id]` | Order Tracking | Status timeline with WhatsApp-style updates |
| `/deals` | Deals Feed | Trending products, deals, share to WhatsApp |

### Admin (Desktop Dashboard)

| Path | Page | Description |
|------|------|-------------|
| `/admin/inventory` | Inventory | Product CRUD, stock management |
| `/admin/orders` | Orders | Order status management, delivery assignment |
| `/admin/insights` | Insights | Demand charts, shortage alerts |

### Wholesaler

| Path | Page | Description |
|------|------|-------------|
| `/wholesaler/[id]` | Inventory View | Read-only table of products & pending orders |

---

## Code Style

- Use **Prettier** for formatting (default config).
- Use **ESLint** with Next.js recommended rules.
- Prefer `const` over `let`; never use `var`.
- Prefer arrow functions for callbacks and component definitions.
- Use early returns to reduce nesting.
- Destructure props at the function signature level.
- Keep components under **150 lines** — extract sub-components when larger.
- One component per file.
- Co-locate tests next to their source files (`component.test.tsx`).

---

## Git Conventions

- Branch names: `feat/`, `fix/`, `chore/`, `docs/` prefixes (e.g., `feat/product-listing`).
- Commit messages: conventional commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`).
- Keep PRs focused and small — one feature/fix per PR.

---

## Key Business Logic Reminders

1. **Stock is managed by admins, not wholesalers.** Wholesalers have read-only access.
2. **Orders are placed via WhatsApp CTA** — the app generates a pre-filled WhatsApp message with order details.
3. **Payment methods:** M-Pesa (primary), Cash on delivery, Card. No online payment gateway is required initially.
4. **Flash deals** have an expiration time and a separate `flash_deal_price`.
5. **Trending products** are flagged with `is_trending = true` — can be set manually by admin or computed from order volume.
6. **Demand requests** capture what retailers want but isn't in stock — used for the "Demand Insights" dashboard.
7. **Delivery** is managed by the platform team — orders are assigned to delivery personnel from the admin dashboard.
