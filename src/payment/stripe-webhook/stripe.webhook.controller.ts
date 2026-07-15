import { BadRequestException, Controller, Headers, Post, RawBody } from "@nestjs/common";
import { StripeWebhookService } from "./stripe.webhook.service";

@Controller("webhook")
export class StripeWebhookController {
  constructor(private readonly stripeWebhookService: StripeWebhookService) {}

  @Post()
  async handleWebhook(
    @Headers("stripe-signature") signature: string,
    @RawBody() rawBody: Buffer
  ) {
    try {
      return await this.stripeWebhookService.handleStripeWebhook(
        signature,
        rawBody
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
