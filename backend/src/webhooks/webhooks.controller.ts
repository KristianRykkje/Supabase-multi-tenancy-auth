import {
  Controller,
  Post,
  RawBodyRequest,
  Req,
  Res,
  HttpStatus,
} from "@nestjs/common";
import { Webhook } from "standardwebhooks";
import { WebhooksService } from "./webhooks.service";
import { Request, Response } from "express";
import { ConfigService } from "@nestjs/config";
import { IEvent } from "./webhooks.types";

/**
 * WEBHOOKS CONTROLLER
 * Handles Supabase auth events with signature verification using standardwebhooks
 */
@Controller("webhooks")
export class WebhooksController {
  constructor(
    private readonly webhooksService: WebhooksService,
    private readonly cfg: ConfigService,
  ) {}

  /**
   * SUPABASE WEBHOOK ENDPOINT
   * Receives auth events from Supabase (user creation, password reset, etc.)
   */
  @Post("supabase")
  public async handle(
    @Req() req: RawBodyRequest<Request>,
    @Res() res: Response,
  ) {
    console.log("[Webhook] Received request with headers:", req.headers);

    // Immediately respond to prevent timeout
    res.status(HttpStatus.OK).json({ received: true });

    let event: IEvent;
    try {
      const secret = this.cfg
        .getOrThrow<string>("SUPABASE_WEBHOOK_SECRET")
        .replace("v1,whsec_", "");
      const wh = new Webhook(secret);
      if (!req.rawBody) throw new Error("Missing rawBody");
      event = wh.verify(req.rawBody.toString("utf8"), {
        "webhook-id": req.headers["webhook-id"] as string,
        "webhook-timestamp": req.headers["webhook-timestamp"] as string,
        "webhook-signature": req.headers["webhook-signature"] as string,
      }) as IEvent;

      // 3) Fire-and-forget the heavy work with error catching
      void this.processEvent(event).catch((err) => {
        console.error(
          "[PERF] processEvent failed catastrophically - this may cause webhook retries:",
          err,
        );
      });
    } catch (err) {
      console.error(`[PERF] Webhook verify failed error:`, err);
      // Log error but don't fail the response since we already sent OK
    }
  }

  /**
   * Process webhook events asynchronously
   * This runs in the background after responding to Supabase
   */
  private async processEvent(event: IEvent) {
    const emailType = event.email_data?.email_action_type || "unknown";
    console.log(`[Webhook] Processing event for user: ${event.user.id}`);
    try {
      // Handle based on email action type from "Send Email" hooks
      switch (emailType) {
        case "magiclink":
          // OTP emails are sent to real user email addresses
          await this.webhooksService.handleOtp(event);
          break;

        case "signup":
          // No longer needed - database mapping created directly in signup endpoint
          console.log(
            `[Webhook] Signup event - database mapping already created`,
          );
          break;

        case "recovery":
          console.log(
            `[Webhook] Password recovery not supported - use OTP login instead`,
          );
          break;

        case "invite":
          console.log(`[Webhook] Invite email - not handled yet`);
          break;

        default:
          console.log(`[Webhook] Unhandled email action type: ${emailType}`);
      }
    } catch (error) {
      // Log error but don't throw - webhook already acknowledged
      console.error("[Webhook] Error in async processing:", error);
    }
  }
}
