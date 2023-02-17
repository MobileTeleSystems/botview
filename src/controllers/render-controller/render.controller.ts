import {
    BadRequestException,
    Controller,
    Get,
    Header,
    Request,
    Response,
} from "@nestjs/common";
import * as puppeteer from "puppeteer";
import { Response as EResponse } from "express";
import { ConsoleMessage } from "puppeteer";
import { JsonLogger } from "../../services/json-logger.service";

@Controller("render")
export class RenderController {
    public constructor(private readonly logger: JsonLogger) {}

    /**
     * http://localhost:3000/render/https://tb.mts.ru/
     */
    @Get("*")
    @Header("Content-Type", "text/html")
    public async getRender(
        @Request() reguest: Request,
        @Response() response: EResponse,
    ): Promise<void> {
        const url = decodeURIComponent(reguest.url.substr(8));

        if (!url) {
            throw new BadRequestException("Parameter 'url' is required.");
        }

        const browser = await puppeteer.launch({
            headless: true,
            args: [
                "--no-sandbox",
                "--disable-dev-shm-usage",
                "--disable-gpu",
                "--single-process",
                "--no-zygote",
            ],
        });

        try {
            const page = await browser.newPage();
            await page.setViewport({ width: 360, height: 640 });
            await page.evaluateOnNewDocument(
                (data) => {
                    Reflect.set(window, "prerender", data);
                },
                {
                    userAgent: reguest.headers["user-agent"],
                },
            );

            this.setAuth(url, page);

            await page.setDefaultNavigationTimeout(30000);
            await page.setDefaultTimeout(15000);
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
                } else if (type === "verbose") {
                    level = 10;
                }

                this.logger.extraLogs(`Browser log: ${msg.text()}`, level, {
                    stack: msg.stackTrace() ?? void 0,
                    location: msg.location() ?? void 0,
                    args: msg.args() ?? void 0,
                });
            });

            await page.goto(url, { waitUntil: "networkidle0", timeout: 35000 });
            const pageContent = await page.content(); // serialized HTML of page DOM.

            const statusCode = await page.evaluate(() => {
                return document.head
                    ?.querySelector('meta[name="prerender-status"]')
                    ?.getAttribute("content");
            });

            response
                .status(Number.parseInt(statusCode) || 200)
                .send(pageContent);
        } catch (error) {
            throw error;
        } finally {
            await browser.close();
        }
    }

    private async setAuth(url: string, page: puppeteer.Page): Promise<void> {
        if (process.env.BASIC_AUTHS) {
            // Url, login, password
            const basicAuths: [string, string, string][] =
                process.env.BASIC_AUTHS.split(",").map((auth: string) => {
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
}
