# Microservice for prerendering web pages

Web pages rendered on the client side without SSR are not visible to bots, because bots can't render pages. This microservice allows all bots to see the already rendered page.

Features:

- Allows bots to see content on web pages without SSR
- Works with any framework, e.g. JQuery, Angular 1, StencilJS, and others
- Works with any technology, e.g. WebComponents, Microfrontends, Dynamic Content, and others
- Fast and low memory usage, uses only a web engine without a heavy browser
- Prerendering can work not only for bots but also for all clients if the application supports rerendering
- Includes a Prometheus metrics exporter

## Try

To try the microservice features, run the container with the command:

```sh
docker run -it --rm -p 3000:3000 mtsrus/botview
```

Now you can open the browser and check the result with the command:

```sh
http://localhost:3000/render/https://mts.ru/
```

The fully rendered page should be displayed, including all content.

## Use

To start the microservice in production, use the command:

```sh
docker run -d --restart always -p 3000:3000 mtsrus/botview
```

## Return status code

Add the following element to your HTML and specify the required response status code:

```html
<meta name="prerender-status" content="301" />
```

The server will return a response with the specified status code.

## Container parameters


- `-e BOTVIEW_BASIC_AUTHS=""` - An array of endpoints with basic authorization parameters, default is empty.
    Format: "url:login:password" (URL-encoding is optional for simple URLs). Use comma or space as a separator.
    Example: `"https://example.com:user:pass,https://test.com:admin:secret"`

- `-e BOTVIEW_NAV_TIMEOUT=30000` - [This setting will change the default maximum navigation time](https://playwright.dev/docs/api/class-page#page-set-default-navigation-timeout),
    default 30000.

- `-e BOTVIEW_DEFAULT_TIMEOUT=15000` - [This setting will change the default timeout](https://playwright.dev/docs/api/class-page#page-set-default-timeout),
    default 15000.

- `-e BOTVIEW_WAIT_UNTIL=networkidle` - [When to consider waiting succeeds. Given an array of event strings, waiting is considered to be successful after all events have been fired](https://playwright.dev/docs/api/class-page#page-goto),
    default networkidle.

- `-e BOTVIEW_VIEWPORT="360x640"` - Set the screen resolution (viewport) for the browser context, format is WIDTHxHEIGHT (e.g. `1280x720`). Default is `360x640`.
  Example: `-e BOTVIEW_VIEWPORT="1280x720"`

- `-e BOTVIEW_BLOCK_IMAGES=true` - Block loading of images to improve performance, default true.

- `-e BOTVIEW_BLOCK_STYLESHEETS=true` - Block loading of stylesheets to improve performance, default true.

- `-e BOTVIEW_BLOCK_FONTS=true` - Block loading of fonts to improve performance, default true.

- `-e BOTVIEW_BLOCK_MEDIA=true` - Block loading of media files to improve performance, default true.

- `-e BOTVIEW_BLOCK_URLS="https://an.yandex.ru, https://mc.yandex.ru"` - Comma or space separated list of URL prefixes to block (uses startsWith matching), by default blocks Yandex analytics.
  Example: `"https://google-analytics.com,https://facebook.com/tr"` will block all requests starting with these URLs.
  Set to an empty string `""` to disable default blocking.

- `-e BOTVIEW_BLOCK_URLS_REGEX=""` - Comma or space separated list of regular expressions to block URLs, default is empty.
  Example: `".*\.ads\..*,.*tracking.*"` will block URLs containing ".ads." or "tracking" anywhere in the URL.

- `-e BOTVIEW_LOG_LEVEL=info` - Log level for the application, default "info".
  Available levels: `trace`, `debug`, `info`, `warn`, `error`, `fatal`.

## Troubleshooting Timeout Issues

If you encounter timeout errors during prerendering, it is usually caused by "leaked requests" - network requests that do not complete properly and prevent the page from finishing loading.

To fix this:

1. **Check the logs** for entries containing `"Leaked requests"` - these will show which URLs are causing the timeout
2. **Add problematic URLs to BOTVIEW_BLOCK_URLS** to prevent them from being loaded during prerendering.
3. **Use the container parameter** `-e BOTVIEW_BLOCK_URLS="url1,url2,url3"` to block specific URLs.

**Example:**

```sh
docker run -d -p 3000:3000 -e BOTVIEW_BLOCK_URLS="https://problematic-analytics.com,https://slow-tracker.net" mtsrus/botview
```

**Default blocked URLs:**
By default, `https://an.yandex.ru` and `https://mc.yandex.ru` are blocked due to a Chromium bug that prevents proper handling of these analytics requests, which can cause timeouts.

## Metrics Prometheus

The microservice has built-in Prometheus monitoring and is available at the endpoint `/metrics`.

Block this endpoint on the proxy if you do not need to provide access to metrics from outside your network.

## Proxy server setup

To catch bots and send them to the prerendering microservice, you need to configure a proxy server.

Example config for Nginx:

```sh
location / {

    set $prerender 0;

    # all popular bots
    if ($http_user_agent ~* "googlebot|facebookexternalhit|twitterbot|telegrambot|yahoo|bingbot|baiduspider|yandex|yeti|yodaobot|gigabot|ia_archiver|developers\.google\.com") {
        set $prerender 1;
    }

    # bot with escape fragments
    if ($args ~ "_escaped_fragment_") {
        set $prerender 1;
    }

    # prerender microservice
    if ($http_user_agent ~ "Prerender") {
        set $prerender 0;
    }

    # static files
    if ($uri ~ \.[a-zA-Z0-9]+$) {
        set $prerender 0;
    }

    if ($prerender = 1) {
        rewrite (.*) /render/$scheme://$host$1?prerender break;
        proxy_pass http://localhost:3000;
    }

    if ($prerender = 0) {
        proxy_pass http://localhost:80;
    }
}
```
