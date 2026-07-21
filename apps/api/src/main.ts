import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import cookieParser from "cookie-parser";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Trust one proxy hop (Railway's reverse proxy) so req.ip returns
  // the real client IP from X-Forwarded-For, not the load balancer IP.
  // Required for accurate per-IP rate limiting.
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);

  const configService = app.get(ConfigService);
  const port = configService.get<number>("PORT", 3001);

  const frontendUrl = configService
    .get<string>("FRONTEND_URL", "http://localhost:3000")
    .replace(/\/$/, "");

  app.use(cookieParser());

  app.enableCors({
    origin: [frontendUrl, "http://localhost:3000"],
    credentials: true,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With"],
  });

  app.setGlobalPrefix("api/v1");

  const config = new DocumentBuilder()
    .setTitle("TSP API")
    .setDescription("The TSP API documentation")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(port, "0.0.0.0");
  console.log(`TSP API running on http://0.0.0.0:${port}/api/v1`);
}

bootstrap();