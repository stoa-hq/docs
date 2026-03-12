# n8n Workflow Integration

The `stoa-plugin-n8n` plugin connects Stoa to [n8n](https://n8n.io), an open-source workflow automation platform. It enables business workflows, scheduled jobs, and third-party integrations without coupling them to the Stoa core.

Every Stoa domain event (order created, payment completed, customer registered, …) is forwarded to n8n via a signed HTTP webhook. From there, n8n can route the event into any workflow.

## How it works

```
Stoa Domain Event (e.g. order.after_create)
    │
    ▼
stoa-plugin-n8n
    │  POST {webhook_base_url}/order.after_create
    │  X-Stoa-Signature: sha256=<hmac-sha256>
    ▼
n8n Webhook Node
    ├── Send order confirmation e-mail
    ├── Notify warehouse via Slack
    ├── Sync to ERP system
    └── Schedule follow-up tasks
```

## Installation

The plugin is maintained in the [stoa-plugins monorepo](https://github.com/stoa-hq/stoa-plugins).

```bash
go get github.com/stoa-hq/stoa-plugins/n8n@latest
```

Register the plugin in `internal/app/app.go`:

```go
import n8nplugin "github.com/stoa-hq/stoa-plugins/n8n"

func (a *App) RegisterPlugins() error {
    appCtx := &plugin.AppContext{
        DB:     a.DB.Pool,
        Router: a.Server.Router(),
        Config: a.Config.Plugins, // see Configuration below
        Logger: a.Logger,
    }
    return a.PluginRegistry.Register(n8nplugin.New(), appCtx)
}
```

## Configuration

Add an `n8n` section to your `config.yaml`:

```yaml
plugins:
  n8n:
    webhook_base_url: "http://n8n:5678/webhook/stoa"
    secret: "change-me-to-a-strong-secret"
    timeout_seconds: 10   # optional, default: 10
```

| Key | Required | Description |
|-----|----------|-------------|
| `webhook_base_url` | Yes | Base URL of your n8n instance. Each event is sent to `{base_url}/{event_name}` |
| `secret` | Yes | Shared HMAC-SHA256 signing secret |
| `timeout_seconds` | No | HTTP timeout for webhook calls (default: `10`) |

## Forwarded events

Only **after-hooks** are forwarded. Before-hooks can abort database operations and must not be the responsibility of a notification integration.

| Event | Trigger |
|-------|---------|
| `product.after_create` | New product published |
| `product.after_update` | Product updated |
| `product.after_delete` | Product deleted |
| `category.after_create` | New category created |
| `category.after_update` | Category updated |
| `category.after_delete` | Category deleted |
| `order.after_create` | New order placed |
| `order.after_update` | Order status changed |
| `cart.after_add_item` | Item added to cart |
| `cart.after_update_item` | Cart item quantity changed |
| `cart.after_remove_item` | Item removed from cart |
| `customer.after_create` | Customer registered |
| `customer.after_update` | Customer profile updated |
| `payment.after_complete` | Payment successful |
| `payment.after_failed` | Payment failed |
| `checkout.after` | Checkout completed |

## Webhook payload

Every request is a `POST` with `Content-Type: application/json`:

```json
{
  "event": "order.after_create",
  "timestamp": "2026-03-12T10:00:00Z",
  "entity": {
    "id": "018e1b2c-...",
    "order_number": "ORD-1042",
    "total": 4999
  },
  "changes": {},
  "metadata": {}
}
```

::: tip Prices are integers
Monetary values follow Stoa's convention: integer cents. `4999` = €49.99.
:::

## Signature verification

Every request carries a signature header:

```
X-Stoa-Signature: sha256=<hmac-sha256(body, secret)>
```

Verify the signature in your n8n **Code node** to ensure requests originate from Stoa:

```javascript
const crypto = require('crypto');

const body = JSON.stringify($input.item.json);
const receivedSig = $input.item.headers['x-stoa-signature'];
const expectedSig = 'sha256=' + crypto
  .createHmac('sha256', 'your-secret')
  .update(body)
  .digest('hex');

if (receivedSig !== expectedSig) {
  throw new Error('Invalid signature — request rejected');
}

return $input.item;
```

## n8n setup

In n8n, add a **Webhook** node for each event you want to handle:

1. **Method**: POST
2. **Path**: `stoa/order.after_create` (matches `{base_url}/order.after_create`)
3. **Authentication**: None (use the Code node for HMAC verification instead)

One workflow per event type is the recommended approach — it keeps workflows focused and easy to debug.

## Health check

The plugin registers an admin endpoint to verify n8n connectivity:

```
GET /plugins/n8n/health
```

**Response when n8n is reachable (`200 OK`):**
```json
{
  "status": "ok",
  "n8n_reachable": true,
  "checked_at": "2026-03-12T10:00:00Z"
}
```

**Response when n8n is unreachable (`503 Service Unavailable`):**
```json
{
  "status": "degraded",
  "n8n_reachable": false,
  "error": "dial tcp ...: connection refused",
  "checked_at": "2026-03-12T10:00:00Z"
}
```

## Error behaviour

If a webhook call to n8n fails (network error, HTTP 4xx/5xx), the error is **logged but not propagated**. A failed notification never rolls back a completed business transaction.

Monitor failures via the Stoa application logs:

```
{"level":"error","plugin":"n8n","hook":"order.after_create","error":"...","message":"webhook dispatch failed"}
```

## Example workflows

### Order confirmation e-mail

Trigger: `order.after_create`

```
Webhook → Extract customer e-mail → Send via SendGrid
```

### Low-stock alert

Trigger: `product.after_update`

```
Webhook → IF stock < 10 → Send Slack message to #warehouse
```

### Nightly price sync (Cronjob)

```
Schedule (0 2 * * *) → HTTP Request → GET /api/v1/admin/products → Process → Update ERP
```

n8n's built-in **Schedule Trigger** node handles cron-style jobs independently of Stoa events.
