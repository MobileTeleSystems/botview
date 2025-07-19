import { JsonLogger, LogLevels } from "./json-logger.service";
import { config } from "../config";
import { Injectable } from "@nestjs/common";
import {
    chromium,
    devices,
    Browser,
    Page,
    ConsoleMessage,
    Request,
    BrowserContextOptions,
} from "playwright";
import { LeakedRequests } from "../models/LeakedRequests";

@Injectable()
export class PrerenderService {
    public constructor(private readonly logger: JsonLogger) {}

    public async render(url: string, headers: Headers) {
        const browser: Browser = await chromium.launch({
            headless: false, // for debug
            devtools: true,
            // args: [
            //     '--no-sandbox', '--disable-setuid-sandbox'
            // ],
            timeout: config.navTimeout,
        });

        const authHeaders = this.setAuth(url);
        const context = await browser.newContext({
            ...devices["Galaxy S8"],
            ...authHeaders,
        });

        let requests: LeakedRequests[] = [];

        try {
            const page: Page = await context.newPage();

            await page.addInitScript(
                (data) => {
                    Reflect.set(window, "prerender", data);
                },
                {
                    userAgent: headers["user-agent"] as string,
                },
            );

            page.setDefaultNavigationTimeout(config.navTimeout);
            page.setDefaultTimeout(config.defaultTimeout);
            this.setLogOnConsole(page);

            if (
                config.blockImages ||
                config.blockStylesheets ||
                config.blockFonts ||
                config.blockMedia ||
                config.blockUrls.length > 0 ||
                config.blockUrlsRegex.length > 0
            ) {
                this.setResourceBlocking(page);
            }
            requests = this.setRequestLeakDetector(page);

            await page.goto(url, {
                waitUntil: config.waitUntil as "networkidle",
                timeout: config.navTimeout,
            });
            const pageContent = await page.content(); // serialized HTML of page DOM.

            const statusCode = await page.evaluate(() => {
                return document.head
                    ?.querySelector('meta[name="prerender-status"]')
                    ?.getAttribute("content");
            });

            return {
                statusCode,
                pageContent,
            };
        } catch (error) {
            this.checkAndLogLeakedRequests(requests, error);
            throw error;
        } finally {
            await context.close();
            await browser.close();
        }
    }

    private setAuth(
        url: string,
    ): Pick<BrowserContextOptions, "httpCredentials"> {
        if (config.basicAuthParsed.length > 0) {
            // eslint-disable-next-line prettier/prettier
            for (const [authUrl, username, password] of config.basicAuthParsed) {
                if (url.startsWith(authUrl)) {
                    return {
                        httpCredentials: {
                            username,
                            password,
                        },
                    };
                }
            }
        }

        // No basic auth
        return {};
    }

    private setLogOnConsole(page: Page): void {
        page.on("console", (msg: ConsoleMessage) => {
            let level = 10;
            const type = msg.type();
            if (type === "log") {
                level = 30;
            } else if (type === "debug") {
                level = 20;
            } else if (type === "info") {
                level = 30;
            } else if (type === "error") {
                level = 50;
            } else if (type === "warning") {
                level = 40;
            } else if (type === "trace") {
                level = 10;
            }

            this.logger.extraLogs(`Browser log: ${msg.text()}`, level, {
                location: msg.location() ?? void 0,
                args: msg.args() ?? void 0,
            });
        });
    }

    private setResourceBlocking(page: Page): void {
        void page.route("**/*", async (route) => {
            const resourceType = route.request().resourceType();
            const requestUrl = route.request().url();

            // Block specific URLs if configured
            if (config.blockUrls.length > 0) {
                for (const blockedUrl of config.blockUrls) {
                    if (requestUrl.startsWith(blockedUrl)) {
                        this.logger.debug(
                            `Blocked URL: ${requestUrl} (matches: ${blockedUrl})`,
                        );
                        await route.abort();
                        return;
                    }
                }
            }

            // Block URLs matching regex patterns if configured
            if (config.blockUrlsRegex.length > 0) {
                for (const regex of config.blockUrlsRegex) {
                    if (regex.test(requestUrl)) {
                        this.logger.debug(
                            `Blocked URL by regex: ${requestUrl} (pattern: ${regex.source})`,
                        );
                        await route.abort();
                        return;
                    }
                }
            }

            // Block images if enabled in config
            if (resourceType === "image" && config.blockImages) {
                await route.abort();
                return;
            }

            // Block stylesheets if enabled in config
            if (resourceType === "stylesheet" && config.blockStylesheets) {
                await route.abort();
                return;
            }

            // Block fonts if enabled in config
            if (resourceType === "font" && config.blockFonts) {
                await route.abort();
                return;
            }

            // Block media if enabled in config
            if (resourceType === "media" && config.blockMedia) {
                await route.abort();
                return;
            }

            // Allow all other requests
            await route.continue();
        });
    }

    private setRequestLeakDetector(page: Page): LeakedRequests[] {
        const requests: LeakedRequests[] = [];

        page.on("request", (request: Request) => {
            const leakedRequest = new LeakedRequests();
            leakedRequest.url = request.url();
            leakedRequest.startTime = Date.now();
            requests.push(leakedRequest);
        });

        page.on("requestfinished", (request: Request) => {
            const url = request.url();
            const index = requests.findIndex((lreq) => lreq.url === url);
            requests.splice(index, 1);
        });

        page.on("requestfailed", (request: Request) => {
            const url = request.url();
            const index = requests.findIndex((lreq) => lreq.url === url);
            requests.splice(index, 1);
        });

        return requests;
    }

    private checkAndLogLeakedRequests(
        requests: LeakedRequests[],
        error: unknown,
    ) {
        if (error instanceof Error && error.name.startsWith("TimeoutError")) {
            requests.forEach((lreq) => {
                lreq.endTime = Date.now();
                lreq.time = lreq.endTime - lreq.startTime;
            });
            this.logger.extraLogs(`Leaked requests`, LogLevels.ERROR, {
                requests: requests,
            });
        }
    }
}
