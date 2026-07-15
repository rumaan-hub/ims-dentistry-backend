import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { CreateLicenseDto } from './dto/create-license.dto';
import { UpdateLicenseDto } from './dto/update-license.dto';
import { CreateShippingDto } from './dto/create-shipping.dto';
import { UpdateShippingDto } from './dto/update-shipping.dto';
import { CreateBillingDto } from './dto/create-billing.dto';
import { UpdateBillingDto } from './dto/update-billing.dto';
import { StripeService } from '../payment/payment.service';
import { EncryptionUtil } from '../utils/encryption.util';

/** Relations to eager-load when returning a full client profile */
const FULL_INCLUDE = {
    licenses: true,
    shippings: true,
    billings: true,
    subscriptions: {
        include: { plan: true },
    },
} as const;

@Injectable()
export class ClientService {
    constructor(
        private prisma: PrismaService,
        private stripeService: StripeService,
    ) { }

    // ═══════════════════════════════════════════════
    // CLIENT CRUD
    // ═══════════════════════════════════════════════

    async create(dto: CreateClientDto) {
        const existing = await this.prisma.imsUser.findUnique({ where: { email: dto.email } });
        if (existing) throw new ConflictException('Email already exists');
        return this.prisma.imsUser.create({ data: dto });
    }

    /** List — lightweight (no relations) for the client table */
    async findAll() {
        return this.prisma.imsUser.findMany({
            orderBy: { created_at: 'desc' },
        });
    }

    /** Single client — fully hydrated with licenses / shippings / billings / subscriptions */
    async findById(id: string) {
        const client = await this.prisma.imsUser.findUnique({
            where: { client_id: id },
            include: FULL_INCLUDE,
        });
        if (!client) throw new NotFoundException('Client not found');
        return this._decryptBillings(client);
    }

    async update(id: string, dto: UpdateClientDto) {
        const client = await this.prisma.imsUser.findUnique({ where: { client_id: id } });
        if (!client) throw new NotFoundException('Client not found');

        if (dto.email && dto.email !== client.email) {
            const dup = await this.prisma.imsUser.findUnique({ where: { email: dto.email } });
            if (dup) throw new ConflictException('Email already in use');
        }

        return this.prisma.imsUser.update({ where: { client_id: id }, data: dto });
    }

    async remove(id: string) {
        const client = await this.prisma.imsUser.findUnique({ where: { client_id: id } });
        if (!client) throw new NotFoundException('Client not found');
        return this.prisma.imsUser.delete({ where: { client_id: id } });
    }

    /**
     * Returns the current IMS User — fully hydrated.
     * Uses the client_id from JWT token.
     */
    async getCurrentClient(clientId: string) {
        let client = await this.prisma.imsUser.findUnique({
            where: { client_id: clientId },
            include: FULL_INCLUDE,
        });
        if (!client) throw new NotFoundException('No IMS User found for this account.');

        // Ensure Stripe Customer exists
        if (!client.stripe_customer_id) {
            const customer = await this.stripeService.createCustomer(
                client.email,
                `${client.first_name} ${client.last_name}`,
            );
            client = await this.prisma.imsUser.update({
                where: { client_id: client.client_id },
                data: { stripe_customer_id: customer.id },
                include: FULL_INCLUDE,
            });
        }

        return this._decryptBillings(client);
    }

    // ═══════════════════════════════════════════════
    // LICENSE CRUD
    // ═══════════════════════════════════════════════

    async addLicense(clientId: string, dto: CreateLicenseDto) {
        await this._ensureClient(clientId);
        return this.prisma.license.create({
            data: {
                client_id: clientId,
                license_type: dto.license_type,
                license_number: dto.license_number,
                expiry_date: new Date(dto.expiry_date),
                state: dto.state,
                status: dto.status ?? 'Active',
            },
        });
    }

