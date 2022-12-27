import { Test, TestingModule } from "@nestjs/testing";
import { RenderController } from "./render.controller";

describe("RenderController", () => {
    let renderController: RenderController;

    beforeEach(async () => {
        const app: TestingModule = await Test.createTestingModule({
            controllers: [RenderController],
            providers: [],
        }).compile();

        renderController = app.get<RenderController>(RenderController);
    });

    describe("root", () => {
        it('should return "Hello World!"', () => {
            expect("Hello World!").toBe("Hello World!");
        });
    });
});
