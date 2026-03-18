# Customers API

## Admin API

All admin endpoints require JWT authentication or an API key with `customers.*` permissions.

### List Customers

```http
GET /api/v1/admin/customers
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | int | Page number (default: 1) |
| `limit` | int | Items per page (default: 25, max: 100) |
| `search` | string | Search by name or email |
| `filter[active]` | bool | Filter by active status (`true` or `false`) |

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "email": "jane@example.com",
      "first_name": "Jane",
      "last_name": "Doe",
      "active": true,
      "default_billing_address_id": "uuid",
      "default_shipping_address_id": "uuid",
      "custom_fields": {},
      "created_at": "2026-03-15T10:00:00Z",
      "updated_at": "2026-03-15T10:00:00Z",
      "addresses": [
        {
          "id": "uuid",
          "customer_id": "uuid",
          "first_name": "Jane",
          "last_name": "Doe",
          "company": "Acme Inc.",
          "street": "Hauptstraße 1",
          "city": "Berlin",
          "zip": "10115",
          "country_code": "DE",
          "phone": "+49 30 12345678",
          "created_at": "2026-03-15T10:00:00Z",
          "updated_at": "2026-03-15T10:00:00Z"
        }
      ]
    }
  ],
  "meta": { "total": 85, "page": 1, "limit": 25, "pages": 4 }
}
```

### Get Customer

```http
GET /api/v1/admin/customers/:id
```

Returns the full customer including all addresses.

### Create Customer

```http
POST /api/v1/admin/customers
```

**Request Body:**

```json
{
  "email": "jane@example.com",
  "password": "securepassword123",
  "first_name": "Jane",
  "last_name": "Doe"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | Unique email address (max 255 chars) |
| `password` | string | Yes | Password (min 8, max 128 chars) — hashed with Argon2id |
| `first_name` | string | Yes | First name (max 100 chars) |
| `last_name` | string | Yes | Last name (max 100 chars) |

**Response:** `201 Created` with the customer object (password is never returned).

| Error Code | Status | Description |
|------------|--------|-------------|
| `email_taken` | 409 | Email address is already in use |

### Update Customer

```http
PUT /api/v1/admin/customers/:id
```

All fields are optional — only provided fields are updated.

```json
{
  "email": "jane.new@example.com",
  "first_name": "Jane",
  "last_name": "Smith",
  "active": false,
  "default_billing_address_id": "uuid",
  "default_shipping_address_id": "uuid",
  "custom_fields": { "vip": true }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `email` | string | New email address |
| `first_name` | string | First name |
| `last_name` | string | Last name |
| `active` | bool | Enable or disable the account |
| `default_billing_address_id` | UUID | Default billing address |
| `default_shipping_address_id` | UUID | Default shipping address |
| `custom_fields` | object | User-facing custom data (JSONB) |

**Response:** `200 OK` with the updated customer object.

| Error Code | Status | Description |
|------------|--------|-------------|
| `email_taken` | 409 | Email address is already in use |

### Delete Customer

```http
DELETE /api/v1/admin/customers/:id
```

**Response:** `204 No Content`

---

## Store API

### Register

```http
POST /api/v1/store/register
```

Self-registration for new customers. No authentication required.

**Request Body:**

```json
{
  "email": "jane@example.com",
  "password": "securepassword123",
  "first_name": "Jane",
  "last_name": "Doe"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | Unique email address (max 255 chars) |
| `password` | string | Yes | Password (min 8, max 128 chars) |
| `first_name` | string | Yes | First name (max 100 chars) |
| `last_name` | string | Yes | Last name (max 100 chars) |

**Response:** `201 Created` with the customer object.

| Error Code | Status | Description |
|------------|--------|-------------|
| `email_taken` | 409 | Email address is already in use |

::: tip After Registration
The response does not include authentication tokens. After registration, the customer must [log in](/api/authentication) to obtain a JWT access token.
:::

### Get Account

```http
GET /api/v1/store/account
```

Returns the authenticated customer's profile. Requires JWT authentication.

```bash
curl http://localhost:8080/api/v1/store/account \
  -H 'Authorization: Bearer <access_token>'
```

**Response:** `200 OK` with the customer object including addresses.

### Update Account

```http
PUT /api/v1/store/account
```

Allows customers to update their own profile. Requires JWT authentication.

```json
{
  "first_name": "Jane",
  "last_name": "Smith",
  "email": "jane.new@example.com"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `first_name` | string | First name (max 100 chars) |
| `last_name` | string | Last name (max 100 chars) |
| `email` | string | New email address (max 255 chars) |

**Response:** `200 OK` with the updated customer object.

| Error Code | Status | Description |
|------------|--------|-------------|
| `email_taken` | 409 | Email address is already in use |

::: warning Scope
Customers can only update their own account. The customer ID is extracted from the JWT token — there is no way to modify another customer's data through the store API.
:::
