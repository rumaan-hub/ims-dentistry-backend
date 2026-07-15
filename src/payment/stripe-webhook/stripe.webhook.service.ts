import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MailerService } from "src/mailer/mailer.service";
import { PrismaService } from "src/prisma/prisma.service";
import Stripe from "stripe";

@Injectable()
export class StripeWebhookService {
  private readonly logger = new Logger(StripeWebhookService.name);
  private readonly stripe: Stripe;
  private readonly webhookSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private configService: ConfigService,
    private mailerService: MailerService
  ) {
    this.stripe = new Stripe(this.configService.get("STRIPE_SECRET_KEY"));
    this.webhookSecret = this.configService.get("STRIPE_WEBHOOK_SECRET_KEY");
  }

  async handleStripeWebhook(signature: string, rawBody: Buffer) {
    if (!signature) {
      throw new Error("Missing Stripe signature");
    }

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.webhookSecret
      );
    } catch (err) {
      this.logger.error(`Webhook signature verification failed`, err);
      throw new Error("Invalid signature");
    }

    this.logger.log(`Processing event: ${event.type}`);

    switch (event.type) {
      case "account.updated":
        await this.handleAccountUpdated(event.data.object as Stripe.Account);
        break;
      case "account.application.deauthorized":
        await this.handleAccountDeauthorized(
          event.data.object as unknown as Stripe.Account
        );
        break;
      default:
        this.logger.warn(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }

  private async handleAccountUpdated(account: Stripe.Account) {
    try {
      if (account.details_submitted) {
        this.logger.log(`Onboarding completed for account: ${account.id}`);
        await this.mailerService.sendEmail(
          account.email,
          "Account Onboarding Completed",
          `<div>
              <h2>Hi, ${account.business_profile.name || "Valued User"}!</h2>
              <p>Your account onboarding has been completed. You can now use our platform.</p>
              <p>We are thrilled to have you on board and look forward to working with you.</p>
              <div class="footer">
                <p>Sincerely,<br>The Dentistry99 Team</p>
              </div>
            </div>`
        );
      }
    } catch (error) {
      this.logger.error(
        `Error handling account update: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  private async handleAccountDeauthorized(account: Stripe.Account) {
    try {
      this.logger.log(`Account deauthorized: ${account.id}`);
      await this.mailerService.sendEmail(
        account.email,
        "Account Deauthorized",
        `<div>
            <h2>Hi, ${account.business_profile.name || "Valued User"}!</h2>
            <p>Your account has been deauthorized. Please contact our support team for further assistance.</p>
            <div class="footer">
                <p>Sincerely,<br>The Dentistry99 Team</p>
            </div>
        </div>
        `
      );
    } catch (error) {
      this.logger.error(
        `Error handling account deauthorization: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }
}
