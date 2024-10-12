import {
    BadRequestException,
    Controller,
    Get,
    Header,
    Request,
    Response,
} from "@nestjs/common";
import { Response as EResponse } from "express";
import { PrerenderService } from "../../services/prerender.service";

@Controller("render")
export class RenderController {
    public constructor(private readonly prerenderService: PrerenderService) {}

    /**
     * http://localhost:3000/render/https://mts.ru/
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

        const result = await this.prerenderService.render(url, reguest.headers);

        response
            .status(Number.parseInt(result.statusCode) || 200)
            .send(result.pageContent);
    }
}
