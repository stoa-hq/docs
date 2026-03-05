# Products & Variants

## Product

A `Product` is the central entity. It holds pricing, stock, and metadata — locale-specific content lives in `ProductTranslation`.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique identifier |
| `sku` | string | Stock Keeping Unit |
| `active` | bool | Whether the product is visible in the store |
| `price_net` | int | Net price in cents |
| `price_gross` | int | Gross price in cents (including tax) |
| `currency` | string | ISO 4217 currency code (e.g. `EUR`) |
| `stock` | int | Available units |
| `weight` | int | Weight in grams |
| `tax_rule_id` | UUID | Reference to a tax rule |
| `custom_fields` | object | Free-form key-value data |

### Translations

Each product has one translation per locale:

| Field | Description |
|-------|-------------|
| `name` | Display name |
| `description` | Long description (HTML/Markdown) |
| `slug` | URL-friendly identifier (e.g. `blue-running-shoes`) |
| `meta_title` | SEO title |
| `meta_description` | SEO description |

### Media

Products can have multiple images. Each `ProductMedia` entry links to a media asset and has a `position` for ordering.

## Variants

When a product comes in multiple configurations (size, color, etc.), those are modelled as **variants**.

```
Product: "Running Shoe"
├── Variant: Size=38, Color=Red  (SKU: RS-38-RED, stock: 5)
├── Variant: Size=38, Color=Blue (SKU: RS-38-BLU, stock: 2)
└── Variant: Size=42, Color=Red  (SKU: RS-42-RED, stock: 8)
```

A `ProductVariant` can override the parent product's price and has its own stock.

| Field | Description |
|-------|-------------|
| `sku` | Variant-specific SKU |
| `price_net` / `price_gross` | Optional price override (falls back to product price) |
| `stock` | Variant-specific stock |
| `options` | List of `PropertyOption` values that define this variant |

## Property Groups & Options

Property groups define the *dimensions* of variation. Options are the individual values.

```
PropertyGroup: "Size"        PropertyGroup: "Color"
  Options: 38, 40, 42          Options: Red, Blue, Green
```

Combinations are generated automatically when you assign options to a product. Each combination becomes one variant.

### ColorHex

`PropertyOption` has an optional `color_hex` field for color swatches displayed in the storefront.

## Categories

Products belong to categories. Categories form a **tree structure** (each category can have a parent). A product can belong to multiple categories.

## Tags

Tags are flat labels (no hierarchy) that can be attached to products for filtering and grouping.

## Prices are integers

All prices (`price_net`, `price_gross`, `unit_price_net`, etc.) are stored as **integers in cents**. `4999` = €49.99.
