import {
    Injectable,
    Logger,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
    ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailerService } from '../mailer/mailer.service';
import { ImsNotificationService } from '../ims-notification/ims-notification.service';
import { SendLinkDto } from './dto/send-link.dto';
import { v4 as uuid } from 'uuid';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ImsSubscriptionService {
    private readonly logger = new Logger(ImsSubscriptionService.name);

    constructor(
        private prisma: PrismaService,
        private mailerService: MailerService,
        private notificationService: ImsNotificationService,
    ) { }

    // ─── Plans CRUD ───

    async getPlans() {
        const plans = await this.prisma.subscriptionPlan.findMany({
            where: { is_active: true },
            orderBy: { price: 'asc' },
        });
        return plans.map((p) => ({
            ...p,
            annual_price: p.price * 12 * (1 - (p.annual_discount_percentage || 0) / 100),
        }));
    }

    async createPlan(dto: any, requestUser: any) {
        if (!requestUser?.is_system_admin) throw new ForbiddenException('System admin access required');
        return this.prisma.subscriptionPlan.create({ data: dto });
    }

    async updatePlan(id: string, dto: any, requestUser: any) {
        if (!requestUser?.is_system_admin) throw new ForbiddenException('System admin access required');
        const plan = await this.prisma.subscriptionPlan.findUnique({
            where: { subscription_plan_id: id },
        });
        if (!plan) throw new NotFoundException('Plan not found');
        return this.prisma.subscriptionPlan.update({
            where: { subscription_plan_id: id },
            data: dto,
        });
    }

    async deletePlan(id: string, requestUser: any) {
        if (!requestUser?.is_system_admin) throw new ForbiddenException('System admin access required');
        const plan = await this.prisma.subscriptionPlan.findUnique({
            where: { subscription_plan_id: id },
        });
        if (!plan) throw new NotFoundException('Plan not found');
        await this.prisma.subscriptionPlan.update({
            where: { subscription_plan_id: id },
            data: { is_active: false },
        });
        return { success: true };
    }

    // ─── Send Subscription Link ───

    async sendLink(dto: SendLinkDto, requestUser: any) {
        if (!requestUser?.is_system_admin) throw new ForbiddenException('System admin access required');

        const client = await this.prisma.imsUser.findUnique({
            where: { client_id: dto.client_id },
        });
        if (!client) throw new NotFoundException('Client not found');

        const plan = await this.prisma.subscriptionPlan.findUnique({
            where: { subscription_plan_id: dto.subscription_plan_id },
        });
        if (!plan || !plan.is_active) throw new NotFoundException('Plan not found or inactive');

        const discount = dto.discount_percentage || 0;
        const discounted = plan.price * (1 - discount / 100);
        const final_amount = dto.billing_cycle === 'annual'
            ? discounted * 12 * 0.9
            : discounted;

        const start_date = new Date();
        const end_date = new Date(start_date);
        end_date.setMonth(end_date.getMonth() + plan.duration);

        const secure_link_token = uuid();
        const secure_link_expires = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hrs

        // Upsert: find existing or create new
        const existing = await this.prisma.clientSubscription.findFirst({
            where: {
                client_id: dto.client_id,
                subscription_plan_id: dto.subscription_plan_id,
            },
        });

        if (existing) {
            await this.prisma.clientSubscription.update({
                where: {
                    client_id_subscription_plan_id_start_date: {
                        client_id: existing.client_id,
                        subscription_plan_id: existing.subscription_plan_id,
                        start_date: existing.start_date,
                    },
                },
                data: {
                    secure_link_token,
                    secure_link_expires,
                    discount_percentage: discount,
                    final_amount,
                    payment_status: 'PENDING',
                    active: false,
                },
            });
        } else {
            await this.prisma.clientSubscription.create({
                data: {
                    client_id: dto.client_id,
                    subscription_plan_id: dto.subscription_plan_id,
                    start_date,
                    end_date,
                    final_amount,
                    payment_status: 'PENDING',
                    active: false,
                    discount_percentage: discount,
                    secure_link_token,
                    secure_link_expires,
                },
            });
        }

        const checkoutUrl = `${process.env.IMS_CHECKOUT_URL}/checkout?token=${secure_link_token}`;

        // Send email (non-blocking)
        try {
            await this.mailerService.sendEmail(
                client.email,
                'Your DSS IMS Subscription Link',
                `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #22c55e;">DSS IMS Subscription</h2>
                    <p>Dear ${client.first_name} ${client.last_name},</p>
                    <p>Your subscription link for <strong>${plan.plan_name}</strong> is ready.</p>
                    ${discount > 0 ? `<p>Discount applied: <strong>${discount}%</strong></p>` : ''}
                    <p>Final amount: <strong>$${final_amount.toFixed(2)}/${dto.billing_cycle}</strong></p>
                    <a href="${checkoutUrl}"
                       style="background: #22c55e; color: white; padding: 12px 24px;
                              text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 12px;">
                        Complete Subscription
                    </a>
                    <p style="margin-top: 20px; color: #666;">This link expires in 72 hours.</p>
                    <p style="color: #666;">&mdash; DSS IMS Team</p>
                </div>
                `,
            );
        } catch (emailError: any) {
            this.logger.error('Email send failed (link still created):', emailError.message);
        }

        return {
            success: true,
            checkoutUrl,
            secure_link_token,
            final_amount,
            client_email: client.email,
        };
    }

    // ─── My Subscription (current user) ───

    async getMySubscription(clientId: string) {
        // Priority: active subscription first, then latest by date
        let subscription = await this.prisma.clientSubscription.findFirst({
            where: { client_id: clientId, active: true },
            orderBy: { start_date: 'desc' },
            include: { plan: true },
        });
        if (!subscription) {
            subscription = await this.prisma.clientSubscription.findFirst({
                where: { client_id: clientId },
                orderBy: { start_date: 'desc' },
                include: { plan: true },
            });
        }
        if (!subscription) return null;

        const planName = subscription.plan?.plan_name ?? 'Standard Plan';
        const amount = subscription.final_amount ?? subscription.plan?.price ?? 0;
        const billingCycle = subscription.plan?.billing_cycle ?? 'monthly';

        // Calculate next billing date
        let nextBilling: Date | null = new Date(subscription.start_date);
        if (billingCycle.toLowerCase() === 'annual') {
            nextBilling.setFullYear(nextBilling.getFullYear() + 1);
        } else {
            nextBilling.setMonth(nextBilling.getMonth() + 1);
        }

        // Complimentary subscriptions: use end_date as expiry
        if (subscription.payment_status === 'COMPLIMENTARY') {
            if (subscription.end_date && new Date(subscription.end_date).getFullYear() < 2099) {
                // Limited complimentary → next_billing_date = actual expiry date
                nextBilling = new Date(subscription.end_date);
            } else {
                // Unlimited complimentary (no end_date or year >= 2099) → never expires
                nextBilling = null;
            }
        }

        return {
            plan_name: planName,
            billing_cycle: billingCycle,
            final_amount: amount,
            discount_percentage: subscription.discount_percentage ?? 0,
            active: subscription.active,
            payment_status: subscription.payment_status,
            start_date: subscription.start_date,
            next_billing_date: nextBilling,
        };
    }

    // ─── Payment History ───

    async getPaymentHistory(clientId: string) {
        const records = await this.prisma.clientSubscription.findMany({
            where: { client_id: clientId },
            orderBy: { start_date: 'desc' },
            include: { plan: { select: { plan_name: true, billing_cycle: true } } },
        });
        return records.map((r) => ({
            plan_name: r.plan?.plan_name ?? 'Unknown Plan',
            billing_cycle: r.plan?.billing_cycle ?? 'monthly',
            final_amount: r.final_amount,
            discount_percentage: r.discount_percentage ?? 0,
            payment_status: r.payment_status,
            active: r.active,
            start_date: r.start_date,
            end_date: r.end_date,
        }));
    }

    // ─── Date filter helper ───

    private getDateFrom(filter?: string): Date | null {
        if (!filter || filter === 'overall') return null;
        const now = new Date();
        switch (filter) {
            case '24hours': return new Date(now.getTime() - 24 * 60 * 60 * 1000);
            case '7days': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            case '30days': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            case '12months': return new Date(now.getFullYear(), now.getMonth() - 12, now.getDate());
            default: return null;
        }
    }

    // ─── Stats ───

    async getStats(requestUser: any, filter?: string) {
        if (!requestUser?.is_system_admin) throw new ForbiddenException('System admin access required');

        const dateFrom = this.getDateFrom(filter);

        // Fetch all subscription plans to map plan names
        const allPlans = await this.prisma.subscriptionPlan.findMany({
            select: { subscription_plan_id: true, plan_name: true },
        });
        const basicPlanIds = allPlans.filter(p => p.plan_name.toLowerCase().includes('basic')).map(p => p.subscription_plan_id);
        const standardPlanIds = allPlans.filter(p => p.plan_name.toLowerCase().includes('standard') || p.plan_name.toLowerCase().includes('standerd')).map(p => p.subscription_plan_id);
        const premiumPlanIds = allPlans.filter(p => p.plan_name.toLowerCase().includes('premium') || p.plan_name.toLowerCase().includes('professional')).map(p => p.subscription_plan_id);

        const nd = { user: { is_deleted: false } }; // not-deleted filter for relations
        const demoDateFilter = dateFrom ? { demo_date: { gte: dateFrom } } : {};
        const agrDateFilter = dateFrom ? { updated_at: { gte: dateFrom } } : {};
        const subDateFilter = dateFrom ? { start_date: { gte: dateFrom } } : {};

        const [
            totalSubscribers, demos,
            basicSubscription, standardSubscription, premiumSubscription,
            activeDemos, pendingDemos, failedDemos, rescheduledDemos, successfulDemos,
            agreements, signedAgreements,
            pendingActivations, activeSubscriptions, revenueResult,
        ] = await Promise.all([
            // totalSubscribers — always all time (no date filter)
            this.prisma.clientSubscription.groupBy({ by: ['client_id'], where: { active: true, payment_status: { in: ['COMPLETED', 'COMPLIMENTARY'] }, ...nd } }).then(r => r.length),
            this.prisma.imsUserDetail.count({ where: { ...demoDateFilter, ...nd } }),
            this.prisma.clientSubscription.count({ where: { subscription_plan_id: { in: basicPlanIds }, active: true, ...subDateFilter, ...nd } }),
            this.prisma.clientSubscription.count({ where: { subscription_plan_id: { in: standardPlanIds }, active: true, ...subDateFilter, ...nd } }),
            this.prisma.clientSubscription.count({ where: { subscription_plan_id: { in: premiumPlanIds }, active: true, ...subDateFilter, ...nd } }),
            this.prisma.imsUserDetail.count({ where: { demo_status: 'SCHEDULED', ...demoDateFilter, ...nd } }),
            this.prisma.imsUserDetail.count({ where: { demo_status: 'PENDING', ...demoDateFilter, ...nd } }),
            this.prisma.imsUserDetail.count({ where: { demo_status: { in: ['FAILED', 'CANCELLED'] }, ...demoDateFilter, ...nd } }),
            this.prisma.imsUserDetail.count({ where: { demo_status: 'RESCHEDULED', ...demoDateFilter, ...nd } }),
            this.prisma.imsUserDetail.count({ where: { demo_status: 'SUCCESSFUL', ...demoDateFilter, ...nd } }),
            this.prisma.agreement.count({ where: { ...agrDateFilter, ...nd } }),
            this.prisma.agreement.count({ where: { status: 'SIGNED', ...agrDateFilter, ...nd } }),
            Promise.all([
                this.prisma.clientSubscription.groupBy({ by: ['client_id'], where: { payment_status: 'COMPLETED', active: false, ...nd } }).then(r => r.map(x => x.client_id)),
                this.prisma.clientSubscription.groupBy({ by: ['client_id'], where: { active: true, ...nd } }).then(r => new Set(r.map(x => x.client_id))),
            ]).then(([completedInactive, activeSet]) => completedInactive.filter(id => !activeSet.has(id)).length),
            this.prisma.clientSubscription.count({ where: { active: true, ...nd } }),
            this.prisma.clientSubscription.aggregate({ _sum: { final_amount: true }, where: { payment_status: 'COMPLETED', ...subDateFilter, ...nd } }),
        ]);

        return {
            totalSubscribers,
            demos,
            basicSubscription,
            standardSubscription,
            premiumSubscription,
            activeDemos,
            pendingDemos,
            failedDemos,
            rescheduledDemos,
            successfulDemos,
            agreements,
            signedAgreements,
            pendingActivations,
            activeSubscriptions,
            totalRevenue: revenueResult._sum.final_amount || 0,
        };
    }

    // ─── Chart Data (system admin) ───

    async getChartData(requestUser: any, filter?: string) {
        if (!requestUser?.is_system_admin) throw new ForbiddenException('System admin access required');

        const dateFrom = this.getDateFrom(filter);
        const nd = { user: { is_deleted: false } }; // not-deleted filter
        const demoDateFilter = dateFrom ? { demo_date: { gte: dateFrom } } : {};
        const subDateFilter = dateFrom ? { start_date: { gte: dateFrom } } : {};

        // Subscription status counts
        const [activeSubs, inactiveSubs, pendingSubs] = await Promise.all([
            this.prisma.clientSubscription.count({ where: { active: true, ...subDateFilter, ...nd } }),
            this.prisma.clientSubscription.count({ where: { active: false, payment_status: 'COMPLETED', ...subDateFilter, ...nd } }),
            this.prisma.clientSubscription.count({ where: { payment_status: 'PENDING', ...subDateFilter, ...nd } }),
        ]);

        // Demo status counts
        const [demoPending, demoScheduled, demoSuccessful, demoFailed, demoCancelled, demoRescheduled] = await Promise.all([
            this.prisma.imsUserDetail.count({ where: { demo_status: 'PENDING', ...demoDateFilter, ...nd } }),
            this.prisma.imsUserDetail.count({ where: { demo_status: 'SCHEDULED', ...demoDateFilter, ...nd } }),
            this.prisma.imsUserDetail.count({ where: { demo_status: 'SUCCESSFUL', ...demoDateFilter, ...nd } }),
            this.prisma.imsUserDetail.count({ where: { demo_status: 'FAILED', ...demoDateFilter, ...nd } }),
            this.prisma.imsUserDetail.count({ where: { demo_status: 'CANCELLED', ...demoDateFilter, ...nd } }),
            this.prisma.imsUserDetail.count({ where: { demo_status: 'RESCHEDULED', ...demoDateFilter, ...nd } }),
        ]);

        // Revenue by month (last 12 months)
        const now = new Date();
        const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
        const revenueDateFrom = dateFrom && dateFrom > twelveMonthsAgo ? dateFrom : twelveMonthsAgo;
        const completedSubs = await this.prisma.clientSubscription.findMany({
            where: { payment_status: 'COMPLETED', start_date: { gte: revenueDateFrom }, ...nd },
            select: { start_date: true, final_amount: true },
        });

        const revenueMap: Record<string, number> = {};
        for (let i = 11; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
            revenueMap[key] = 0;
        }
        for (const sub of completedSubs) {
            const d = new Date(sub.start_date);
            const key = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
            if (key in revenueMap) {
                revenueMap[key] += sub.final_amount;
            }
        }

        return {
            subscriptionStatus: [
                { name: 'Active', value: activeSubs },
                { name: 'Inactive', value: inactiveSubs },
                { name: 'Pending', value: pendingSubs },
            ],
            demoStatus: [
                { name: 'Pending', value: demoPending },
                { name: 'Scheduled', value: demoScheduled },
                { name: 'Successful', value: demoSuccessful },
                { name: 'Failed', value: demoFailed },
                { name: 'Cancelled', value: demoCancelled },
                { name: 'Rescheduled', value: demoRescheduled },
            ],
            revenueByMonth: Object.entries(revenueMap).map(([month, revenue]) => ({ month, revenue })),
        };
    }

    // ─── Client Subscription Status ───

    async getClientStatus(clientId: string) {
        // Priority: active subscription first
        let sub = await this.prisma.clientSubscription.findFirst({
            where: { client_id: clientId, active: true },
            orderBy: { start_date: 'desc' },
            select: { payment_status: true, active: true, plan: { select: { plan_name: true } } },
        });
        if (sub) return { payment_status: sub.payment_status, active: sub.active, plan_name: sub.plan?.plan_name || null };

        // No active sub — find latest inactive
        sub = await this.prisma.clientSubscription.findFirst({
            where: { client_id: clientId },
            orderBy: { start_date: 'desc' },
            select: { payment_status: true, active: true, plan: { select: { plan_name: true } } },
        });
        if (!sub) return null;

        // Inactive COMPLIMENTARY → treat as COMPLETED so toggle shows
        if (sub.payment_status === 'COMPLIMENTARY' && !sub.active) {
            return { payment_status: 'COMPLETED', active: false, plan_name: sub.plan?.plan_name || null };
        }
        return { payment_status: sub.payment_status, active: sub.active, plan_name: sub.plan?.plan_name || null };
    }

    // ─── Revoke Free Access ───

    async revokeFreeAccess(clientId: string) {
        // Step 1: Find active COMPLIMENTARY subscription
        const compSub = await this.prisma.clientSubscription.findFirst({
            where: { client_id: clientId, payment_status: 'COMPLIMENTARY', active: true },
            include: { plan: true },
        });
        if (!compSub) throw new NotFoundException('No active complimentary subscription found');

        // Step 2: Deactivate it
        await this.prisma.clientSubscription.update({
            where: {
                client_id_subscription_plan_id_start_date: {
                    client_id: compSub.client_id,
                    subscription_plan_id: compSub.subscription_plan_id,
                    start_date: compSub.start_date,
                },
            },
            data: { active: false },
        });

        // Step 3: Check for previous paid subscription
        const paidSub = await this.prisma.clientSubscription.findFirst({
            where: { client_id: clientId, payment_status: 'COMPLETED', active: false },
            orderBy: { start_date: 'desc' },
            include: { plan: true },
        });

        // Step 4: If paid found, restore it
        if (paidSub) {
            await this.prisma.clientSubscription.update({
                where: {
                    client_id_subscription_plan_id_start_date: {
                        client_id: paidSub.client_id,
                        subscription_plan_id: paidSub.subscription_plan_id,
                        start_date: paidSub.start_date,
                    },
                },
                data: { active: true },
            });
            return { success: true, restoredPlan: paidSub.plan?.plan_name || null };
        }

        // Step 5: No paid subscription
        return { success: true, restoredPlan: null };
    }

    // ─── Activate Client ───

    async activateClient(clientId: string, adminId: string) {
        const client = await this.prisma.imsUser.findUnique({
            where: { client_id: clientId },
        });
        if (!client) throw new NotFoundException('Client not found');

        // STEP 1: Deactivate ALL subscriptions for this client
        await this.prisma.clientSubscription.updateMany({
            where: { client_id: clientId },
            data: { active: false },
        });

        // STEP 2: Find the latest COMPLETED subscription
        const subscription = await this.prisma.clientSubscription.findFirst({
            where: {
                client_id: clientId,
                payment_status: 'COMPLETED',
            },
            orderBy: { start_date: 'desc' },
            include: { plan: true },
        });

        // STEP 3: If no COMPLETED record found, throw error
        if (!subscription) throw new NotFoundException('No completed subscription found');

        // STEP 4: Activate ONLY that one record
        await this.prisma.clientSubscription.update({
            where: {
                client_id_subscription_plan_id_start_date: {
                    client_id: subscription.client_id,
                    subscription_plan_id: subscription.subscription_plan_id,
                    start_date: subscription.start_date,
                },
            },
            data: { active: true },
        });

        // Ensure user has a role assigned
        const existingRoles = await this.prisma.imsUserRole.findMany({
            where: { client_id: clientId },
        });
        if (existingRoles.length === 0) {
            const globalRole = await this.prisma.imsRole.findFirst({
                where: { is_global: true },
                select: { role_id: true },
            });
            if (globalRole) {
                await this.prisma.imsUserRole.create({
                    data: { client_id: clientId, role_id: globalRole.role_id },
                });
            }
        }

        // Set password if not set (generate temp password)
        const needsTempPassword = !client.password ||
            client.password === null ||
            client.password === '' ||
            client.password === undefined;

        let tempPassword: string | null = null;
        if (needsTempPassword) {
            const bcrypt = require('bcrypt');
            tempPassword = Math.random().toString(36).slice(-8) +
                Math.random().toString(36).slice(-4).toUpperCase();
            const hashed = await bcrypt.hash(tempPassword, 10);
            await this.prisma.imsUser.update({
                where: { client_id: clientId },
                data: { password: hashed },
            });
        }

        // Send activation email to client
        try {
            await this.mailerService.sendEmail(
                client.email,
                'Your DSS IMS Account is Now Active!',
                `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #22c55e;">Your Account is Active!</h2>
                    <p>Dear ${client.first_name} ${client.last_name},</p>
                    <p>Your DSS IMS account has been activated. You can now login.</p>
                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                        ${tempPassword ? `
                        <tr style="border-bottom: 1px solid #e5e7eb;">
                            <td style="padding: 10px; font-weight: 600; color: #374151;">Temp Password</td>
                            <td style="padding: 10px; color: #6b7280;">${tempPassword}</td>
                        </tr>` : ''}
                        <tr style="border-bottom: 1px solid #e5e7eb;">
                            <td style="padding: 10px; font-weight: 600; color: #374151;">Email</td>
                            <td style="padding: 10px; color: #6b7280;">${client.email}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; font-weight: 600; color: #374151;">Plan</td>
                            <td style="padding: 10px; color: #6b7280;">${subscription.plan.plan_name}</td>
                        </tr>
                    </table>
                    ${tempPassword ? '<p style="color: #dc2626;">Please change your password after first login.</p>' : ''}
                    <a href="${process.env.IMS_DASHBOARD_URL}/login"
                       style="background: #22c55e; color: white; padding: 12px 24px;
                              text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 12px;">
                        Login to IMS &rarr;
                    </a>
                    <p style="margin-top: 20px; color: #666;">&mdash; DSS IMS System</p>
                </div>
                `,
            );
        } catch (e: any) {
            this.logger.error('Activation email failed:', e.message);
        }

        return {
            success: true,
            message: 'Client account activated successfully',
            tempPassword: tempPassword ?? 'Already set',
        };
    }

    // ─── Deactivate Client ───

    async deactivateClient(clientId: string) {
        const result = await this.prisma.clientSubscription.updateMany({
            where: { client_id: clientId },
            data: { active: false },
        });
        if (result.count === 0) {
            throw new NotFoundException('No subscription found');
        }
        return { success: true, message: 'Account deactivated' };
    }

    // ─── Verify Token ───

    // ─── Grant Free Access (existing user) ───

    async grantFreeAccess(
        clientId: string,
        planId: string,
        durationType: 'LIMITED' | 'UNLIMITED',
        durationDays?: number,
        reason?: string,
    ) {
        const client = await this.prisma.imsUser.findUnique({ where: { client_id: clientId } });
        if (!client) throw new NotFoundException('Client not found');

        const plan = await this.prisma.subscriptionPlan.findUnique({ where: { subscription_plan_id: planId } });
        if (!plan || !plan.is_active) throw new NotFoundException('Plan not found or inactive');

        // Step 1: Deactivate all existing subscriptions
        await this.prisma.clientSubscription.updateMany({
            where: { client_id: clientId },
            data: { active: false },
        });

        // Step 1b: Deactivate any active COMPLIMENTARY records (keep history)
        await this.prisma.clientSubscription.updateMany({
            where: { client_id: clientId, payment_status: 'COMPLIMENTARY', active: true },
            data: { active: false },
        });

        // Step 2: Calculate end_date
        const start_date = new Date();
        let end_date: Date;
        if (durationType === 'UNLIMITED') {
            end_date = new Date('2099-12-31T23:59:59.999Z');
        } else {
            end_date = new Date(start_date);
            end_date.setDate(end_date.getDate() + (durationDays || 30));
        }

        // Step 3: Create new ClientSubscription
        await this.prisma.clientSubscription.create({
            data: {
                client_id: clientId,
                subscription_plan_id: planId,
                start_date,
                end_date,
                final_amount: 0,
                payment_status: 'COMPLIMENTARY',
                active: true,
                discount_percentage: 100,
            },
        });

        // Step 4: Ensure user has a role assigned
        const existingRoles = await this.prisma.imsUserRole.findMany({
            where: { client_id: clientId },
        });
        if (existingRoles.length === 0) {
            const globalRole = await this.prisma.imsRole.findFirst({
                where: { is_global: true },
                select: { role_id: true },
            });
            if (globalRole) {
                await this.prisma.imsUserRole.create({
                    data: { client_id: clientId, role_id: globalRole.role_id },
                });
            }
        }

        // Step 5: Notification
        await this.notificationService.create(
            'Free Access Granted',
            `Complimentary access granted to ${client.company_name || client.first_name}${reason ? ` — ${reason}` : ''}`,
            'COMPLIMENTARY_ACCESS',
            '/system-admin/users',
        );

        return { success: true };
    }

    // ─── Create User with Free Access ───

    async createUserWithAccess(dto: {
        firstName: string;
        lastName: string;
        email: string;
        companyName: string;
        contactNumber?: string;
        planId: string;
        durationType: 'LIMITED' | 'UNLIMITED';
        durationDays?: number;
        reason?: string;
    }) {
        // Step 1: Check if email exists
        const existing = await this.prisma.imsUser.findUnique({ where: { email: dto.email } });
        if (existing && !existing.is_deleted) {
            throw new ConflictException('Email already registered');
        }
        if (existing && existing.is_deleted) {
            throw new ConflictException({
                message: 'User was deleted. Use restore instead.',
                clientId: existing.client_id,
            });
        }

        // Step 2: Generate temp password
        const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase();
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        // Step 3: Create ImsUser
        const newUser = await this.prisma.imsUser.create({
            data: {
                company_name: dto.companyName,
                first_name: dto.firstName,
                last_name: dto.lastName,
                email: dto.email,
                contact_number: dto.contactNumber || null,
                password: hashedPassword,
                is_system_admin: false,
                agree_to_terms: true,
            },
        });

        // Step 4: Create ImsUserDetail
        await this.prisma.imsUserDetail.create({
            data: {
                client_id: newUser.client_id,
                status: 'SUCCESSFUL',
                demo_status: 'SUCCESSFUL',
                demo_date: new Date(),
            },
        });

        // Step 4b: Assign default role (global "Full Access Admin")
        const globalRole = await this.prisma.imsRole.findFirst({
            where: { is_global: true },
            select: { role_id: true },
        });
        if (globalRole) {
            await this.prisma.imsUserRole.create({
                data: {
                    client_id: newUser.client_id,
                    role_id: globalRole.role_id,
                },
            });
        }

        // Step 5: Grant free access
        await this.grantFreeAccess(
            newUser.client_id,
            dto.planId,
            dto.durationType,
            dto.durationDays,
            dto.reason,
        );

        // Step 6: Get plan name for email
        const plan = await this.prisma.subscriptionPlan.findUnique({ where: { subscription_plan_id: dto.planId } });
        const planName = plan?.plan_name || 'Standard Plan';
        const dashboardUrl = process.env.IMS_DASHBOARD_URL;

        // Send welcome email
        try {
            await this.mailerService.sendEmail(
                dto.email,
                'Your IMS Account is Ready',
                `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2563eb;">Your IMS Account is Ready!</h2>
                    <p>Dear ${dto.firstName} ${dto.lastName},</p>
                    <p>Your account has been created with complimentary access to <strong>${planName}</strong>.</p>
                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                        <tr style="border-bottom: 1px solid #e5e7eb;">
                            <td style="padding: 10px; font-weight: 600; color: #374151;">Email</td>
                            <td style="padding: 10px; color: #6b7280;">${dto.email}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e5e7eb;">
                            <td style="padding: 10px; font-weight: 600; color: #374151;">Temp Password</td>
                            <td style="padding: 10px; color: #6b7280;">${tempPassword}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; font-weight: 600; color: #374151;">Plan</td>
                            <td style="padding: 10px; color: #6b7280;">${planName}</td>
                        </tr>
                    </table>
                    <p style="color: #dc2626;">Please change your password after first login.</p>
                    <a href="${dashboardUrl}/login"
                       style="background: #2563eb; color: white; padding: 12px 24px;
                              text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 12px;">
                        Login to IMS &rarr;
                    </a>
                    <p style="margin-top: 20px; color: #666;">&mdash; DSS IMS Team</p>
                </div>
                `,
            );
        } catch (e: any) {
            this.logger.error('Welcome email failed:', e.message);
        }

        return { success: true, clientId: newUser.client_id };
    }

    async verifyToken(token: string) {
        const sub = await this.prisma.clientSubscription.findFirst({
            where: { secure_link_token: token },
            include: {
                plan: true,
                user: {
                    select: {
                        first_name: true,
                        last_name: true,
                        email: true,
                        company_name: true,
                    },
                },
            },
        });
        if (!sub) throw new NotFoundException('Invalid link');
        if (sub.secure_link_expires && sub.secure_link_expires < new Date()) {
            throw new BadRequestException('Link expired');
        }

        return {
            client_id: sub.client_id,
            subscription_plan_id: sub.subscription_plan_id,
            start_date: sub.start_date,
            final_amount: sub.final_amount,
            discount_percentage: sub.discount_percentage,
            billing_cycle: sub.plan.billing_cycle,
            plan: {
                plan_name: sub.plan.plan_name,
                price: sub.plan.price,
                features: sub.plan.features,
                user_limit: sub.plan.user_limit,
            },
            client: sub.user,
        };
    }
}
