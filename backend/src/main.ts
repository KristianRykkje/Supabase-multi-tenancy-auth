import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true, // Enable raw body for webhook signature verification
  });

  // Get ConfigService from DI container
  const cfg = app.get(ConfigService);

  // Enable CORS for frontend
  app.enableCors({
    origin: cfg.get<string>("FRONTEND_URL") || "http://localhost:3000",
    credentials: true,
  });

  // Enable validation pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip unknown properties
      forbidNonWhitelisted: true, // Throw error on unknown properties
      transform: true, // Auto-transform payloads to DTO instances
    }),
  );

  const port = cfg.get<number>("PORT") || 3001;
  await app.listen(port);

  console.log(`🚀 Backend server running on http://localhost:${port}`);
  console.log(
    `📧 Webhook endpoint: http://localhost:${port}/webhooks/supabase`,
  );
}

bootstrap();
