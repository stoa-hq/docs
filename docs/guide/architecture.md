# Architecture

Stoa is a single Go binary that embeds all its moving parts.

## High-Level Overview

```
                        ┌──────────────────────────────────────┐
                        │              Stoa Binary              │
                        │                                       │
  Browser / Agent ─────▶│  HTTP Server (Chi Router)            │
                        │    ├── /api/v1/admin/*  (Admin API)  │
                        │    ├── /api/v1/store/*  (Store API)  │
                        │    ├── /admin/*         (Admin SPA)  │
                        │    └── /*               (Storefront) │
                        │                                       │
                        │  Domain Layer                         │
                        │    product · order · cart             │
                        │    customer · discount · payment      │
                        │    shipping · tax · media · ...       │
                        │                                       │
                        │  Plugin Registry                      │
                        │  MCP Servers (Store + Admin)          │
                        └─────────────────┬────────────────────┘
                                          │
                                   PostgreSQL 16+
```

## Domain Layer

Every feature lives in `internal/domain/<name>/` and follows a consistent structure:

| File | Responsibility |
|------|----------------|
| `entity.go` | Data structures (structs) |
| `repository.go` | Interface (what the domain needs from storage) |
| `postgres.go` | PostgreSQL implementation of the repository |
| `service.go` | Business logic |
| `handler.go` | HTTP handlers |
| `dto.go` | Request / response types |

This pattern ensures business logic stays in the service layer, never leaking into handlers or repositories.

## Frontends

Both the admin panel and the storefront are SvelteKit applications compiled into static assets and embedded into the Go binary via `//go:embed`. No separate server is needed — the Go binary serves everything.

```
admin/          → built → internal/admin/dist/
storefront/     → built → internal/storefront/dist/
```

## Authentication

Stoa supports two authentication mechanisms:

- **JWT** — for browser sessions (admin users, customers). Tokens are issued via `/api/v1/auth/login` and refreshed via `/api/v1/auth/refresh`.
- **API Keys** — for programmatic access (MCP servers, integrations). Keys carry explicit permission scopes (`products.read`, `orders.update`, etc.).

## Plugin System

Plugins are registered at startup and receive an `AppContext` with direct access to the database connection, the HTTP router, the hook registry, and the logger. See [Plugin System](/plugins/overview) for details.

## MCP Servers

Two separate binaries (`stoa-store-mcp`, `stoa-admin-mcp`) run alongside the main server. They connect to the Stoa REST API and expose it as MCP tools over SSE. See [MCP Overview](/mcp/overview).

## Prices

All prices are stored as **integers in the smallest currency unit** (cents for EUR/USD). The API always returns integers — formatting is the frontend's responsibility.

## Multi-Language

Product names, descriptions, slugs, categories, and property groups each have a `translations` table keyed by locale (e.g. `de-DE`, `en-US`). The store API reads the locale from the `Accept-Language` header or a query parameter.
