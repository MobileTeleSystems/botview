import * as puppeteer from "puppeteer";
import { ConsoleMessage, PuppeteerLifeCycleEvent } from "puppeteer";
import { JsonLogger, LogLevels } from "./json-logger.service";
import { config } from "../config";
import { Injectable } from "@nestjs/common";
import { LeakedRequests } from "../models/LeakedRequests";

@Injectable()
export class PrerenderService {
    public constructor(private readonly logger: JsonLogger) {}

    public async render(url: string, headers: Headers) {
        const browser = await puppeteer.launch({
            headless: true,
            args: ["--no-sandbox"],
            timeout: config.navTimeout,
        });
        let requests: LeakedRequests[] = [];

        try {
            const page = await browser.newPage();
            await page.setViewport({ width: 360, height: 640 });
            await page.setCacheEnabled(false); // resolve bug: https://github.com/puppeteer/puppeteer/issues/7475
            await page.evaluateOnNewDocument(
                (data) => {
                    Reflect.set(window, "prerender", data);
                },
                {
                    userAgent: headers["user-agent"],
                },
            );

            page.setDefaultNavigationTimeout(config.navTimeout);
            page.setDefaultTimeout(config.defaultTimeout);
            this.setAuth(page, url);
            this.setLogOnConsole(page);
            requests = await this.setRequestLeakDetector(page);

            await page.goto(url, {
                waitUntil: config.waitUntil as PuppeteerLifeCycleEvent,
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
            await browser.close();
        }
    }

    private async setAuth(page: puppeteer.Page, url: string): Promise<void> {
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
                    await page.authenticate({
                        username: auth[1],
                        password: auth[2],
                    });
                    break;
                }
            }
        }
    }

    private setLogOnConsole(page: puppeteer.Page): void {
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
            } else if (type === "warn") {
                level = 40;
            } else if (type === "verbose") {
                level = 10;
            }

            this.logger.extraLogs(`Browser log: ${msg.text()}`, level, {
                stack: msg.stackTrace() ?? void 0,
                location: msg.location() ?? void 0,
                args: msg.args() ?? void 0,
            });
        });
    }

    private async setRequestLeakDetector(
        page: puppeteer.Page,
    ): Promise<LeakedRequests[]> {
        const requests: LeakedRequests[] = [];
        await page.setRequestInterception(true);

        page.on("request", (request: puppeteer.HTTPRequest) => {
            const leakedRequest = new LeakedRequests();
            leakedRequest.url = request.url();
            leakedRequest.startTime = Date.now();
            requests.push(leakedRequest);
            request.continue();
        });

        page.on("requestfinished", (request: puppeteer.HTTPRequest) => {
            const url = request.url();
            const index = requests.findIndex((lreq) => lreq.url === url);
            requests.splice(index, 1);
        });

        page.on("requestfailed", (request: puppeteer.HTTPRequest) => {
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
        if (
            error instanceof Error &&
            error.message.startsWith("Navigation timeout")
        ) {
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
