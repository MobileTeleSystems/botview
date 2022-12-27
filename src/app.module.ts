import { CacheModule, Module, CacheInterceptor } from "@nestjs/common";
import { RenderController } from "./controllers/render-controller/render.controller";
import { PromModule } from "@digikare/nestjs-prom";
import { APP_INTERCEPTOR } from "@nestjs/core";

@Module({
    imports: [
        CacheModule.register({ max: 100 }),
        // https://github.com/digikare/nestjs-prom
        PromModule.forRoot({
            defaultLabels: {
                app: "rupolka_prerender",
                version: "1.0.0",
            },
            withHttpMiddleware: {
                enable: true,
            },
        }),
    ],
    controllers: [RenderController],
    providers: [
        {
            provide: APP_INTERCEPTOR,
            useClass: CacheInterceptor,
        },
    ],
})
export class AppModule {}
