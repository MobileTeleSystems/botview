import { JsonLogger, LogLevels } from "./json-logger.service";
import { config } from "../config";
import { Injectable } from "@nestjs/common";
import {
    // chromium, // Yandex metrics problems
    webkit,
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
        const browser: Browser = await webkit.launch({
            // headless: false, // for debug
            // devtools: true,
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
        if (config.basicAuth) {
            // Url, login, password
            const basicAuths: [string, string, string][] = config.basicAuth
                .split(",")
                .map((auth: string) => {
                    const parts = auth.trim().split(":");

                    return [decodeURIComponent(parts[0]), parts[1], parts[2]];
                });

            for (const auth of basicAuths) {
                if (url.startsWith(auth[0])) {
                    return {
                        httpCredentials: {
                            username: auth[1],
                            password: auth[2],
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
