import { BadRequestException, Controller, Get, Headers, Logger, Post, RawBodyRequest, Req } from '@nestjs/common';
import { AppService } from './app.service';
import Stripe from 'stripe';
import { PrismaService } from './prisma/prisma.service';
import { TransactionStatus } from '@prisma/client';
@Controller()
export class AppController {
  private readonly stripe: Stripe;
  public stripeWebhookSecret: string;
  private readonly logger: Logger = new Logger(AppController.name);
  
  constructor(private readonly appService: AppService, private prismaService: PrismaService
  ) {
    this.stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET_KEY;
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('webhook')
    async handleWebhook(
      @Headers('stripe-signature') signature: string,
      @Req() request: RawBodyRequest<Request>
    ) {
      let event: Stripe.Event;
      try {
        event = this.stripe.webhooks.constructEvent(
          request.rawBody,
          signature,
          this.stripeWebhookSecret
        );
      } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        throw new BadRequestException(`Webhook Error: ${err.message}`);
      }
  
      switch (event.type) {
        case 'payment_intent.created':
          await this.handlePaymentIntentCreated(event.data.object);
          break;
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(event.data.object);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(event.data.object);
          break;
        case 'charge.refunded':
          await this.handleChargeRefunded(event.data.object);
          break;
        case 'charge.dispute.created':
          await this.handleDisputeCreated(event.data.object);
          break;
        case 'payment_intent.canceled':
          await this.handlePaymentIntentCanceled(event.data.object);
          break;
        case 'payment_intent.requires_action':
          await this.handleRequiresAction(event.data.object);
          break;

        default:
          this.logger.log(`Unhandled event type: ${event.type}`);
      }
  
      return { received: true, eventType: event.type };
    }

    private async handlePaymentIntentCreated(paymentIntent: Stripe.PaymentIntent) {
      await this.prismaService.transaction.updateMany({
        where: { stripePaymentIntentId: paymentIntent.id },
        data: {
          status: TransactionStatus.PENDING,
          currency: paymentIntent.currency
        }
      })
    }
    
    private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
      await this.prismaService.transaction.updateMany({
        where: { stripePaymentIntentId: paymentIntent.id },
        data: {
          status: TransactionStatus.COMPLETED,
          currency: paymentIntent.currency,
          capturedAt: new Date()
        }
      })
    }
    
    private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
      await this.prismaService.transaction.updateMany({
        where: { stripePaymentIntentId: paymentIntent.id },
        data: {
          status: TransactionStatus.FAILED,
          currency: paymentIntent.currency,
          metadata: {
            failureCode: paymentIntent.last_payment_error?.code,
            failureMessage: paymentIntent.last_payment_error?.message
          }
        }
      })
    }
    
    private async handleChargeRefunded(charge: Stripe.Charge) {
      const paymentIntentId = charge.payment_intent as string;
      const isFullRefund = charge.amount === charge.amount_refunded;
      
      const transactions = await this.prismaService.transaction.findMany({
        where: { stripePaymentIntentId: paymentIntentId },
        select: { totalAmount: true, vendor: true, customer: true },
      })
      if (transactions.length === 0) {
        this.logger.warn(`No transactions found for payment intent ${paymentIntentId}`);
        return;
      }

      if (isFullRefund) {
        await Promise.all(
          transactions.map(txn => 
            this.prismaService.transaction.updateMany({
              where: { stripePaymentIntentId: paymentIntentId },
              data: {
                status: TransactionStatus.REFUNDED,
                refundAmount: txn.totalAmount,
                refundReason: charge.refunds?.data[0]?.metadata.reason,
                refundedAt: new Date()
              }
            })
          )
        );
      } else {
        const totalOriginalAmount = transactions.reduce(
          (sum, txn) => sum + txn.totalAmount, 
          0
        );

        await Promise.all(
          transactions.map(txn => {
            const vendorRefundShare = (txn.totalAmount / totalOriginalAmount) ;
            const roundedAmount = vendorRefundShare;

            return this.prismaService.transaction.updateMany({
              where: { stripePaymentIntentId: paymentIntentId },
              data: {
                status: TransactionStatus.PARTIALLY_REFUNDED,
                refundAmount: roundedAmount,
                refundReason: charge.refunds?.data[0]?.metadata.reason,
                refundedAt: new Date()
              }
            });
          })
        );
      }
    }
    
    private async handleDisputeCreated(dispute: Stripe.Dispute) {
      const paymentIntentId = dispute.payment_intent as string;
      await this.prismaService.transaction.updateMany({
        where: { stripePaymentIntentId: paymentIntentId },
        data: { 
          status: TransactionStatus.DISPUTED,
          metadata: {
            disputeAmount: dispute.amount,
            disputeReason: dispute.reason
          }
        }
      });
    }
    
    private async handlePaymentIntentCanceled(paymentIntent: Stripe.PaymentIntent) {
      await this.prismaService.transaction.updateMany({
        where: { stripePaymentIntentId: paymentIntent.id },
        data: {
          status: TransactionStatus.CANCELLED,
          metadata: {
            cancellationReason: paymentIntent.cancellation_reason
          }
        }
      });
    }
    
    private async handleRequiresAction(paymentIntent: Stripe.PaymentIntent) {
      await this.prismaService.transaction.updateMany({
        where: { stripePaymentIntentId: paymentIntent.id},
        data: {
          status: TransactionStatus.REQUIRES_ACTION,
          metadata: {
            nextActionType: paymentIntent.next_action?.type
          }
        }
      })
    }
}
