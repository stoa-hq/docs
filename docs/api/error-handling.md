# Error Handling

Stoa follows a strict error handling policy to prevent information disclosure. Internal error details (database schema, file paths, stack traces) are never exposed to API clients.

## Response Format

All error responses use the standard envelope:

```json
{
  "errors": [
    {
      "code": "internal_error",
      "detail": "an unexpected error occurred",
      "field": ""
    }
  ]
}
```

| Field | Description |
|-------|-------------|
| `code` | Machine-readable error code (e.g. `not_found`, `validation_error`, `internal_error`) |
| `detail` | Human-readable message, safe for display to end users |
| `field` | Optional — the request field that caused the error |

## Error Categories

### 500 Internal Server Errors

All internal errors return the generic message `"an unexpected error occurred"` with code `internal_error`. The actual error is logged server-side with:

- `request_id` — correlates with the `X-Request-ID` response header
- `method` — HTTP method
- `path` — request path
- `err` — the original error (only in server logs)

**Example response:**

```json
{
  "errors": [
    {
      "code": "internal_error",
      "detail": "an unexpected error occurred"
    }
  ]
}
```

To debug a 500 error, use the `X-Request-ID` header value from the response to search the server logs.

### 400 Validation Errors

Validation errors return structured field-level feedback when possible:

```json
{
  "errors": [
    {
      "code": "validation_error",
      "detail": "required",
      "field": "Name"
    },
    {
      "code": "validation_error",
      "detail": "min",
      "field": "PriceNet"
    }
  ]
}
```

If validation fails in an unexpected way, a generic fallback is returned:

```json
{
  "errors": [
    {
      "code": "validation_failed",
      "detail": "invalid request data"
    }
  ]
}
```

### 400 JSON Parse Errors

Invalid request bodies return a generic message without leaking parser internals:

```json
{
  "errors": [
    {
      "code": "invalid_json",
      "detail": "request body is not valid JSON"
    }
  ]
}
```

### 404 Not Found

```json
{
  "errors": [
    {
      "code": "not_found",
      "detail": "product not found"
    }
  ]
}
```

### 422 Business Logic Errors

Some endpoints return controlled business error messages. These are intentional and safe:

```json
{
  "errors": [
    {
      "code": "code_invalid",
      "detail": "discount code is not valid"
    }
  ]
}
```

Examples include discount code validation (`code_invalid`, `max_uses_reached`) and order status transitions (`invalid_transition`).

## Bulk Operations

Bulk endpoints (e.g. `POST /api/v1/admin/products/bulk`) return per-item results with generic error messages:

```json
{
  "data": {
    "total": 3,
    "succeeded": 2,
    "failed": 1,
    "results": [
      { "index": 0, "success": true, "id": "..." },
      { "index": 1, "success": false, "errors": ["failed to create product"] },
      { "index": 2, "success": true, "id": "..." }
    ]
  }
}
```

Item-level errors use generic messages like `"failed to create product"` or `"failed to resolve options"`. Detailed errors are logged server-side.

## Debugging Errors

1. Note the `X-Request-ID` header from the error response
2. Search server logs for that request ID
3. The log entry contains the full error, HTTP method, and path

```bash
# Example log output (structured JSON via zerolog):
{"level":"error","error":"pq: duplicate key value violates unique constraint \"products_sku_key\"","request_id":"abc-123","method":"POST","path":"/api/v1/admin/products","message":"internal server error"}
```