    async updateLicense(licenseId: string, dto: UpdateLicenseDto) {
        await this._ensureLicense(licenseId);
        return this.prisma.license.update({
            where: { license_id: licenseId },
            data: {
                ...(dto.license_type && { license_type: dto.license_type }),
                ...(dto.license_number && { license_number: dto.license_number }),
                ...(dto.expiry_date && { expiry_date: new Date(dto.expiry_date) }),
                ...(dto.state && { state: dto.state }),
                ...(dto.status && { status: dto.status }),
            },
        });
    }

    async removeLicense(licenseId: string) {
        await this._ensureLicense(licenseId);
        return this.prisma.license.delete({ where: { license_id: licenseId } });
    }

    // ═══════════════════════════════════════════════
    // SHIPPING CRUD
    // ═══════════════════════════════════════════════

    async addShipping(clientId: string, dto: CreateShippingDto) {
        await this._ensureClient(clientId);
        return this.prisma.shipping.create({
            data: { client_id: clientId, ...dto },
        });
    }

    async updateShipping(shippingId: string, dto: UpdateShippingDto) {
        await this._ensureShipping(shippingId);
        return this.prisma.shipping.update({
            where: { shipping_id: shippingId },
            data: dto,
        });
    }

    async removeShipping(shippingId: string) {
        await this._ensureShipping(shippingId);
        return this.prisma.shipping.delete({ where: { shipping_id: shippingId } });
    }

    // ═══════════════════════════════════════════════
    // BILLING CRUD
    // ═══════════════════════════════════════════════

    async addBilling(clientId: string, dto: CreateBillingDto) {
        console.log(`[ClientService] addBilling called for client: ${clientId}`);
        try {
            let client = await this.prisma.imsUser.findUnique({ where: { client_id: clientId } });
            if (!client) {
                console.error(`[ClientService] Client not found: ${clientId}`);
                throw new NotFoundException('Client not found');
            }

            // 1. Ensure Stripe Customer exists
            if (!client.stripe_customer_id) {
                console.log(`[ClientService] Creating Stripe customer for ${client.email}`);
                const customer = await this.stripeService.createCustomer(
                    client.email,
                    `${client.first_name} ${client.last_name}`,
                );
                client = await this.prisma.imsUser.update({
                    where: { client_id: clientId },
                    data: { stripe_customer_id: customer.id },
                });
                console.log(`[ClientService] Created Stripe customer: ${customer.id}`);
            }

            const stripeCustomerId = client.stripe_customer_id;
            let effectivePmId = dto.stripe_payment_method_id ?? '';
            let cardBrand = dto.card_brand;
            let last4 = dto.last4;
            let expiryMonth = dto.expiry_month;
            let expiryYear = dto.expiry_year;

            // 2. Handle Payment Method Attachment
            if (dto.stripe_payment_method_id) {
                console.log(`[ClientService] Handling PM: ${dto.stripe_payment_method_id} for Customer: ${stripeCustomerId}`);

                try {
                    // Try to attach
                    const attachedPm = await this.stripeService.attachPaymentMethodToCustomer(
                        dto.stripe_payment_method_id,
                        stripeCustomerId,
                    );
                    // Use the ID from Stripe, as generic tokens like 'pm_card_visa' 
                    // get converted to real PM IDs upon attachment.
                    effectivePmId = attachedPm.id;
                    console.log(`[ClientService] Effective PM ID: ${effectivePmId}`);

                    // Also grab card details if we didn't have them
                    if (!cardBrand) cardBrand = attachedPm.card?.brand;
                    if (!last4) last4 = attachedPm.card?.last4;
                    if (!expiryMonth) expiryMonth = attachedPm.card?.exp_month;
                    if (!expiryYear) expiryYear = attachedPm.card?.exp_year;

                    // Add a small delay for consistency
                    await new Promise(resolve => setTimeout(resolve, 500));
                } catch (attachError: any) {
                    console.warn(`[ClientService] Attachment notice: ${attachError.message}`);

                    // Fallback: try to fetch details if PM exists
                    try {
                        const pm = await this.stripeService.getPaymentMethod(effectivePmId);
                        if (!cardBrand) cardBrand = pm.card?.brand;
                        if (!last4) last4 = pm.card?.last4;
                        if (!expiryMonth) expiryMonth = pm.card?.exp_month;
                        if (!expiryYear) expiryYear = pm.card?.exp_year;
                    } catch (e) { }
                }

                // 3. Set as Default
                try {
                    await this.stripeService.setDefaultPaymentMethod(effectivePmId, stripeCustomerId);
                    console.log(`[ClientService] Set default PM success`);
                } catch (defaultError: any) {
                    console.error(`[ClientService] Failed to set default PM: ${defaultError.message}`);
                }
            }

            // 4. Build encrypted masked card if we have card details
            let maskedCard: string | null = null;
            let encryptedMaskedCard: string | null = null;
            if (last4) {
                maskedCard = `**** **** **** ${last4}`;
                encryptedMaskedCard = EncryptionUtil.encrypt(maskedCard);
            }

            // 5. Create local billing record
            console.log(`[ClientService] Creating local billing record`);
            const billing = await this.prisma.billing.create({
                data: {
                    client_id: clientId,
                    billing_address: dto.billing_address,
                    stripe_customer_id: stripeCustomerId || null,
                    stripe_payment_method_id: effectivePmId || null,
                    card_brand: cardBrand || null,
                    encrypted_masked_card: encryptedMaskedCard,
                    expiry_month: expiryMonth ?? null,
                    expiry_year: expiryYear ?? null,
                },
            });
            console.log(`[ClientService] addBilling complete for ${clientId}`);
            // Return with decrypted masked card for immediate display
            return {
                ...billing,
                masked_card: maskedCard,  // plain masked string for the response
            };
        } catch (error) {
            console.error(`[ClientService] addBilling CRITICAL failure:`, error);
            throw error;
        }
    }

