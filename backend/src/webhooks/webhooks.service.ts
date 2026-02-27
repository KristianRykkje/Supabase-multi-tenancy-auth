import { Injectable } from "@nestjs/common";
import { EmailService } from "../email/email.service";
import { PrismaService } from "../prisma/prisma.service";
import { IEvent } from "./webhooks.types";

/**
 * WEBHOOKS SERVICE
 * Handles Supabase auth events and sends emails to real addresses
 * Uses idempotent operations to handle webhook retries safely
 */
@Injectable()
export class WebhooksService {
  constructor(
    private readonly emailService: EmailService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Handle OTP (one-time password) request
   * Send OTP code to REAL email address
   */
  async handleOtp(event: IEvent) {
    const { user } = event;
    const realEmail = user.user_metadata?.real_email;
    const tenantSlug = user.user_metadata?.tenant_slug;
    const tenantId = user.user_metadata?.tenant_id;

    if (!realEmail || !tenantSlug || !tenantId) {
      console.error("[Webhook] Missing metadata for OTP");
      return;
    }

    const tenant = await this.prisma.tenants.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      return;
    }

    // Send OTP email to real address
    if (event.email_data?.token) {
      await this.emailService.sendOtpEmail({
        to: realEmail,
        tenantName: tenant.name,
        tenantSlug,
        otp: event.email_data.token,
      });

      console.log(`[Webhook] Sent OTP to ${realEmail}`);
    }
  }
}
