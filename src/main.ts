import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import * as morgan from "morgan";

process.env.BASIC_AUTHS ||= void 0; // array of basic auths in format encodeURIComponent("url"):login:password, use comma as separator

// init app
async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.use(morgan("combined"));
    await app.listen(3000);
}
bootstrap();
