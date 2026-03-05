# Orders

## Order Lifecycle

Orders move through a defined set of statuses. Transitions are strictly enforced — only the arrows below are valid.

```
pending → confirmed → processing → shipped → delivered → refunded
    ↓           ↓            ↓
 cancelled  cancelled    cancelled
```

| Status | Meaning |
|--------|---------|
| `pending` | Order placed, awaiting confirmation |
| `confirmed` | Confirmed, not yet being processed |
| `processing` | Being prepared / packed |
| `shipped` | Handed to carrier |
| `delivered` | Received by customer |
| `cancelled` | Cancelled (terminal) |
| `refunded` | Refunded (terminal) |

Every status change is recorded in `OrderStatusHistory` with an optional comment.

## Order Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique identifier |
| `order_number` | string | Human-readable order number |
| `customer_id` | UUID? | Link to customer (null for guest orders) |
| `status` | string | Current status |
| `currency` | string | ISO 4217 code |
| `subtotal_net` | int | Net subtotal in cents |
| `subtotal_gross` | int | Gross subtotal in cents |
| `shipping_cost` | int | Shipping cost in cents |
| `tax_total` | int | Total tax in cents |
| `total` | int | Grand total in cents |
| `billing_address` | object | Billing address snapshot |
| `shipping_address` | object | Shipping address snapshot |
| `payment_method_id` | UUID? | Selected payment method |
| `shipping_method_id` | UUID? | Selected shipping method |
| `notes` | string | Customer or admin notes |
| `custom_fields` | object | Free-form extra data |

## Order Items

Each `OrderItem` is a snapshot of what was purchased at the time of the order. Product name, SKU, and prices are copied so that later changes to the product catalogue do not affect historical orders.

| Field | Description |
|-------|-------------|
| `product_id` / `variant_id` | Reference to the original product/variant |
| `sku` | Snapshot of SKU at time of order |
| `name` | Snapshot of product name |
| `quantity` | Units ordered |
| `unit_price_net` / `unit_price_gross` | Price per unit in cents |
| `total_net` / `total_gross` | Line total in cents |
| `tax_rate` | Tax rate in basis points (e.g. `1900` = 19%) |

## Guest Orders

`customer_id` is nullable. Orders from non-registered customers have no customer link — billing and shipping addresses are stored directly on the order.

## Updating Order Status

Via the Admin API:

```bash
curl -X PATCH http://localhost:8080/api/v1/admin/orders/<id>/status \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{"status": "shipped", "comment": "Tracking: DHL 12345"}'
```

Invalid transitions (e.g. `delivered` → `pending`) are rejected with a 422 error.
