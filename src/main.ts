process.env.BASIC_AUTHS ||= void 0; // array of basic auths in format encodeURIComponent("url"):login:password, use comma as separator

import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { JsonLogger } from "./services/json-logger.service";

// init app
async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        logger: new JsonLogger(),
    });
    await app.listen(3000);
}
bootstrap();
