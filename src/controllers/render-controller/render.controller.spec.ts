/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException } from "@nestjs/common";
import { Response } from "express";
import { RenderController } from "./render.controller";
import { PrerenderService } from "../../services/prerender.service";

interface MockRequest {
    url: string;
    headers: Record<string, string>;
}

describe("RenderController", () => {
    let renderController: RenderController;
    let mockResponse: Partial<Response>;
    let mockRender: jest.Mock;

    beforeEach(async () => {
        mockRender = jest.fn();
        const mockPrerenderService = {
            render: mockRender,
        };

        mockResponse = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
        };

        const app: TestingModule = await Test.createTestingModule({
            controllers: [RenderController],
            providers: [
                {
                    provide: PrerenderService,
                    useValue: mockPrerenderService,
                },
            ],
        }).compile();

        renderController = app.get<RenderController>(RenderController);
    });

    describe("getRender", () => {
        it("should successfully render a valid URL", async () => {
            const mockRequest: MockRequest = {
                url: "/render/https://example.com",
                headers: { "user-agent": "test-agent" },
            };

            const mockResult = {
                statusCode: "200",
                pageContent: "<html><body>Test Content</body></html>",
            };

            mockRender.mockResolvedValue(mockResult);

            await renderController.getRender(
                mockRequest as any,
                mockResponse as Response,
            );

            expect(mockRender).toHaveBeenCalledWith(
                "https://example.com",
                mockRequest.headers,
            );
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.send).toHaveBeenCalledWith(
                mockResult.pageContent,
            );
        });

        it("should throw BadRequestException when URL is empty", async () => {
            const mockRequest: MockRequest = {
                url: "/render/",
                headers: { "user-agent": "test-agent" },
            };

            await expect(
                renderController.getRender(
                    mockRequest as any,
                    mockResponse as Response,
                ),
            ).rejects.toThrow(BadRequestException);
            await expect(
                renderController.getRender(
                    mockRequest as any,
                    mockResponse as Response,
                ),
            ).rejects.toThrow("Parameter 'url' is required.");
        });

        it("should throw BadRequestException when URL is missing", async () => {
            const mockRequest: MockRequest = {
                url: "/render",
                headers: { "user-agent": "test-agent" },
            };

            await expect(
                renderController.getRender(
                    mockRequest as any,
                    mockResponse as Response,
                ),
            ).rejects.toThrow(BadRequestException);
        });

        it("should handle URL decoding properly", async () => {
            const encodedUrl = encodeURIComponent(
                "https://example.com/path with spaces",
            );
            const mockRequest: MockRequest = {
                url: `/render/${encodedUrl}`,
                headers: { "user-agent": "test-agent" },
            };

            const mockResult = {
                statusCode: "200",
                pageContent: "<html><body>Test Content</body></html>",
            };

            mockRender.mockResolvedValue(mockResult);

            await renderController.getRender(
                mockRequest as any,
                mockResponse as Response,
            );

            expect(mockRender).toHaveBeenCalledWith(
                "https://example.com/path with spaces",
                mockRequest.headers,
            );
        });

        it("should handle invalid URL formats", async () => {
            const mockRequest: MockRequest = {
                url: "/render/not-a-valid-url",
                headers: { "user-agent": "test-agent" },
            };

            mockRender.mockRejectedValue(new Error("Invalid URL"));

            await expect(
                renderController.getRender(
                    mockRequest as any,
                    mockResponse as Response,
                ),
            ).rejects.toThrow("Invalid URL");
        });

        it("should handle prerender service errors", async () => {
            const mockRequest: MockRequest = {
                url: "/render/https://example.com",
                headers: { "user-agent": "test-agent" },
            };

            mockRender.mockRejectedValue(new Error("Navigation timeout"));

            await expect(
                renderController.getRender(
                    mockRequest as any,
                    mockResponse as Response,
                ),
            ).rejects.toThrow("Navigation timeout");
        });

        it("should use default status code 200 when statusCode is null", async () => {
            const mockRequest: MockRequest = {
                url: "/render/https://example.com",
                headers: { "user-agent": "test-agent" },
            };

            const mockResult = {
                statusCode: null,
                pageContent: "<html><body>Test Content</body></html>",
            };

            mockRender.mockResolvedValue(mockResult);

            await renderController.getRender(
                mockRequest as any,
                mockResponse as Response,
            );

            expect(mockResponse.status).toHaveBeenCalledWith(200);
        });

        it("should use default status code 200 when statusCode is invalid", async () => {
            const mockRequest: MockRequest = {
                url: "/render/https://example.com",
                headers: { "user-agent": "test-agent" },
            };

            const mockResult = {
                statusCode: "invalid",
                pageContent: "<html><body>Test Content</body></html>",
            };

            mockRender.mockResolvedValue(mockResult);

            await renderController.getRender(
                mockRequest as any,
                mockResponse as Response,
            );

            expect(mockResponse.status).toHaveBeenCalledWith(200);
        });

        it("should handle custom status codes", async () => {
            const mockRequest: MockRequest = {
                url: "/render/https://example.com",
                headers: { "user-agent": "test-agent" },
            };

            const mockResult = {
                statusCode: "404",
                pageContent: "<html><body>Not Found</body></html>",
            };

            mockRender.mockResolvedValue(mockResult);

            await renderController.getRender(
                mockRequest as any,
                mockResponse as Response,
            );

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.send).toHaveBeenCalledWith(
                mockResult.pageContent,
            );
        });
    });
});
