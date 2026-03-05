# Plugin API Reference

## Plugin Interface

```go
type Plugin interface {
    Name() string        // Unique name, e.g. "order-email"
    Version() string     // Semver, e.g. "1.0.0"
    Description() string // Short description
    Init(app *AppContext) error
    Shutdown() error
}
```

## AppContext

```go
type AppContext struct {
    DB     *pgxpool.Pool
    Router chi.Router
    Hooks  *HookRegistry
    Config map[string]interface{}
    Logger zerolog.Logger
}
```

## HookRegistry

### Registering a handler

```go
app.Hooks.On(sdk.HookAfterOrderCreate, func(ctx context.Context, event *sdk.HookEvent) error {
    // ...
    return nil
})
```

### Dispatching a hook (from webhook handlers, etc.)

```go
app.Hooks.Dispatch(ctx, &sdk.HookEvent{
    Name:   sdk.HookAfterPaymentComplete,
    Entity: transaction,
})
```

## HookEvent

```go
type HookEvent struct {
    Name     string                 // Hook name constant
    Entity   interface{}            // The affected entity (type depends on hook)
    Changes  map[string]interface{} // Changed fields (before-update hooks)
    Metadata map[string]interface{} // Arbitrary extra data
}
```

Cast `Entity` to the concrete type for the hook you are handling:

```go
o := event.Entity.(*order.Order)
p := event.Entity.(*product.Product)
c := event.Entity.(*customer.Customer)
```

## Hook Constants

All constants are in `pkg/sdk/hooks.go`.

### Products

| Constant | Value | Entity type | Can cancel |
|----------|-------|-------------|------------|
| `HookBeforeProductCreate` | `product.before_create` | `*product.Product` | Yes |
| `HookAfterProductCreate` | `product.after_create` | `*product.Product` | No |
| `HookBeforeProductUpdate` | `product.before_update` | `*product.Product` | Yes |
| `HookAfterProductUpdate` | `product.after_update` | `*product.Product` | No |
| `HookBeforeProductDelete` | `product.before_delete` | `*product.Product` | Yes |
| `HookAfterProductDelete` | `product.after_delete` | `*product.Product` | No |

### Categories

| Constant | Value | Can cancel |
|----------|-------|------------|
| `HookBeforeCategoryCreate` | `category.before_create` | Yes |
| `HookAfterCategoryCreate` | `category.after_create` | No |
| `HookBeforeCategoryUpdate` | `category.before_update` | Yes |
| `HookAfterCategoryUpdate` | `category.after_update` | No |
| `HookBeforeCategoryDelete` | `category.before_delete` | Yes |
| `HookAfterCategoryDelete` | `category.after_delete` | No |

### Orders

| Constant | Value | Entity type | Can cancel |
|----------|-------|-------------|------------|
| `HookBeforeOrderCreate` | `order.before_create` | `*order.Order` | Yes |
| `HookAfterOrderCreate` | `order.after_create` | `*order.Order` | No |
| `HookBeforeOrderUpdate` | `order.before_update` | `*order.Order` | Yes |
| `HookAfterOrderUpdate` | `order.after_update` | `*order.Order` | No |

### Cart

| Constant | Value | Can cancel |
|----------|-------|------------|
| `HookBeforeCartAdd` | `cart.before_add_item` | Yes |
| `HookAfterCartAdd` | `cart.after_add_item` | No |
| `HookBeforeCartUpdate` | `cart.before_update_item` | Yes |
| `HookAfterCartUpdate` | `cart.after_update_item` | No |
| `HookBeforeCartRemove` | `cart.before_remove_item` | Yes |
| `HookAfterCartRemove` | `cart.after_remove_item` | No |

### Customers

| Constant | Value | Can cancel |
|----------|-------|------------|
| `HookBeforeCustomerCreate` | `customer.before_create` | Yes |
| `HookAfterCustomerCreate` | `customer.after_create` | No |
| `HookBeforeCustomerUpdate` | `customer.before_update` | Yes |
| `HookAfterCustomerUpdate` | `customer.after_update` | No |

### Checkout & Payment

| Constant | Value | Can cancel |
|----------|-------|------------|
| `HookBeforeCheckout` | `checkout.before` | Yes |
| `HookAfterCheckout` | `checkout.after` | No |
| `HookAfterPaymentComplete` | `payment.after_complete` | No |
| `HookAfterPaymentFailed` | `payment.after_failed` | No |

## BaseEntity

Shared fields available on all entities via `sdk.BaseEntity`:

```go
type BaseEntity struct {
    ID           uuid.UUID
    CreatedAt    time.Time
    UpdatedAt    time.Time
    CustomFields JSONB     // map[string]interface{}
    Metadata     JSONB
}
```

## Custom Endpoints

Plugins can register routes on the Chi router:

```go
func (p *Plugin) Init(app *sdk.AppContext) error {
    app.Router.Route("/api/v1/my-plugin", func(r chi.Router) {
        r.Get("/", p.handleList)
        r.Post("/", p.handleCreate)
        r.Delete("/{id}", p.handleDelete)
    })
    return nil
}
```

The router is the same instance used by Stoa core, so middleware (auth, logging, etc.) applies automatically for paths under `/api/v1/admin/*` and `/api/v1/store/*`.
