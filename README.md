# 🤖 Botview

[![Release](https://img.shields.io/github/v/release/MobileTeleSystems/botview?style=flat-square)](https://github.com/MobileTeleSystems/botview/releases)
[![Docker Pulls](https://img.shields.io/docker/pulls/mtsrus/botview?style=flat-square)](https://hub.docker.com/r/mtsrus/botview)
[![License](https://img.shields.io/github/license/MobileTeleSystems/botview?style=flat-square)](LICENSE)
[![NestJS](https://img.shields.io/badge/NestJS-11.x-ea2845?style=flat-square&logo=nestjs)](https://nestjs.com/)
[![Playwright](https://img.shields.io/badge/Playwright-1.56-45ba4b?style=flat-square&logo=playwright)](https://playwright.dev/)

**High-performance prerendering microservice for Single Page Applications (SPA)**

Botview makes your client-side rendered web applications visible to search engine crawlers and social media bots by providing fully rendered HTML content. Built with [NestJS](https://nestjs.com/) and [Playwright](https://playwright.dev/), it delivers fast, reliable prerendering with minimal resource usage.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔍 **SEO Optimization** | Makes SPA content visible to search engine crawlers (Google, Bing, Yandex, etc.) |
| 📱 **Social Media Ready** | Enables proper link previews for Facebook, Twitter, Telegram, and other platforms |
| 🚀 **Framework Agnostic** | Works with React, Vue, Angular, Svelte, jQuery, StencilJS, and any JavaScript framework |
| ⚡ **High Performance** | Lightweight Chromium engine with configurable resource blocking |
| 🔒 **Basic Auth Support** | Prerender pages behind HTTP Basic Authentication |
| 📊 **Prometheus Metrics** | Built-in monitoring with `/metrics` endpoint |
| 🎯 **Custom Status Codes** | Control HTTP response codes via meta tags |
| 🐳 **Docker Ready** | Production-ready container with multi-stage build |

---

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [API Reference](#-api-reference)
- [Configuration](#-configuration)
- [Performance Optimization](#-performance-optimization)
- [Monitoring](#-monitoring)
- [Proxy Setup](#-proxy-setup)
- [Troubleshooting](#-troubleshooting)
- [Development](#-development)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🚀 Quick Start

### Using Docker (Recommended)

```bash
# Run in foreground (for testing)
docker run -it --rm -p 3000:3000 mtsrus/botview

# Run in background (for production)
docker run -d --restart always -p 3000:3000 --name botview mtsrus/botview
```

### Test the Service

Open your browser or use curl:

```bash
curl http://localhost:3000/render/https://example.com/
```

The response will contain the fully rendered HTML of the target page.

---

## 📖 API Reference

### Render Endpoint

```
GET /render/{url}
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `url` | string | URL-encoded target page to render |

**Example:**

```bash
# Render a page
curl http://localhost:3000/render/https://spa-website.com/products

# URL with query parameters (must be URL-encoded)
curl "http://localhost:3000/render/https://spa-website.com/search?q=test"
```

**Response:**
- Content-Type: `text/html`
- Status Code: `200` (or custom via meta tag)

### Custom Status Codes

Add a meta tag to your HTML to control the response status code:

```html
<head>
  <!-- Return 301 redirect status -->
  <meta name="prerender-status" content="301" />

  <!-- Return 404 not found -->
  <meta name="prerender-status" content="404" />
</head>
```

### Metrics Endpoint

```
GET /metrics
```

Returns Prometheus-formatted metrics for monitoring.

---

## ⚙️ Configuration

All configuration is done via environment variables:

### Timeout Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `BOTVIEW_NAV_TIMEOUT` | `30000` | Maximum navigation timeout in milliseconds ([docs](https://playwright.dev/docs/api/class-page#page-set-default-navigation-timeout)) |
| `BOTVIEW_DEFAULT_TIMEOUT` | `15000` | Default timeout for page operations in milliseconds ([docs](https://playwright.dev/docs/api/class-page#page-set-default-timeout)) |
| `BOTVIEW_WAIT_UNTIL` | `networkidle` | Wait condition: `load`, `domcontentloaded`, `networkidle`, or `commit` ([docs](https://playwright.dev/docs/api/class-page#page-goto)) |

### Viewport Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `BOTVIEW_VIEWPORT` | `360x640` | Browser viewport size in `WIDTHxHEIGHT` format |

**Example:**

```bash
docker run -d -p 3000:3000 \
  -e BOTVIEW_VIEWPORT="1920x1080" \
  mtsrus/botview
```

### Resource Blocking

Improve performance by blocking unnecessary resources:

| Variable | Default | Description |
|----------|---------|-------------|
| `BOTVIEW_BLOCK_IMAGES` | `true` | Block image loading |
| `BOTVIEW_BLOCK_STYLESHEETS` | `true` | Block CSS loading |
| `BOTVIEW_BLOCK_FONTS` | `true` | Block font loading |
| `BOTVIEW_BLOCK_MEDIA` | `true` | Block audio/video loading |
| `BOTVIEW_BLOCK_URLS` | `https://an.yandex.ru, https://mc.yandex.ru` | URL prefixes to block (comma/space separated) |
| `BOTVIEW_BLOCK_URLS_REGEX` | `` | Regex patterns to block URLs (comma/space separated) |

**Example:**

```bash
docker run -d -p 3000:3000 \
  -e BOTVIEW_BLOCK_URLS="https://google-analytics.com,https://facebook.com/tr" \
  -e BOTVIEW_BLOCK_URLS_REGEX=".*\.ads\..*,.*tracking.*" \
  mtsrus/botview
```

### Authentication

| Variable | Default | Description |
|----------|---------|-------------|
| `BOTVIEW_BASIC_AUTHS` | `` | HTTP Basic Auth credentials |

Format: `url:username:password` (comma or space separated for multiple entries)

```bash
docker run -d -p 3000:3000 \
  -e BOTVIEW_BASIC_AUTHS="https://protected.example.com:admin:secret123" \
  mtsrus/botview
```

### Logging

| Variable | Default | Description |
|----------|---------|-------------|
| `BOTVIEW_LOG_LEVEL` | `info` | Log verbosity: `trace`, `debug`, `info`, `warn`, `error`, `fatal` |

---

## 🚀 Performance Optimization

### Default Optimizations

Botview comes pre-configured for optimal performance:

- ✅ Images blocked (reduces bandwidth)
- ✅ Stylesheets blocked (not needed for SEO)
- ✅ Fonts blocked (reduces requests)
- ✅ Media files blocked (reduces load time)
- ✅ Yandex analytics blocked (prevents timeout issues)

### Custom Blocking Rules

Block specific URLs causing slowdowns:

```bash
# Block by URL prefix
-e BOTVIEW_BLOCK_URLS="https://slow-cdn.com,https://heavy-analytics.com"

# Block by regex pattern
-e BOTVIEW_BLOCK_URLS_REGEX=".*facebook.*widget.*,.*twitter.*embed.*"
```

### Recommended Production Settings

```bash
docker run -d --restart always -p 3000:3000 \
  --memory="512m" \
  --cpus="1" \
  -e BOTVIEW_NAV_TIMEOUT=20000 \
  -e BOTVIEW_DEFAULT_TIMEOUT=10000 \
  -e BOTVIEW_LOG_LEVEL=warn \
  --name botview \
  mtsrus/botview
```

---

## 📊 Monitoring

### Prometheus Metrics

Access metrics at `http://localhost:3000/metrics`:

```bash
curl http://localhost:3000/metrics
```

Available metrics include:
- Node.js process metrics (memory, CPU, event loop)
- HTTP request metrics
- Garbage collection metrics

### Prometheus Configuration

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'botview'
    static_configs:
      - targets: ['botview:3000']
    metrics_path: '/metrics'
```

### Security Note

Block the `/metrics` endpoint from external access in production:

```nginx
location /metrics {
    deny all;
    # or allow only internal IPs
    # allow 10.0.0.0/8;
    # deny all;
}
```

---

## 🔧 Proxy Setup

Configure your reverse proxy to route bot traffic to Botview.

### Nginx Configuration

```nginx
location / {
    set $prerender 0;

    # Detect search engine and social media bots
    if ($http_user_agent ~* "googlebot|bingbot|yandex|baiduspider|facebookexternalhit|twitterbot|telegrambot|linkedinbot|whatsapp|slackbot|discordbot|pinterest|applebot") {
        set $prerender 1;
    }

    # Support for escaped fragment (legacy)
    if ($args ~ "_escaped_fragment_") {
        set $prerender 1;
    }

    # Don't prerender for Botview's own requests
    if ($http_user_agent ~ "Prerender") {
        set $prerender 0;
    }

    # Don't prerender static files
    if ($uri ~ "\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|pdf|zip)$") {
        set $prerender 0;
    }

    # Route to Botview for bots
    if ($prerender = 1) {
        rewrite (.*) /render/$scheme://$host$1 break;
        proxy_pass http://botview:3000;
    }

    # Route to application for regular users
    if ($prerender = 0) {
        proxy_pass http://app:80;
    }
}
```

### Docker Compose Example

```yaml
version: '3.8'
services:
  app:
    image: your-spa-app
    ports:
      - "80:80"

  botview:
    image: mtsrus/botview
    restart: always
    environment:
      - BOTVIEW_LOG_LEVEL=info
    ports:
      - "3000:3000"

  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    ports:
      - "443:443"
    depends_on:
      - app
      - botview
```

---

## 🔍 Troubleshooting

### Timeout Errors

**Symptom:** Requests timeout with "Leaked requests" in logs.

**Cause:** Some network requests don't complete, blocking page load.

**Solution:**

1. Check logs for leaked request URLs:
   ```bash
   docker logs botview | grep "Leaked requests"
   ```

2. Block problematic URLs:
   ```bash
   docker run -d -p 3000:3000 \
     -e BOTVIEW_BLOCK_URLS="https://problematic-url.com" \
     mtsrus/botview
   ```

### Memory Issues

**Solution:** Limit container memory and enable resource blocking:

```bash
docker run -d --memory="512m" \
  -e BOTVIEW_BLOCK_IMAGES=true \
  -e BOTVIEW_BLOCK_STYLESHEETS=true \
  mtsrus/botview
```

### Debug Mode

Enable verbose logging:

```bash
docker run -it --rm -p 3000:3000 \
  -e BOTVIEW_LOG_LEVEL=debug \
  mtsrus/botview
```

---

## 🛠️ Development

### Prerequisites

- Node.js 20+ (LTS recommended)
- npm 10+

### Local Setup

```bash
# Clone repository
git clone https://github.com/MobileTeleSystems/botview.git
cd botview

# Install dependencies
npm install

# Run in development mode
npm run start:dev

# Run tests
npm test

# Run e2e tests
npm run test:e2e

# Build for production
npm run build
```

### Project Structure

```
src/
├── main.ts                          # Application entry point
├── app.module.ts                    # Root NestJS module
├── config.ts                        # Configuration management
├── LogLevels.ts                     # Log level definitions
├── controllers/
│   ├── render-controller/           # Main render endpoint
│   └── metrics/                     # Prometheus metrics endpoint
├── services/
│   ├── prerender.service.ts         # Core prerendering logic
│   └── json-logger.service.ts       # Structured JSON logging
├── middleware/
│   └── RequestLoggerMiddleware.ts   # Request logging
└── models/
    └── LeakedRequests.ts            # Request tracking model
```

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [NestJS](https://nestjs.com/) - Progressive Node.js framework
- [Playwright](https://playwright.dev/) - Reliable browser automation
- [prom-client](https://github.com/siimon/prom-client) - Prometheus client for Node.js

---

Made with ❤️ by [MobileTeleSystems](https://github.com/MobileTeleSystems)
