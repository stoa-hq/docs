# MCP Setup

Connect AI agents to your Stoa shop.

## Prerequisites

1. A running Stoa instance (see [Quick Start](/guide/quick-start))
2. An API key with the required permissions (for Admin MCP)

## Create an API Key

The easiest way is through the **Admin Panel**: navigate to **API Keys**, click **New API Key**, and use the **MCP Full Access** preset to grant all permissions. Copy the key immediately — it is shown only once.

Alternatively, create a key via the API:

```bash
TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"your-password"}' | jq -r '.data.access_token')

curl -X POST http://localhost:8080/api/v1/admin/api-keys \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "MCP Admin Key",
    "permissions": [
      "products.read", "products.create", "products.update", "products.delete",
      "categories.read", "categories.create", "categories.update", "categories.delete",
      "customers.read", "customers.create", "customers.update", "customers.delete",
      "orders.read", "orders.create", "orders.update", "orders.delete",
      "media.read", "media.create", "media.delete",
      "discounts.read", "discounts.create", "discounts.update", "discounts.delete",
      "shipping.read", "shipping.create", "shipping.update", "shipping.delete",
      "payment.read", "payment.create", "payment.update", "payment.delete",
      "tax.read", "tax.create", "tax.update", "tax.delete",
      "settings.read", "settings.update",
      "plugins.manage", "audit.read", "api_keys.manage"
    ]
  }'

# Save the "key" field from the response — it is shown only once!
```

For the Store MCP server, no API key is needed for public endpoints (browsing, cart).

See [API Keys](/api/api-keys) for full details on permissions, security, and management.

## Build

```bash
make mcp-store-build    # → bin/stoa-store-mcp
make mcp-admin-build    # → bin/stoa-admin-mcp
```

## Configuration

Both servers are configured via environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `STOA_MCP_API_URL` | `http://localhost:8080` | Stoa backend URL |
| `STOA_MCP_API_KEY` | *(empty)* | API key for authentication |
| `STOA_MCP_PORT` | `8090` | HTTP port for SSE server |
| `STOA_MCP_BASE_URL` | `http://localhost:<port>` | Public base URL (for proxied setups) |

## Run

```bash
# Store MCP on port 8090 (default), Admin MCP on port 8091
make mcp-store-run
STOA_MCP_PORT=8091 STOA_MCP_API_KEY=ck_... make mcp-admin-run
```

Both servers expose SSE endpoints:
- **SSE stream:** `http://localhost:<port>/sse`
- **Message endpoint:** `http://localhost:<port>/message`

## Docker Deployment

Both MCP servers are included in the Docker image and available as separate services in `docker-compose.yaml`.

### Services

| Service | Binary | Default Port | Purpose |
|---------|--------|-------------|---------|
| `stoa-store-mcp` | `stoa-store-mcp` | 8090 | Store MCP (browsing, cart, checkout) |
| `stoa-admin-mcp` | `stoa-admin-mcp` | 8091 | Admin MCP (product/order management) |

### docker-compose.yaml

The default compose file includes both MCP services:

```yaml
stoa-store-mcp:
  build:
    context: .
    args:
      PLUGINS: "${STOA_PLUGINS:-}"
  ports:
    - "8090:8090"
  environment:
    STOA_MCP_API_URL: "http://stoa:8080"
    STOA_MCP_API_KEY: "${STOA_MCP_API_KEY:-}"
    STOA_MCP_PORT: "8090"
  depends_on:
    stoa:
      condition: service_started
  entrypoint: ["./stoa-store-mcp"]

stoa-admin-mcp:
  build:
    context: .
    args:
      PLUGINS: "${STOA_PLUGINS:-}"
  ports:
    - "8091:8091"
  environment:
    STOA_MCP_API_URL: "http://stoa:8080"
    STOA_MCP_API_KEY: "${STOA_MCP_API_KEY:-}"
    STOA_MCP_PORT: "8091"
  depends_on:
    stoa:
      condition: service_started
  entrypoint: ["./stoa-admin-mcp"]
```

::: tip Internal networking
`STOA_MCP_API_URL` points to `http://stoa:8080` — the Docker-internal service name. Do not use `localhost` here.
:::

### Environment Variables

Set the API key in your `.env` file:

```env
STOA_MCP_API_KEY=ck_your_api_key_here
```

### Start

```bash
docker compose up -d
```

Verify the services are running:

```bash
curl http://localhost:8090/sse    # Store MCP
curl http://localhost:8091/sse    # Admin MCP
```

### With Plugins

If you use plugins that register MCP tools (e.g. Stripe), both MCP services automatically include them when built with the `STOA_PLUGINS` argument:

```bash
STOA_PLUGINS=stripe docker compose build
docker compose up -d
```

See [Docker Plugin Installation](/plugins/docker-installation) for details.

## Use with Claude Code

There are two ways to connect Claude Code to the Stoa MCP servers: via `.mcp.json` (stdio, recommended for local development) or via SSE (for remote/Docker deployments).

### Via .mcp.json (stdio, recommended)

Place a `.mcp.json` file in the Stoa project root. Claude Code detects it automatically and launches the servers as subprocesses using `go run` — no build step required.

```json
{
  "mcpServers": {
    "stoa-admin": {
      "type": "stdio",
      "command": "go",
      "args": ["run", "./cmd/stoa-admin-mcp", "--stdio"],
      "env": {
        "STOA_MCP_API_URL": "http://localhost:8080",
        "STOA_MCP_API_KEY": "${STOA_MCP_API_KEY}"
      }
    },
    "stoa-store": {
      "type": "stdio",
      "command": "go",
      "args": ["run", "./cmd/stoa-store-mcp", "--stdio"],
      "env": {
        "STOA_MCP_API_URL": "http://localhost:8080",
        "STOA_MCP_API_KEY": "${STOA_MCP_API_KEY}"
      }
    }
  }
}
```

`${STOA_MCP_API_KEY}` is expanded from your shell environment. Set the variable before starting Claude Code:

```bash
export STOA_MCP_API_KEY=ck_your_api_key_here
```

::: tip stdio vs SSE
The `--stdio` flag switches the server from SSE mode to stdio mode. In stdio mode the server communicates over stdin/stdout — no HTTP port is needed and Claude Code manages the process lifecycle.
:::

::: warning API key required for admin tools
The Store MCP server serves public endpoints without authentication (browsing, cart). However, the Admin MCP server requires `STOA_MCP_API_KEY` to be set. If the variable is empty, both servers log a warning on startup and every tool call returns an error immediately — no request is sent to the backend:

```
WARNING: STOA_MCP_API_KEY is not set — all tool calls will fail with 401
```

When a tool call is attempted with no key configured, the client returns:

```
STOA_MCP_API_KEY is not configured — set the environment variable and restart the MCP server
```
:::

### Via SSE (remote / Docker)

If the MCP servers are running as separate processes or Docker services, point Claude Code at their SSE endpoints instead:

```json
{
  "mcpServers": {
    "stoa-store": {
      "url": "http://localhost:8090/sse"
    },
    "stoa-admin": {
      "url": "http://localhost:8091/sse"
    }
  }
}
```

Once configured, you can interact with the shop in natural language:

- *"Show me all shoes under 50 EUR"*
- *"Add the leather boots to the cart"*
- *"Create a 20% discount code SUMMER for all orders over 50 EUR"*
- *"What are the last 10 orders?"*
