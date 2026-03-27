# Product Attributes

Attributes are a generic classification system for products and variants. They let you attach structured, typed metadata — Brand, Material, Weight, Waterproof Rating — to any product or variant.

::: tip Attributes vs Property Groups
**Property Groups** define the *axes of variation* for variants (Size × Color). Choosing between Size S and Size M selects a different variant.

**Attributes** are *descriptive metadata* that do not create variants. "Brand: Adidas" and "Weight: 320 g" describe a product but do not define a purchasable configuration.
:::

## Attribute Types

Every attribute has a `type` that controls which value field is used when assigning values to products or variants.

| Type | Value field | Example |
|------|------------|---------|
| `text` | `value_text` | `"Adidas"`, `"Full-grain leather"` |
| `number` | `value_numeric` | `320`, `4.5` |
| `select` | `option_id` | One predefined option (e.g. "Leather") |
| `multi_select` | `option_ids` | Multiple predefined options (e.g. ["Red", "Blue"]) |
| `boolean` | `value_boolean` | `true`, `false` |

### Units

`number` attributes accept an optional `unit` field (max 20 characters). Units are informational — the API does not perform conversions.

```
unit: "g"    → Weight in grams
unit: "mm"   → Dimensions in millimetres
unit: "kg"   → Mass in kilograms
```

## Identifier

Every attribute has a unique `identifier` slug. It follows the same pattern used by Property Groups:

```
^[a-z0-9][a-z0-9_-]*$
```

Examples: `brand`, `material`, `weight-g`, `is_waterproof`. Identifiers cannot be changed once other systems rely on them for filtering.

## Flags

| Flag | Default | Description |
|------|---------|-------------|
| `filterable` | `false` | Marks the attribute as available for storefront filter UIs |
| `required` | `false` | Indicates the attribute should always be set on products |

Stoa does not enforce `required` at the API level — it is a hint for the Admin UI and import tools.

## i18n

Both attribute definitions and options support per-locale translations.

**Attribute translations** carry `name` and `description`:

```json
{
  "translations": [
    { "locale": "en", "name": "Material", "description": "Primary material composition" },
    { "locale": "de", "name": "Material", "description": "Primäres Materialgefüge" }
  ]
}
```

**Option translations** carry `name` only:

```json
{
  "translations": [
    { "locale": "en", "name": "Leather" },
    { "locale": "de", "name": "Leder" }
  ]
}
```

## Store API

Attribute values are embedded directly in product and variant responses. You do not need a separate request.

```json
{
  "data": {
    "id": "uuid",
    "sku": "BOOT-BLK-42",
    "attributes": [
      {
        "attribute_id": "uuid-brand",
        "attribute_identifier": "brand",
        "type": "text",
        "value_text": "Timberland",
        "translations": [{ "locale": "en", "name": "Brand" }]
      },
      {
        "attribute_id": "uuid-weight",
        "attribute_identifier": "weight-g",
        "type": "number",
        "unit": "g",
        "value_numeric": 680,
        "translations": [{ "locale": "en", "name": "Weight" }]
      }
    ]
  }
}
```

Variants include their own `attributes` array alongside the parent product's `attributes`.

## Example: Creating and Assigning Attributes

### 1. Create a text attribute

```bash
curl -X POST http://localhost:8080/api/v1/admin/attributes \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "identifier": "brand",
    "type": "text",
    "filterable": true,
    "translations": [
      { "locale": "en", "name": "Brand", "description": "Product brand or manufacturer" },
      { "locale": "de", "name": "Marke", "description": "Produktmarke oder Hersteller" }
    ]
  }'
```

### 2. Create a number attribute with a unit

```bash
curl -X POST http://localhost:8080/api/v1/admin/attributes \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "identifier": "weight-g",
    "type": "number",
    "unit": "g",
    "filterable": false,
    "translations": [
      { "locale": "en", "name": "Weight" }
    ]
  }'
```

### 3. Create a select attribute with options

```bash
# Create the attribute
curl -X POST http://localhost:8080/api/v1/admin/attributes \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "identifier": "material",
    "type": "select",
    "filterable": true,
    "translations": [
      { "locale": "en", "name": "Material" }
    ]
  }'

# Add an option (use the attribute UUID from the response above)
curl -X POST http://localhost:8080/api/v1/admin/attributes/<attribute-id>/options \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "position": 0,
    "translations": [
      { "locale": "en", "name": "Leather" },
      { "locale": "de", "name": "Leder" }
    ]
  }'
```

### 4. Assign values to a product

```bash
curl -X PUT http://localhost:8080/api/v1/admin/products/<product-id>/attributes \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "attributes": [
      { "attribute_id": "<brand-uuid>", "value_text": "Timberland" },
      { "attribute_id": "<weight-uuid>", "value_numeric": 680 },
      { "attribute_id": "<material-uuid>", "option_id": "<leather-option-uuid>" }
    ]
  }'
```

This replaces (upserts) the existing values for each listed attribute. To remove a single attribute value, use `DELETE /api/v1/admin/products/{id}/attributes/{attributeId}`.

### 5. Assign values to a variant

```bash
curl -X PUT http://localhost:8080/api/v1/admin/products/<product-id>/variants/<variant-id>/attributes \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "attributes": [
      { "attribute_id": "<weight-uuid>", "value_numeric": 720 }
    ]
  }'
```

Variant-level values allow you to override or supplement product-level attribute values per configuration.

## See also

- [Products & Variants](/guide/products) — Property Groups and variant axes
- [Attributes API](/api/attributes) — Full endpoint reference
- [MCP Tools](/mcp/tools) — `admin_*_attribute` tools for agent-driven management
