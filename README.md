# StockLink — Wholesale Brokerage Platform

> Connecting wholesalers and retailers through a WhatsApp-first, platform-managed inventory system.

---

## Overview

StockLink is a wholesale brokerage platform where the **platform team manages inventory on behalf of wholesalers**, and **retailers browse, order, and track via WhatsApp**. The focus is on simplicity, speed, and accessibility for low-tech users.

### Core Principles

- **WhatsApp-first interaction** — retailers order and receive updates via WhatsApp
- **Managed inventory** — no wholesaler complexity; the platform handles stock
- **Viral product discovery** — trending deals, flash sales, shareable alerts
- **Frictionless checkout** — one-click ordering, minimal typing
- **Real-time stock visibility** — live inventory counts and availability

---

## User Roles

| Role | Access | Description |
|------|--------|-------------|
| **Retailer** | Mobile app / Web | Browse products, place orders via WhatsApp, track deliveries |
| **Admin** | Web dashboard | Manage inventory, process orders, view demand insights |
| **Wholesaler** | Read-only web page | View their inventory status and pending orders |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | [Next.js 15](https://nextjs.org/) (App Router) |
| **Language** | TypeScript |
| **Backend / DB** | [Supabase](https://supabase.com/) (PostgreSQL, Auth, Realtime, Storage) |
| **Styling** | Tailwind CSS 4 |
| **UI Components** | shadcn/ui + Radix Primitives |
| **Icons** | Lucide React |
| **Typography** | Inter (Google Fonts) |
| **Deployment** | Vercel |
| **WhatsApp API** | WhatsApp Business Cloud API |
| **Payments** | M-Pesa / Stripe (configurable) |

---

## Design System

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--primary` | `#16A34A` (Green 600) | Trust, commerce, primary actions |
| `--primary-dark` | `#15803D` (Green 700) | Hover / active states |
| `--primary-light` | `#DCFCE7` (Green 100) | Backgrounds, badges |
| `--secondary` | `#1F2937` (Gray 800) | Text, headers |
| `--accent` | `#F97316` (Orange 500) | Deals, flash sales, urgency |
| `--accent-light` | `#FFF7ED` (Orange 50) | Deal card backgrounds |
| `--surface` | `#FFFFFF` | Card surfaces |
| `--background` | `#F9FAFB` (Gray 50) | Page backgrounds |
| `--muted` | `#6B7280` (Gray 500) | Secondary text |
| `--border` | `#E5E7EB` (Gray 200) | Borders, dividers |
| `--destructive` | `#EF4444` (Red 500) | Errors, out-of-stock |

### Typography

- **Font Family:** Inter (fallback: system-ui, sans-serif)
- **Scale:** 12 / 14 / 16 / 18 / 20 / 24 / 30 / 36px
- **Weights:** 400 (Regular), 500 (Medium), 600 (Semibold), 700 (Bold)

### Spacing

- Base unit: **4px**
- Scale: 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64px

### Component Tokens

- Border radius: `8px` (cards), `12px` (modals), `9999px` (pills/buttons)
- Shadow (sm): `0 1px 2px rgba(0,0,0,0.05)`
- Shadow (md): `0 4px 6px -1px rgba(0,0,0,0.1)`
- Shadow (lg): `0 10px 15px -3px rgba(0,0,0,0.1)`
- Touch target minimum: `44px × 44px`

---

## Application Screens

### Retailer (Mobile-First / Responsive Web)

| Screen | Route | Description |
|--------|-------|-------------|
| Home | `/` | Search, categories, trending, flash deals, nearby stock |
| Product Listing | `/products` | Filterable product grid (price, distance, availability) |
| Product Detail | `/products/[id]` | Image, pricing, stock, delivery estimate, WhatsApp order CTA |
| Order Confirmation | `/orders/confirm` | Summary, address, payment (M-Pesa / Cash / Card), confirm |
| Order Tracking | `/orders/[id]` | Timeline (placed → confirmed → out for delivery → delivered) |
| WhatsApp Feed | `/deals` | Trending products, deals, alerts with "Share to WhatsApp" |

### Admin Dashboard (Desktop Web)

| Screen | Route | Description |
|--------|-------|-------------|
| Inventory | `/admin/inventory` | Product table, add/edit modal, stock management |
| Orders | `/admin/orders` | Order list, status management, delivery assignment |
| Demand Insights | `/admin/insights` | Trending charts, retailer requests, shortage alerts |

### Wholesaler (Read-Only)

| Screen | Route | Description |
|--------|-------|-------------|
| Inventory View | `/wholesaler/[id]` | Read-only table: product, stock, pending orders |

---

## Project Structure

```
stocklink/
├── public/                    # Static assets
│   ├── icons/                 # App icons, favicons
│   └── images/                # Product placeholder images
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (retailer)/        # Retailer route group
│   │   │   ├── page.tsx       # Home
│   │   │   ├── products/
│   │   │   │   ├── page.tsx   # Product listing
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx # Product detail
│   │   │   ├── orders/
│   │   │   │   ├── confirm/
│   │   │   │   │   └── page.tsx # Order confirmation
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx # Order tracking
│   │   │   └── deals/
│   │   │       └── page.tsx   # WhatsApp feed / viral deals
│   │   ├── admin/             # Admin dashboard
│   │   │   ├── layout.tsx     # Admin layout (sidebar)
│   │   │   ├── inventory/
│   │   │   │   └── page.tsx   # Inventory management
│   │   │   ├── orders/
│   │   │   │   └── page.tsx   # Orders dashboard
│   │   │   └── insights/
│   │   │       └── page.tsx   # Demand insights
│   │   ├── wholesaler/
│   │   │   └── [id]/
│   │   │       └── page.tsx   # Wholesaler read-only view
│   │   ├── layout.tsx         # Root layout
│   │   └── globals.css        # Global styles & design tokens
│   ├── components/
│   │   ├── ui/                # shadcn/ui primitives
│   │   ├── shared/            # Shared components
│   │   │   ├── navbar.tsx
│   │   │   ├── bottom-nav.tsx
│   │   │   ├── search-bar.tsx
│   │   │   └── whatsapp-button.tsx
│   │   ├── retailer/          # Retailer-specific components
│   │   │   ├── product-card.tsx
│   │   │   ├── category-grid.tsx
│   │   │   ├── flash-deal-card.tsx
│   │   │   ├── order-timeline.tsx
│   │   │   └── quantity-selector.tsx
│   │   └── admin/             # Admin-specific components
│   │       ├── sidebar.tsx
│   │       ├── inventory-table.tsx
│   │       ├── order-table.tsx
│   │       ├── product-modal.tsx
│   │       └── insights-chart.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts      # Supabase browser client
│   │   │   ├── server.ts      # Supabase server client
│   │   │   └── middleware.ts   # Auth middleware
│   │   ├── utils.ts           # Utility functions (cn, formatPrice)
│   │   └── constants.ts       # App constants
│   ├── hooks/                 # Custom React hooks
│   │   ├── use-products.ts
│   │   ├── use-orders.ts
│   │   └── use-realtime.ts
│   ├── types/                 # TypeScript types
│   │   ├── database.ts        # Supabase generated types
│   │   ├── product.ts
│   │   └── order.ts
│   └── styles/
│       └── design-tokens.ts   # Exported design tokens
├── supabase/
│   ├── migrations/            # Database migrations
│   ├── seed.sql               # Seed data
│   └── config.toml            # Supabase config
├── .env.local.example         # Environment variables template
├── .github/
│   └── copilot-instructions.md
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## Database Schema (Supabase / PostgreSQL)

### Tables

```sql
-- Wholesalers
create table wholesalers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text,
  phone text,
  created_at timestamptz default now()
);

-- Products
create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category text not null,
  price numeric(10,2) not null,
  unit text not null default 'piece',       -- piece, carton, kg, litre
  stock integer not null default 0,
  image_url text,
  wholesaler_id uuid references wholesalers(id),
  is_trending boolean default false,
  is_flash_deal boolean default false,
  flash_deal_price numeric(10,2),
  flash_deal_expires_at timestamptz,
  location text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Retailers
create table retailers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text unique not null,
  location text,
  created_at timestamptz default now()
);

