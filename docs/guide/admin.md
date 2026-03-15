# Admin Panel

The Stoa Admin Panel is a single-page application for managing your store. It is built with SvelteKit 5 and Tailwind CSS, compiled into a static bundle, and embedded directly in the Stoa binary — no separate deployment needed.

**Access**: `http://localhost:8080/admin`

## Sections

| Section | Description |
|---------|-------------|
| **Dashboard** | KPI cards (orders, customers, products, revenue) and recent orders |
| **Products** | Product catalog with variants, pricing, images, categories, and tags |
| **Categories** | Hierarchical category tree with drag-and-drop positioning |
| **Properties** | Property groups and options for generating product variants |
| **Customers** | Customer accounts with order history |
| **Orders** | Order management with status workflow and payment transactions |
| **Media** | Image and file uploads with drag-and-drop |
| **Discounts** | Promotional codes (percentage or fixed), validity windows, usage limits |
| **Tags** | Product tags for flexible categorization |
| **Taxes** | Tax rules by country with rates in basis points |
| **Shipping** | Shipping methods with pricing and tax rules |
| **Payments** | Payment method configuration (Stripe, PayPal, etc.) |
| **Audit Log** | Activity log tracking all admin actions |

## Dark / Light Mode

The admin panel supports dark and light themes. The toggle is in the top-right header bar.

- **Default**: Dark mode
- **Persistence**: `localStorage` key `stoa_admin_theme`
- **Fallback**: Respects `prefers-color-scheme` when no preference is stored

## Internationalization

The interface is available in German (de-DE) and English (en-US). The language can be switched via the globe icon in the header.

- **Persistence**: `localStorage` key `stoa_admin_locale`
- **Formatting**: Locale-aware price and date formatting via `$fmt.price()` and `$fmt.dateTime()`

## Responsive Layout

The admin panel adapts to all screen sizes.

- **Desktop**: Collapsible sidebar (full width or icon-only), persistent via `localStorage`
- **Mobile**: Sidebar hidden by default, accessible via hamburger menu with backdrop overlay
- **Tables**: Switch to card layout on small screens

## Search and Filtering

List pages provide search and filter functionality:

| Page | Search | Filters |
|------|--------|---------|
| Orders | Order number | Status |
| Customers | Name, email | — |
| Products | Name, SKU | — |
| Categories | Client-side filter | — |
| Property Groups | Client-side filter | — |

## Order Management

Orders follow a strict status workflow:

```
pending → confirmed → processing → shipped → delivered → refunded
    ↓           ↓            ↓
 cancelled  cancelled    cancelled
```

The order detail view shows:
- Order info, status badge, and totals
- Shipping and billing addresses
- Line items table
- **Payment transactions** with status, amount, provider reference, and timestamp
- **Guest Session ID** for guest orders — copyable with one click for payment provider reconciliation

See [Orders Guide](/guide/orders) for details.

## Plugin Extensions

Plugins can extend the admin panel UI at predefined slots:

| Slot | Location |
|------|----------|
| `admin:payment:settings` | Payment method configuration page |
| `admin:order:payment` | Order detail, below payment transactions |
| `admin:sidebar` | Bottom of the sidebar navigation |
| `admin:dashboard:widget` | Dashboard page |

Plugins provide UI extensions in two ways:
- **Schema-based forms** — declarative field definitions (text, toggle, select, etc.) rendered automatically
- **Web Components** — custom HTML elements loaded from plugin assets for complex UIs

See [UI Extensions](/plugins/ui-extensions) for implementation details.

## Authentication

Admin access requires a JWT token obtained via the login page. Tokens are stored in `localStorage`:

| Key | Purpose |
|-----|---------|
| `stoa_access_token` | Short-lived access token |
| `stoa_refresh_token` | Long-lived refresh token |

Unauthenticated users are redirected to `/admin/login`.

## Product Import

Products can be imported in bulk via the import dialog:

- **CSV Import** — Upload a CSV file with product rows. Variant rows follow the parent product row with an empty SKU column.
- **JSON Import** — Paste a JSON array of product objects following the `CreateProductRequest` schema.

Both formats support variants, translations, categories, and tags.

## Technical Details

| | |
|---|---|
| **Framework** | SvelteKit 5 (Svelte 5 runes) |
| **Styling** | Tailwind CSS with CSS custom properties |
| **Icons** | lucide-svelte |
| **Mode** | SPA (`ssr: false`, `adapter-static`) |
| **Build output** | Embedded in Go binary at `internal/admin/build/` |
| **Dev server** | `make admin-dev` → Vite on `:5173`, proxies API to `:8080` |
