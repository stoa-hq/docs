# Shipping Providers

Shipping methods are stored as records in the database (managed via the admin panel or API). Custom shipping logic — dynamic rates, carrier API lookups, free-shipping rules — is implemented as plugins.

## How Shipping Works

1. The storefront calls `store_get_shipping_methods` (or `GET /api/v1/store/shipping-methods`) to get the available options.
2. The customer selects a method.
3. At checkout, the selected `shipping_method_id` is attached to the order.
4. The `checkout.before` hook fires — your plugin can modify the shipping cost or block the checkout based on the selected method.

## ShippingMethod Entity

```go
type ShippingMethod struct {
    ID           uuid.UUID
    Active       bool
    PriceNet     int    // cents
    PriceGross   int    // cents
    TaxRuleID    *uuid.UUID
    CustomFields map[string]interface{}
    Translations []ShippingMethodTranslation
}

type ShippingMethodTranslation struct {
    Locale      string
    Name        string
    Description string
}
```

## Example: Free Shipping Above a Threshold

Use `HookBeforeCheckout` to override shipping cost based on order total:

```go
package freeshipping

import (
    "context"
    "github.com/epoxx-arch/stoa/internal/domain/order"
    "github.com/epoxx-arch/stoa/pkg/sdk"
)

type Plugin struct{}

func New() *Plugin { return &Plugin{} }

func (p *Plugin) Name() string        { return "free-shipping" }
func (p *Plugin) Version() string     { return "1.0.0" }
func (p *Plugin) Description() string { return "Free shipping above 50 EUR" }
func (p *Plugin) Shutdown() error     { return nil }

func (p *Plugin) Init(app *sdk.AppContext) error {
    app.Hooks.On(sdk.HookBeforeCheckout, func(ctx context.Context, event *sdk.HookEvent) error {
        o := event.Entity.(*order.Order)
        if o.SubtotalGross >= 5000 { // 50.00 EUR in cents
            o.ShippingCost = 0
        }
        return nil
    })
    return nil
}
```

## Example: Carrier API Rate Lookup

For dynamic rates from an external carrier API, hook into `checkout.before`, query the API, and either update `o.ShippingCost` or return an error if the carrier is unavailable:

```go
func (p *Plugin) Init(app *sdk.AppContext) error {
    app.Hooks.On(sdk.HookBeforeCheckout, func(ctx context.Context, event *sdk.HookEvent) error {
        o := event.Entity.(*order.Order)

        // Only apply to orders using our carrier's shipping method
        if o.ShippingMethodID == nil || *o.ShippingMethodID != p.methodID {
            return nil
        }

        rate, err := p.carrierClient.GetRate(ctx, o.ShippingAddress, o.Items)
        if err != nil {
            return fmt.Errorf("carrier rate lookup failed: %w", err)
        }

        o.ShippingCost = rate.PriceGross
        return nil
    })
    return nil
}
```

## Managing Shipping Methods via API

```bash
# Create a shipping method
curl -X POST http://localhost:8080/api/v1/admin/shipping-methods \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "active": true,
    "price_net": 399,
    "price_gross": 475,
    "translations": [
      {"locale": "en-US", "name": "Standard Shipping", "description": "3–5 business days"},
      {"locale": "de-DE", "name": "Standardversand", "description": "3–5 Werktage"}
    ]
  }'

# List all shipping methods
curl http://localhost:8080/api/v1/store/shipping-methods
```

## Registering the Plugin

```go
import "github.com/epoxx-arch/stoa/plugins/freeshipping"

func (a *App) RegisterPlugins() error {
    appCtx := &plugin.AppContext{
        DB:     a.DB.Pool,
        Router: a.Server.Router(),
        Hooks:  a.PluginRegistry.Hooks(),
        Logger: a.Logger,
    }
    return a.PluginRegistry.Register(freeshipping.New(), appCtx)
}
```
