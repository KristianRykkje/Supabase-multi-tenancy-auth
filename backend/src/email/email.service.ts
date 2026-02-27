import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Resend } from "resend";

interface SendOtpEmailParams {
  to: string;
  tenantName: string;
  tenantSlug: string;
  otp: string;
}

/**
 * EMAIL SERVICE
 * Sends transactional emails via Resend
 * All emails go to REAL user addresses (not internal Supabase emails)
 */
@Injectable()
export class EmailService {
  private resend: Resend;
  private fromEmail: string;

  constructor(private cfg: ConfigService) {
    const apiKey = this.cfg.get<string>("RESEND_API_KEY");

    if (!apiKey) {
      console.warn("RESEND_API_KEY not configured - emails will not be sent");
      this.resend = null as any;
    } else {
      this.resend = new Resend(apiKey);
    }

    this.fromEmail = this.cfg.getOrThrow<string>("EMAIL_FROM");
  }

  /**
   * Send OTP (one-time password) email
   */
  async sendOtpEmail(params: SendOtpEmailParams) {
    const { to, tenantName, otp } = params;

    if (!this.resend) {
      console.log(`[Email] Would send OTP to ${to} (Resend not configured)`);
      return;
    }

    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to,
        subject: `Your login code - ${tenantName}`,
        html: this.getOtpEmailTemplate({
          tenantName,
          otp,
        }),
      });

      console.log(`[Email] OTP email sent to ${to}`);
    } catch (error) {
      console.error("[Email] Failed to send OTP email:", error);
      throw error;
    }
  }

  /**
   * EMAIL TEMPLATES
   * Simple HTML templates - can be replaced with React Email for production
   */

  private getOtpEmailTemplate(params: { tenantName: string; otp: string }) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
            <h1 style="color: #7c3aed; margin: 0 0 20px 0;">Your login code</h1>
            <p style="font-size: 16px; margin-bottom: 20px;">
              Use this code to sign in to ${params.tenantName}.
            </p>
            <div style="background-color: white; border: 2px solid #7c3aed; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
              <div style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #7c3aed; font-family: 'Courier New', monospace;">
                ${params.otp}
              </div>
            </div>
            <p style="font-size: 14px; color: #666; margin-top: 20px;">
              Enter this 6-digit code in the login form to complete your sign-in.
            </p>
            <p style="font-size: 14px; color: #666; margin-top: 20px;">
              This code will expire in 1 hour and can only be used once.
            </p>
          </div>
          <p style="font-size: 12px; color: #999; text-align: center;">
            If you didn't request this code, you can safely ignore this email.
          </p>
        </body>
      </html>
    `;
  }
}