-- Orders
create table orders (
  id uuid primary key default gen_random_uuid(),
  retailer_id uuid references retailers(id),
  status text not null default 'placed'
    check (status in ('placed','confirmed','out_for_delivery','delivered','cancelled')),
  total numeric(10,2) not null,
  delivery_address text not null,
  payment_method text not null default 'cash'
    check (payment_method in ('mpesa','cash','card')),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Order Items
create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  product_id uuid references products(id),
  quantity integer not null,
  unit_price numeric(10,2) not null,
  total_price numeric(10,2) not null
);

-- Demand Requests (retailer requests for unavailable products)
create table demand_requests (
  id uuid primary key default gen_random_uuid(),
  retailer_id uuid references retailers(id),
  product_name text not null,
  category text,
  quantity integer,
  created_at timestamptz default now()
);
```

### Row-Level Security (RLS)

- **Retailers**: can read products, create/read own orders
- **Admins**: full CRUD on all tables
- **Wholesalers**: read-only on own products and related orders

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm (recommended) or npm
- Supabase account (or local Supabase CLI)

### Setup

```bash
# Clone the repository
git clone https://github.com/your-org/stocklink.git
cd stocklink

# Install dependencies
pnpm install

# Set up environment variables
cp .env.local.example .env.local
# Fill in your Supabase URL, anon key, and WhatsApp API credentials

# Run database migrations
pnpm supabase db push

# Seed sample data
pnpm supabase db seed

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

---

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
WHATSAPP_API_TOKEN=your-whatsapp-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## UX Guidelines

- **Minimize typing** — use buttons, selectors, pre-filled fields
- **One-click ordering** — reduce steps to absolute minimum
- **Offline-friendly feel** — optimistic UI, skeleton loaders
- **Fast load perception** — streaming SSR, suspense boundaries
- **Trust indicators** — stock levels, verified badges, delivery estimates
- **Large touch targets** — minimum 44×44px for all interactive elements
- **Low literacy support** — icons alongside text, visual categories

---

## Contributing

1. Create a feature branch from `main`
2. Follow the project structure and design system
3. Write TypeScript — no `any` types
4. Use server components by default; client components only when needed
5. Test on mobile viewport first
6. Submit a PR with description of changes

---

## License

MIT