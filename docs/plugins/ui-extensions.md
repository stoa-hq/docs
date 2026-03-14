# Plugin UI Extensions

Plugins can extend the Admin Panel and Storefront with custom UI — without modifying the core SPAs. Two mechanisms are available:

- **Schema-based forms** for simple settings (API keys, toggles, selects)
- **Web Components** for complex UIs (payment widgets, dashboards)

## How it works

1. Plugin implements `sdk.UIPlugin` in Go and declares extensions
2. Stoa validates, collects, and serves extensions via a manifest API
3. The frontend fetches the manifest and renders `<PluginSlot>` components at predefined locations

## Implementing UIPlugin

Add `UIExtensions()` to your plugin alongside the existing `sdk.Plugin` interface:

```go
package myplugin

import "github.com/stoa-hq/stoa/pkg/sdk"

func (p *Plugin) UIExtensions() []sdk.UIExtension {
    return []sdk.UIExtension{
        {
            ID:   "myplugin_settings",
            Slot: "admin:payment:settings",
            Type: "schema",
            Schema: &sdk.UISchema{
                Fields: []sdk.UISchemaField{
                    {
                        Key:   "api_key",
                        Type:  "password",
                        Label: map[string]string{"en": "API Key", "de": "API-Schlüssel"},
                    },
                    {
                        Key:  "mode",
                        Type: "select",
                        Label: map[string]string{"en": "Mode", "de": "Modus"},
                        Options: []sdk.UISelectOption{
                            {Value: "test", Label: map[string]string{"en": "Test"}},
                            {Value: "live", Label: map[string]string{"en": "Live"}},
                        },
                    },
                },
                SubmitURL: "/api/v1/admin/plugins/myplugin/settings",
                LoadURL:   "/api/v1/admin/plugins/myplugin/settings",
            },
        },
    }
}
```

## Extension Types

### Schema

Schema extensions render forms from field descriptors. Supported field types:

| Type | Renders |
|------|---------|
| `text` | Text input |
| `password` | Password input |
| `number` | Number input |
| `textarea` | Multi-line text |
| `toggle` | Checkbox |
| `select` | Dropdown with options |

Labels, placeholders, and help text support i18n via `map[string]string` (locale → text).

If `load_url` is set, the form loads current values on mount. If `submit_url` is set, a save button is shown and the form POSTs values on submit.

### Web Component

For complex UIs, plugins can ship a Web Component loaded from embedded assets:

```go
{
    ID:   "myplugin_checkout",
    Slot: "storefront:checkout:payment",
    Type: "component",
    Component: &sdk.UIComponent{
        TagName:         "stoa-myplugin-checkout",
        ScriptURL:       "/plugins/myplugin/assets/checkout.js",
        Integrity:       "sha256-...",
        ExternalScripts: []string{"https://js.example.com/v3/"},
        StyleURL:        "/plugins/myplugin/assets/checkout.css",
    },
}
```

The web component receives two properties:

- `context` — slot-specific data (e.g. payment method ID, order total)
- `apiClient` — scoped HTTP client limited to `/api/v1/store/*` and `/plugins/*`

Dispatch `plugin-event` CustomEvents to communicate back to the host page.

::: tip Real-world example
The [Stripe plugin](/plugins/stripe#storefront-integration) uses a Web Component to render Stripe Payment Elements in the checkout. See its `frontend/dist/checkout.js` for a complete implementation.
:::

## Serving Assets

Plugin assets are served from Go-embedded files. In `Init()`, mount the file server on the provided `AssetRouter`:

```go
//go:embed frontend/dist
var assetsFS embed.FS

func (p *Plugin) Init(app *sdk.AppContext) error {
    sub, _ := fs.Sub(assetsFS, "frontend/dist")
    app.AssetRouter.Handle("/*", http.StripPrefix(
        "/plugins/"+p.Name()+"/assets",
        http.FileServerFS(sub),
    ))
    return nil
}
```

Assets are served at `/plugins/{name}/assets/*`.

## Available Slots

| Slot | Location | SPA |
|------|----------|-----|
| `storefront:checkout:payment` | After payment method selection | Storefront |
| `storefront:checkout:after_order` | After order confirmation | Storefront |
| `admin:payment:settings` | Payment method detail page | Admin |
| `admin:sidebar` | Sidebar navigation | Admin |
| `admin:dashboard:widget` | Dashboard widgets | Admin |

## Manifest API

The backend serves filtered extensions:

- `GET /api/v1/store/plugin-manifest` — only `storefront:*` slots
- `GET /api/v1/admin/plugin-manifest` — only `admin:*` slots (requires auth)

Response:
```json
{
  "data": {
    "extensions": [
      {
        "id": "myplugin_settings",
        "slot": "admin:payment:settings",
        "type": "schema",
        "schema": { "fields": [...], "submit_url": "..." }
      }
    ]
  }
}
```

## Validation Rules

Extensions are validated at startup. Invalid extensions are skipped with a warning:

- Slot must start with `storefront:` or `admin:`
- Schema field types must be from the allowed list
- Web Component tag names must use `stoa-{pluginName}-` prefix
- URLs must not contain `..` (path traversal) or absolute URLs (`http://`, `https://`)

## Security

- **Light DOM with scoped CSS** — Web Components render in the Light DOM for maximum compatibility (e.g. Stripe Payment Element requires direct DOM access). CSS isolation is achieved via scoped class prefixes (`.stoa-{pluginName}-{component}`)
- **SRI** — Scripts are verified via `integrity` hash
- **Scoped API Client** — plugins can only call `/api/v1/store/*`, `/api/v1/admin/*`, and `/plugins/*`
- **Dynamic CSP** — external scripts from `ExternalScripts` are added to `script-src`, `frame-src`, and `connect-src` in the Content-Security-Policy header
- **Go-embedded assets** — no user-uploaded scripts, assets are compiled into the binary

## Frontend Integration

Use `<PluginSlot>` in Svelte pages to render plugin extensions at a given slot:

```svelte
<script>
  import PluginSlot from '$lib/components/PluginSlot.svelte';
</script>

<PluginSlot
  slot="admin:payment:settings"
  context={{ paymentMethodId: id, provider: form.provider }}
/>
```

If no plugins provide extensions for a slot, nothing is rendered.