    async getInvoices(clientId: string) {
        const client = await this.prisma.imsUser.findUnique({ where: { client_id: clientId } });
        if (!client || !client.stripe_customer_id) return [];
        return this.stripeService.getCustomerInvoices(client.stripe_customer_id);
    }

    async updateBilling(billingId: string, dto: UpdateBillingDto) {
        await this._ensureBilling(billingId);
        return this.prisma.billing.update({
            where: { billing_id: billingId },
            data: dto,
        });
    }

    async removeBilling(billingId: string) {
        await this._ensureBilling(billingId);
        return this.prisma.billing.delete({ where: { billing_id: billingId } });
    }

    // ═══════════════════════════════════════════════
    // PRIVATE GUARD HELPERS
    private async _ensureClient(id: string) {
        const c = await this.prisma.imsUser.findUnique({ where: { client_id: id } });
        if (!c) throw new NotFoundException('Client not found');
    }

    private async _ensureLicense(id: string) {
        const l = await this.prisma.license.findUnique({ where: { license_id: id } });
        if (!l) throw new NotFoundException('License not found');
    }

    private async _ensureShipping(id: string) {
        const s = await this.prisma.shipping.findUnique({ where: { shipping_id: id } });
        if (!s) throw new NotFoundException('Shipping address not found');
    }

    private async _ensureBilling(id: string) {
        const b = await this.prisma.billing.findUnique({ where: { billing_id: id } });
        if (!b) throw new NotFoundException('Billing record not found');
    }

    /**
     * Decrypts the `encrypted_masked_card` field on every billing record
     * and adds a `masked_card` field (e.g. "**** **** **** 3528") for
     * safe frontend display. The full card number is NEVER stored or returned.
     */
    private _decryptBillings<T extends { billings?: any[] }>(client: T): T {
        if (!client.billings?.length) return client;
        return {
            ...client,
            billings: client.billings.map((b) => ({
                ...b,
                masked_card: b.encrypted_masked_card
                    ? EncryptionUtil.decrypt(b.encrypted_masked_card)
                    : null,
                // Never expose the raw encrypted value — strip it from response
                encrypted_masked_card: undefined,
            })),
        };
    }
}
