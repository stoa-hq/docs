# Self-Hosting

Stoa is designed to run behind a reverse proxy. **Never expose Stoa directly to the internet** — always place nginx, Caddy, or a similar reverse proxy in front of it to handle TLS termination and request filtering.

## Prerequisites

- Linux server (Ubuntu 22.04+, Debian 12+, or similar)
- Docker and Docker Compose **or** Go 1.23+ (to run the binary directly)
- PostgreSQL 16+
- A reverse proxy — [Caddy](#reverse-proxy-with-caddy) (easiest) or [nginx](#reverse-proxy-with-nginx)
- A domain with DNS pointing to your server

## Starting Stoa

For the initial setup (cloning, database migrations, admin user), follow the [Quick Start](/guide/quick-start). The steps below cover the production-specific configuration.

### Docker Compose (recommended)

```bash
git clone https://github.com/stoa-hq/stoa.git
cd stoa
cp config.example.yaml config.yaml
```

Edit `config.yaml` for production — see [Production Settings](#production-settings) below — then start:

```bash
docker compose up -d
docker compose exec stoa ./stoa migrate up
docker compose exec stoa ./stoa admin create --email admin@example.com --password your-secure-password
```

### Binary

```bash
# Build (requires Go 1.23+, Node.js 20+)
make build

# Configure
cp config.example.yaml config.yaml
# Edit config.yaml for production — see below

# Start
./stoa migrate up
./stoa admin create --email admin@example.com --password your-secure-password
./stoa serve
```

### Essential Production Config

At minimum, set the following in your `config.yaml`:

```yaml
server:
  host: "127.0.0.1"          # Bind to localhost only — the reverse proxy handles public traffic
  port: 8080
  cors:
    allowed_origins:
      - "https://your-domain.com"

security:
  csrf:
    secure: true              # Secure flag on CSRF cookie (required behind HTTPS)

auth:
  jwt_secret: "generate-a-64-char-random-string"  # openssl rand -hex 32

payment:
  encryption_key: "generate-a-32-byte-key"         # openssl rand -hex 16
```

::: tip Generate Secrets
```bash
# JWT secret (64 hex characters)
openssl rand -hex 32

# Payment encryption key (32 hex characters)
openssl rand -hex 16
```
:::

## Reverse Proxy with Caddy

Caddy is the simplest option — it automatically obtains and renews TLS certificates via Let's Encrypt.

### Install Caddy

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```

### Caddyfile

Create `/etc/caddy/Caddyfile`:

```caddyfile
your-domain.com {
    reverse_proxy localhost:8080 {
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-For {remote_host}
        header_up X-Forwarded-Proto {scheme}
    }
}
```

That's it. Caddy will automatically obtain a TLS certificate from Let's Encrypt and handle HTTPS.

```bash
sudo systemctl reload caddy
```

## Reverse Proxy with nginx

### Install nginx and Certbot

```bash
sudo apt install nginx certbot python3-certbot-nginx
```

### Obtain a TLS Certificate

```bash
sudo certbot --nginx -d your-domain.com
```

### nginx Configuration

Create `/etc/nginx/sites-available/stoa`:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate     /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    # Match Stoa's max_upload_size (default 35 MiB)
    client_max_body_size 35m;

    location / {
        proxy_pass http://127.0.0.1:8080;

        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Request-ID      $request_id;

        # WebSocket support (if needed)
        proxy_http_version 1.1;
        proxy_set_header Upgrade    $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Enable the site and reload:

```bash
sudo ln -s /etc/nginx/sites-available/stoa /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

::: tip Upload Limit
Set `client_max_body_size` to match Stoa's `server.max_upload_size` config (default: 35 MiB). If you increase the upload limit in Stoa, update nginx accordingly.
:::

## Production Settings

| Setting | Value | Purpose |
|---------|-------|---------|
| `server.host` | `127.0.0.1` | Bind to localhost only — prevents direct internet access |
| `server.cors.allowed_origins` | `["https://your-domain.com"]` | Restrict CORS to your domain |
| `security.csrf.secure` | `true` | Set `Secure` flag on `csrf_token` cookie (required for HTTPS) |
| `security.rate_limit.requests_per_minute` | `300` (default) | Per-IP rate limiting — requires correct proxy headers |
| `security.rate_limit.burst` | `50` (default) | Burst allowance for rate limiter |
| `auth.jwt_secret` | Random 64-char hex | JWT signing secret — **must** be unique per deployment |
| `payment.encryption_key` | Random 32-char hex | AES encryption key for payment data |

See [Configuration](/guide/configuration) for the full reference.

::: warning Rate Limiting and Proxy Headers
Stoa's rate limiter identifies clients by IP address, reading from `X-Real-IP` → `X-Forwarded-For` (first IP) → `RemoteAddr`, in that order. Without correct proxy headers, **all requests appear to come from the proxy's IP**, and your entire site will be rate-limited as a single client. Always configure your reverse proxy to forward the real client IP.
:::

## Security Checklist

Before going live, verify each item:

- [ ] **Reverse proxy** in front of Stoa (Caddy or nginx)
- [ ] **TLS** enabled with valid certificate (Let's Encrypt or similar)
- [ ] **Stoa binds to localhost** (`server.host: 127.0.0.1`)
- [ ] **CSRF cookie is secure** (`security.csrf.secure: true`)
- [ ] **Unique secrets** generated for `auth.jwt_secret` and `payment.encryption_key`
- [ ] **CORS origins** restricted to your domain(s)
- [ ] **Firewall** configured — only ports 80 and 443 open to the internet
- [ ] **Database** not exposed to the internet (bind to localhost or private network)
- [ ] **Backups** configured for PostgreSQL (pg_dump or continuous archiving)
- [ ] **Proxy headers** forwarding real client IP (`X-Real-IP`, `X-Forwarded-For`)
