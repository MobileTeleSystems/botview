# Microservice for prerendering web pages.

Web pages that are rendered on the browser side and made without SSR are not seen by bots. Because bots can't render pages. This microservice allows all bots to see the already rendered page.

Features:
- Allows bots to see content on web pages without SSR
- Works on any framework, ex: JQuery, Angular 1, StencilJS and others
- Works on any technologies, ex: WebComponents, Microfrontends, Dynamic Content and others
- Fast speed and low memory usage, inside only web engine without heavy browser
- The prerender can work not only for bots but also for all clients if the application supports rerendering
- Includes exporter of metrics for Prometheus

## Try

To try the microservice features, run the container with the command:

```sh
docker run -it --rm -p 3000:3000 mtsrus/botview
```

Now you can open the browser and check the work with the command:

```sh
http://localhost:3000/render/https://labeg.ru/
```

The fully rendered page should display, including all content..

## Use

To start the microservice in production, use the command:

```sh
docker run -d --restart always -p 3000:3000 mtsrus/botview
```

## Return status code

Add the following element to your html and specify the required response status code:

```html
<meta name="prerender-status" content="301" />
```

The server will return a response with the specified status code.

## Container parameters

- `-e BOTVIEW_BASIC_AUTHS="https%3A%2F%2Ftb.mts.ru%2F"` - an array of endpoints with basic authorization parameters, default empty.
    Has format encodeURIComponent("url"):encodeURIComponent("login"):encodeURIComponent("password"). Use comma as separator.

- `-e BOTVIEW_NAV_TIMEOUT=30000` - [This setting will change the default maximum navigation time](https://pptr.dev/api/puppeteer.page.setdefaultnavigationtimeout),
    default 30000.

- `-e BOTVIEW_DEFAULT_TIMEOUT=15000` - [This setting will change the default timeout](https://pptr.dev/api/puppeteer.page.setdefaulttimeout),
    default 15000.

- `-e BOTVIEW_WAIT_UNTIL=networkidle0` - [When to consider waiting succeeds. Given an array of event strings, waiting is considered to be successful after all events have been fired](https://pptr.dev/api/puppeteer.waitforoptions),
    default networkidle0.

## Metrics Prometheus

The microservice has built-in Prometheus monitoring and is located on the endpoint `/metrics`.

Block this endpoint on the proxy if you do not need to provide access to metrics from outside your network.

## Proxy server setup

In order to catch bots and send them to the prerendering microservice, you need to configure a proxy server.

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
