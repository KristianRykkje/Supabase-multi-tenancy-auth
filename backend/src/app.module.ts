import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { WebhooksController } from './webhooks/webhooks.controller';
import { WebhooksService } from './webhooks/webhooks.service';
import { EmailService } from './email/email.service';
import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [
    // Load environment variables
    ConfigModule.forRoot({
      isGlobal: true, // Make ConfigService available globally
    }),
    // Rate limiting configuration
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // Global default: 100 requests per minute
      },
    ]),
  ],
  controllers: [AuthController, WebhooksController],
  providers: [PrismaService, AuthService, WebhooksService, EmailService],
})
export class AppModule {}
