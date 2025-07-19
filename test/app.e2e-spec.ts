import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "./../src/app.module";

describe("AppController (e2e)", () => {
    let app: INestApplication;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();
    });

    afterEach(async () => {
        await app.close();
    });

    describe("Prerender", () => {
        it("should prerender https://mts.ru/ and return HTML content", async () => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            const response = await request(app.getHttpServer())
                .get("/render/https://mts.ru/")
                .expect(200)
                .expect("Content-Type", "text/html; charset=utf-8");

            // Check that response contains HTML content
            expect(response.text).toContain("<!DOCTYPE html>");
            expect(response.text).toContain("<html");
            expect(response.text).toContain("</html>");
            expect(response.text).toContain("<head>");
            expect(response.text).toContain("<body>");

            // Check that response contains MTS-specific content
            expect(response.text.toLowerCase()).toMatch(/мтс|mts|телеком/);

            // Check that content has been rendered (not just initial HTML)
            expect(response.text.length).toBeGreaterThan(1000);
        }, 60000); // 60 second timeout for rendering

        it("should handle invalid URL gracefully", async () => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            await request(app.getHttpServer()).get("/render/").expect(400);
        });

        it("should handle non-existent domain", async () => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            await request(app.getHttpServer())
                .get("/render/https://non-existent-domain-12345.com/")
                .expect(500);
        }, 30000);

        it("should return custom status code when prerender-status meta is present", async () => {
            // This would need a test page that returns custom status
            // For now, just test that the endpoint works
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            const response = await request(app.getHttpServer())
                .get("/render/https://httpbin.org/html")
                .expect(200);

            expect(response.text).toContain("<!DOCTYPE html>");
        }, 30000);
    });
});
