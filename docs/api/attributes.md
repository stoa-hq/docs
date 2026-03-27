# Attributes API

All admin endpoints require JWT authentication or an API key with `products.*` permissions.

Attribute values are embedded in product and variant responses automatically — no separate fetch is needed for the Store API.

::: info Attributes vs Property Groups
Attributes are descriptive metadata (Brand, Material, Weight). Property Groups define variant axes (Size, Color). See [Product Attributes](/guide/attributes) for the conceptual overview.
:::

---

## Attribute Definitions

### List Attributes

```http
GET /api/v1/admin/attributes
```

Returns all attribute definitions with their translations and options.

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "identifier": "brand",
      "type": "text",
      "unit": "",
      "position": 0,
      "filterable": true,
      "required": false,
      "created_at": "2026-03-15T10:00:00Z",
      "updated_at": "2026-03-15T10:00:00Z",
      "translations": [
        { "locale": "en", "name": "Brand", "description": "Product brand or manufacturer" },
        { "locale": "de", "name": "Marke", "description": "" }
      ],
      "options": []
    }
  ]
}
```

### Get Attribute

```http
GET /api/v1/admin/attributes/{id}
```

Returns a single attribute including all translations and options.

**Response:** `200 OK` with the full attribute object.

**Error responses:**

| Status | Condition |
|--------|-----------|
| `404 Not Found` | Attribute does not exist |

### Create Attribute

```http
POST /api/v1/admin/attributes
```

**Request Body:**

```json
{
  "identifier": "material",
  "type": "select",
  "unit": "",
  "position": 1,
  "filterable": true,
  "required": false,
  "translations": [
    { "locale": "en", "name": "Material", "description": "Primary material composition" },
    { "locale": "de", "name": "Material", "description": "Hauptmaterial" }
  ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `identifier` | string | Yes | Unique slug. Pattern: `^[a-z0-9][a-z0-9_-]*$` (max 255 chars) |
| `type` | string | Yes | One of: `text`, `number`, `select`, `multi_select`, `boolean` |
| `unit` | string | No | Unit of measurement, e.g. `g`, `mm`, `kg` (max 20 chars). Relevant for `number` type. |
| `position` | int | No | Sort order (default: 0) |
| `filterable` | bool | No | Whether storefront can filter by this attribute (default: `false`) |
| `required` | bool | No | Whether this attribute should always be set (default: `false`) |
| `translations` | array | Yes | At least one translation required |

**Translation fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `locale` | string | Yes | BCP 47 language tag (e.g. `en`, `de`) |
| `name` | string | Yes | Attribute display name (max 255 chars) |
| `description` | string | No | Longer description of the attribute |

**Response:** `201 Created` with the full attribute object.

**Error responses:**

| Status | Error code | Condition |
|--------|-----------|-----------|
| `409 Conflict` | `duplicate_identifier` | Another attribute already uses this identifier |
| `422 Unprocessable Entity` | `invalid_identifier` | Identifier does not match the required pattern |
| `422 Unprocessable Entity` | `invalid_attribute_type` | Type is not one of the allowed values |

### Update Attribute

```http
PUT /api/v1/admin/attributes/{id}
```

All fields from [Create Attribute](#create-attribute) are accepted. All fields are required (full replacement).

**Response:** `200 OK` with the updated attribute object.

**Error responses:** Same as [Create Attribute](#create-attribute), plus `404 Not Found`.

### Delete Attribute

```http
DELETE /api/v1/admin/attributes/{id}
```

Deletes the attribute definition, all its options, and all values assigned to products and variants.

**Response:** `204 No Content`

**Error responses:**

| Status | Condition |
|--------|-----------|
| `404 Not Found` | Attribute does not exist |

---

## Attribute Options

Options are predefined values for `select` and `multi_select` attributes.

### Create Attribute Option

```http
POST /api/v1/admin/attributes/{id}/options
```

**Request Body:**

```json
{
  "position": 0,
  "translations": [
    { "locale": "en", "name": "Leather" },
    { "locale": "de", "name": "Leder" }
  ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `position` | int | No | Sort order within the attribute's options |
| `translations` | array | Yes | At least one translation required |

**Translation fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `locale` | string | Yes | BCP 47 language tag |
| `name` | string | Yes | Option display name (max 255 chars) |

**Response:** `201 Created`

```json
{
  "data": {
    "id": "uuid",
    "attribute_id": "uuid",
    "position": 0,
    "translations": [
      { "locale": "en", "name": "Leather" },
      { "locale": "de", "name": "Leder" }
    ]
  }
}
```

### Update Attribute Option

```http
PUT /api/v1/admin/attributes/{id}/options/{optionId}
```

Same body as [Create Attribute Option](#create-attribute-option).

**Response:** `200 OK`

**Error responses:**

| Status | Condition |
|--------|-----------|
| `404 Not Found` | Attribute option does not exist |

### Delete Attribute Option

```http
DELETE /api/v1/admin/attributes/{id}/options/{optionId}
```

**Response:** `204 No Content`

**Error responses:**

| Status | Condition |
|--------|-----------|
| `404 Not Found` | Attribute option does not exist |

---

## Product Attribute Values

### Set Product Attributes

```http
PUT /api/v1/admin/products/{id}/attributes
```

Upserts attribute values on a product. Each entry in the array is matched by `attribute_id` — existing values are replaced, new values are inserted.

**Request Body:**

```json
{
  "attributes": [
    { "attribute_id": "uuid-brand",    "value_text": "Timberland" },
    { "attribute_id": "uuid-weight",   "value_numeric": 680 },
    { "attribute_id": "uuid-material", "option_id": "uuid-leather" },
    { "attribute_id": "uuid-features", "option_ids": ["uuid-waterproof", "uuid-breathable"] },
    { "attribute_id": "uuid-active",   "value_boolean": true }
  ]
}
```

Use the value field that matches the attribute's `type`:

| Attribute type | Required value field |
|----------------|---------------------|
| `text` | `value_text` |
| `number` | `value_numeric` |
| `select` | `option_id` |
| `multi_select` | `option_ids` |
| `boolean` | `value_boolean` |

**Response:** `200 OK`

**Error responses:**

| Status | Condition |
|--------|-----------|
| `404 Not Found` | Product or attribute does not exist |
| `422 Unprocessable Entity` | Value does not match the attribute type |

### Delete Product Attribute Value

```http
DELETE /api/v1/admin/products/{id}/attributes/{attributeId}
```

Removes the assignment of a single attribute from a product.

**Response:** `204 No Content`

**Error responses:**

| Status | Condition |
|--------|-----------|
| `404 Not Found` | Assignment does not exist |

---

## Variant Attribute Values

### Set Variant Attributes

```http
PUT /api/v1/admin/products/{id}/variants/{vId}/attributes
```

Same request body and semantics as [Set Product Attributes](#set-product-attributes), applied to a specific variant.

**Response:** `200 OK`

**Error responses:**

| Status | Condition |
|--------|-----------|
| `404 Not Found` | Product, variant, or attribute does not exist |
| `422 Unprocessable Entity` | Value does not match the attribute type |

### Delete Variant Attribute Value

```http
DELETE /api/v1/admin/products/{id}/variants/{vId}/attributes/{aId}
```

**Response:** `204 No Content`

---

## Store API

Attribute values are embedded in product and variant responses. No dedicated store endpoint exists.

```http
GET /api/v1/store/products/:slug
GET /api/v1/store/products/id/:id
```

**Attributes in product response:**

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
        "translations": [
          { "locale": "en", "name": "Brand" },
          { "locale": "de", "name": "Marke" }
        ]
      },
      {
        "attribute_id": "uuid-weight",
        "attribute_identifier": "weight-g",
        "type": "number",
        "unit": "g",
        "value_numeric": 680,
        "translations": [
          { "locale": "en", "name": "Weight" }
        ]
      },
      {
        "attribute_id": "uuid-material",
        "attribute_identifier": "material",
        "type": "select",
        "option_id": "uuid-leather",
        "translations": [
          { "locale": "en", "name": "Material" }
        ]
      }
    ],
    "variants": [
      {
        "id": "uuid-variant",
        "sku": "BOOT-BLK-42-WIDE",
        "attributes": [
          {
            "attribute_id": "uuid-weight",
            "attribute_identifier": "weight-g",
            "type": "number",
            "unit": "g",
            "value_numeric": 720,
            "translations": [
              { "locale": "en", "name": "Weight" }
            ]
          }
        ]
      }
    ]
  }
}
```

::: tip
The `attribute_identifier` field in value responses lets storefronts display attribute data without resolving the UUID to a definition.
:::

## See also

- [Product Attributes guide](/guide/attributes) — Concepts, types, and examples
- [Products API](/api/products) — Full product endpoint reference
- [MCP Tools](/mcp/tools) — `admin_*_attribute` tools for agent-driven management
