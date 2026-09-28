import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import cookieParser from "cookie-parser";
import type { NextFunction, Request, Response } from "express";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  // rawBody: Razorpay webhook signatures are computed over the exact bytes sent.
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // Trust one proxy hop (Railway's reverse proxy) so req.ip returns
  // the real client IP from X-Forwarded-For, not the load balancer IP.
  // Required for accurate per-IP rate limiting.
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);
  expressApp.disable('x-powered-by');

  const configService = app.get(ConfigService);
  const port = configService.get<number>("PORT", 3001);

  const frontendUrl = configService
    .get<string>("FRONTEND_URL", "http://localhost:3000")
    .replace(/\/$/, "");

  app.use(cookieParser());

  // Cross-site request forgery: a browser always sends Origin on a cross-site
  // POST/PUT/PATCH/DELETE, so changes are refused unless they come from our own
  // site. Requests without Origin (server-to-server, Razorpay webhooks, apps)
  // carry no ambient cookie risk and are left to the usual auth.
  const allowedOrigins = new Set([frontendUrl, "http://localhost:3000"]);
  app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method) && origin && !allowedOrigins.has(origin)) {
      res.status(403).json({ statusCode: 403, message: "Cross-site request refused." });
      return;
    }
    next();
  });

  app.enableCors({
    origin: [frontendUrl, "http://localhost:3000"],
    credentials: true,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With"],
  });

  app.setGlobalPrefix("api/v1");

  // API docs only outside production: no public map of the admin endpoints.
  if (process.env.NODE_ENV !== "production") {
    const config = new DocumentBuilder()
      .setTitle("TSP API")
      .setDescription("The TSP API documentation")
      .setVersion("1.0")
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("api/docs", app, document);
  }

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