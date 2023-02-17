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

@Controller("render")
export class RenderController {
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
            await page.goto(url, { waitUntil: "networkidle0" });
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
