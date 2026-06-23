import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>("PORT", 3001);
  const frontendUrl = configService.get<string>("FRONTEND_URL", "http://localhost:3000");

  // Cookie parser — must be before routes so req.cookies is populated
  app.use(cookieParser());

  // CORS
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix("api/v1");

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(port);
  console.log(` TSP API running on http://localhost:${port}/api/v1`);
}

bootstrap();
