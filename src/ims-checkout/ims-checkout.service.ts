import {
    Injectable,
    Logger,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailerService } from '../mailer/mailer.service';
import { ImsNotificationService } from '../ims-notification/ims-notification.service';
import { getSubscriptionPaymentConfirmationTemplate } from '../utils/email-templates';
import { v4 as uuid } from 'uuid';
import Stripe from 'stripe';

@Injectable()
export class ImsCheckoutService {
    private readonly logger = new Logger(ImsCheckoutService.name);
    private stripe: Stripe;

    constructor(
        private prisma: PrismaService,
        private mailerService: MailerService,
        private notificationService: ImsNotificationService,
    ) {
        this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
            apiVersion: '2024-06-20',
        });
    }

    // ─── Token Validation Helper ───

    private async validateToken(token: string) {
        const subscription = await this.prisma.clientSubscription.findFirst({
            where: { secure_link_token: token },
        });
        if (!subscription) throw new NotFoundException('Invalid link');
        if (subscription.secure_link_expires && subscription.secure_link_expires < new Date()) {
            throw new BadRequestException('Link has expired');
        }
        return subscription;
    }

    // ─── Stripe Payment Intent ───

    async createPaymentIntent(dto: any) {
        const subscription = await this.validateToken(dto.token);

        const amountInCents = Math.round(subscription.final_amount * 100);
        if (amountInCents <= 0) {
            throw new BadRequestException('Invalid subscription amount');
        }

        const paymentIntent = await this.stripe.paymentIntents.create({
            amount: amountInCents,
            currency: 'usd',
            metadata: {
                client_id: subscription.client_id,
                subscription_plan_id: subscription.subscription_plan_id,
            },
        });

        return { clientSecret: paymentIntent.client_secret };
    }

    // ─── License ───

    async saveLicense(dto: any) {
        const subscription = await this.validateToken(dto.token);
        const clientId = subscription.client_id;

        const existing = await this.prisma.license.findFirst({
            where: { client_id: clientId },
        });

        let license;
        if (existing) {
            license = await this.prisma.license.update({
                where: { license_id: existing.license_id },
                data: {
                    license_type: dto.license_type,
                    license_number: dto.license_number,
                    state: dto.state,
                    expiry_date: new Date(dto.expiry_date),
                    status: dto.status,
                },
            });
        } else {
            license = await this.prisma.license.create({
                data: {
                    client_id: clientId,
                    license_type: dto.license_type,
                    license_number: dto.license_number,
                    state: dto.state,
                    expiry_date: new Date(dto.expiry_date),
                    status: dto.status,
                },
            });
        }

        return { success: true, license_id: license.license_id };
    }

    // ─── Shipping ───

    async saveShipping(dto: any) {
        const subscription = await this.validateToken(dto.token);
        const clientId = subscription.client_id;

        const existing = await this.prisma.shipping.findFirst({
            where: { client_id: clientId },
        });

        let shipping;
        if (existing) {
            shipping = await this.prisma.shipping.update({
                where: { shipping_id: existing.shipping_id },
                data: {
                    office_name: dto.office_name,
                    address: dto.address,
                    city: dto.city,
                    state: dto.state,
                    zip_code: dto.zip_code,
                    phone: dto.phone || null,
                    extension: dto.extension || null,
                },
            });
        } else {
            shipping = await this.prisma.shipping.create({
                data: {
                    client_id: clientId,
                    office_name: dto.office_name,
                    address: dto.address,
                    city: dto.city,
                    state: dto.state,
                    zip_code: dto.zip_code,
                    phone: dto.phone || null,
                    extension: dto.extension || null,
                },
            });
        }

        return { success: true, shipping_id: shipping.shipping_id };
    }

    // ─── Billing ───

    async saveBilling(dto: any) {
        const subscription = await this.validateToken(dto.token);
        const clientId = subscription.client_id;

        const encryptedMaskedCard = `**** **** **** ${dto.last4}`;
        const stripePaymentMethodId = `test_${uuid()}`;

        const existing = await this.prisma.billing.findFirst({
            where: { client_id: clientId },
        });

        if (existing) {
            await this.prisma.billing.update({
                where: { billing_id: existing.billing_id },
                data: {
                    card_brand: dto.card_brand,
                    encrypted_masked_card: encryptedMaskedCard,
                    expiry_month: dto.expiry_month,
                    expiry_year: dto.expiry_year,
                    billing_address: dto.billing_address,
                    stripe_payment_method_id: stripePaymentMethodId,
                },
            });
        } else {
            await this.prisma.billing.create({
                data: {
                    client_id: clientId,
                    card_brand: dto.card_brand,
                    encrypted_masked_card: encryptedMaskedCard,
                    expiry_month: dto.expiry_month,
                    expiry_year: dto.expiry_year,
                    billing_address: dto.billing_address,
                    stripe_payment_method_id: stripePaymentMethodId,
                },
            });
        }

        return { success: true };
    }

    // ─── GET saved data ───

    async getLicense(token: string) {
        const subscription = await this.validateToken(token);
        const license = await this.prisma.license.findFirst({
            where: { client_id: subscription.client_id },
        });
        if (!license) return { found: false };
        return {
            found: true,
            license_type: license.license_type,
            license_number: license.license_number,
            state: license.state,
            expiry_date: license.expiry_date,
            status: license.status,
        };
    }

    async getShipping(token: string) {
        const subscription = await this.validateToken(token);
        const shipping = await this.prisma.shipping.findFirst({
            where: { client_id: subscription.client_id },
        });
        if (!shipping) return { found: false };
        return {
            found: true,
            office_name: shipping.office_name,
            address: shipping.address,
            city: shipping.city,
            state: shipping.state,
            zip_code: shipping.zip_code,
            phone: shipping.phone,
            extension: shipping.extension,
        };
    }

    async getBilling(token: string) {
        const subscription = await this.validateToken(token);
        const billing = await this.prisma.billing.findFirst({
            where: { client_id: subscription.client_id },
        });
        if (!billing) return { found: false };
        return {
            found: true,
            card_brand: billing.card_brand,
            last4: billing.encrypted_masked_card?.replace(/[^0-9]/g, '') || '',
            expiry_month: billing.expiry_month,
            expiry_year: billing.expiry_year,
            billing_address: billing.billing_address,
        };
    }

    // ─── Confirm Order ───

    async confirmOrder(dto: any) {
        const subscription = await this.validateToken(dto.token);

        // Verify Stripe payment succeeded
        if (!dto.payment_intent_id) {
            throw new BadRequestException('payment_intent_id is required');
        }
        const paymentIntent = await this.stripe.paymentIntents.retrieve(dto.payment_intent_id);
        if (paymentIntent.status !== 'succeeded') {
            throw new BadRequestException('Payment has not been completed');
        }

        await this.prisma.clientSubscription.update({
            where: {
                client_id_subscription_plan_id_start_date: {
                    client_id: subscription.client_id,
                    subscription_plan_id: subscription.subscription_plan_id,
                    start_date: subscription.start_date,
                },
            },
            data: {
                payment_status: 'COMPLETED',
                active: false,
            },
        });

        // Load the parties involved (shared by the client + admin emails and notifications)
        const systemAdmin = await this.prisma.imsUser.findFirst({
            where: { is_system_admin: true },
            select: { email: true, first_name: true, last_name: true },
        });

        const client = await this.prisma.imsUser.findUnique({
            where: { client_id: subscription.client_id },
            select: { first_name: true, last_name: true, email: true, company_name: true },
        });

        const plan = await this.prisma.subscriptionPlan.findUnique({
            where: { subscription_plan_id: subscription.subscription_plan_id },
            select: { plan_name: true, price: true },
        });

        // Email the client their payment confirmation. Kept in its own try/catch so a
        // failure here never blocks the admin notification below (and vice versa).
        try {
            if (client?.email && plan) {
                await this.mailerService.sendEmail(
                    client.email,
                    'Payment Confirmed — Dentistry99',
                    getSubscriptionPaymentConfirmationTemplate(
                        client,
                        plan.plan_name,
                        subscription.final_amount,
                    ),
                );
            }
        } catch (clientEmailError: any) {
            this.logger.error(
                'Client payment-confirmation email failed:',
                clientEmailError?.message,
            );
        }

        // Notify system admin via email
        try {
            if (systemAdmin && client && plan) {
                await this.mailerService.sendEmail(
                    systemAdmin.email,
                    'New Subscription Payment Received',
                    `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #22c55e;">Payment Received!</h2>
                        <p>Dear ${systemAdmin.first_name ?? 'Admin'},</p>
                        <p>A client has completed their subscription checkout.</p>
                        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                            <tr style="border-bottom: 1px solid #e5e7eb;">
                                <td style="padding: 10px; font-weight: 600; color: #374151;">Client</td>
                                <td style="padding: 10px; color: #6b7280;">${client.first_name} ${client.last_name}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #e5e7eb;">
                                <td style="padding: 10px; font-weight: 600; color: #374151;">Company</td>
                                <td style="padding: 10px; color: #6b7280;">${client.company_name}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #e5e7eb;">
                                <td style="padding: 10px; font-weight: 600; color: #374151;">Email</td>
                                <td style="padding: 10px; color: #6b7280;">${client.email}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #e5e7eb;">
                                <td style="padding: 10px; font-weight: 600; color: #374151;">Plan</td>
                                <td style="padding: 10px; color: #6b7280;">${plan.plan_name}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; font-weight: 600; color: #374151;">Amount</td>
                                <td style="padding: 10px; color: #6b7280;">$${subscription.final_amount}/month</td>
                            </tr>
                        </table>
                        <p>Please login to the admin panel to activate this client's account.</p>
                        <a href="${process.env.SYSTEM_ADMIN_URL}/system-admin/users"
                           style="background: #22c55e; color: white; padding: 12px 24px;
                                  text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 12px;">
                            Go to Admin Panel &rarr;
                        </a>
                        <p style="margin-top: 20px; color: #666;">&mdash; DSS IMS System</p>
                    </div>
                    `,
                );
            }

            // Create notifications
            if (client) {
                this.notificationService.create(
                    'Payment Received',
                    `${client.company_name} completed payment of $${subscription.final_amount}`,
                    'PAYMENT_RECEIVED',
                    '/system-admin/users',
                );
                this.notificationService.create(
                    'Pending Activation',
                    `${client.company_name} account is ready for activation`,
                    'PENDING_ACTIVATION',
                    '/system-admin/users',
                );
            }
        } catch (emailError: any) {
            this.logger.error('Admin notification email failed:', emailError.message);
        }

        return {
            success: true,
            message: 'Order confirmed! Your admin will activate your account shortly.',
        };
    }
}
