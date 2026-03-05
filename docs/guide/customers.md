# Customers

## Customer Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique identifier |
| `email` | string | Email address (unique) |
| `first_name` / `last_name` | string | Display name |
| `active` | bool | Whether the account is active |
| `default_billing_address_id` | UUID? | Default billing address |
| `default_shipping_address_id` | UUID? | Default shipping address |
| `custom_fields` | object | Free-form extra data |

`password_hash` is never returned by the API.

## Addresses

Each customer can have multiple saved addresses. An address contains:

| Field | Description |
|-------|-------------|
| `first_name` / `last_name` | Name on the address |
| `company` | Optional company name |
| `street` | Street and house number |
| `city` | City |
| `zip` | Postal code |
| `country_code` | ISO 3166-1 alpha-2 (e.g. `DE`, `US`) |
| `phone` | Optional phone number |

## Registration & Login

Customers register and log in via the Store API:

```bash
# Register
curl -X POST http://localhost:8080/api/v1/store/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email": "jane@example.com", "password": "secret", "first_name": "Jane", "last_name": "Doe"}'

# Login
curl -X POST http://localhost:8080/api/v1/store/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email": "jane@example.com", "password": "secret"}'
```

The login response contains `access_token` and `refresh_token`, identical in structure to admin JWTs.

## Guest Orders

Customers do not need an account to place an order. Guest orders have no `customer_id` and billing/shipping addresses are stored directly on the order.

## Admin Management

Admins can list, view, update, and delete customers via the Admin API or the admin panel. Customer passwords are never exposed — a password reset flow should be implemented via a plugin or custom endpoint.

## RBAC

Customers have no access to the Admin API. They can only access their own account data, order history, and cart via the Store API using their JWT.
