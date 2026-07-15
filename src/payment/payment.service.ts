import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import Stripe from "stripe";
import { ConfigService } from "@nestjs/config";
import { tryCatch } from "bullmq";
import {
  getStripeDeclineMessage,
  handleStripeError,
} from "src/utils/error-handler.util";

/**
 * Customer billing information forwarded to Stripe for AVS / Radar scoring.
 * All fields are optional; Stripe simply scores on whatever is provided.
 */
export interface BillingDetails {
  name?: string;
  email?: string;
  phone?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(private prisma: PrismaService, private configService: ConfigService) {
    this.stripe = new Stripe(this.configService.get<string>("STRIPE_SECRET_KEY"));
  }
  private returnUrl = this.configService.get<string>("VENDOR_RETURN_URL");

  async createCustomer(email: string, name: string): Promise<Stripe.Customer> {
    return this.stripe.customers.create({ email, name });
  }

  async getAccountCapabilities(accountId: string) {
    try {
      const account = await this.stripe.accounts.retrieve(accountId);
      return account.capabilities;
    } catch (error) {
      throw new Error(
        `Error retrieving account capabilities: ${error.message}`
      );
    }
  }

  async accountCreation(data: any) {
    try {
      const existingVendor = await this.prisma.vendors.findUnique({
        where: { id: data?.vendorId },
        select: { delieryId: true }
      })
      if (!existingVendor) {
        throw new NotFoundException("Vendor not found");
      }
      if (existingVendor.delieryId) {
        throw new BadRequestException("This vendor already has a Stripe account");
      }

      const existingAccounts = await this.stripe.accounts.list();

      const accountWithEmail = existingAccounts.data.find(
        (account) => account.email === data.email
      );

      if (accountWithEmail) {
        throw new BadRequestException('An account with this email already exists');
      }

      const account = await this.stripe.accounts.create({
        type: "custom",
        country: "US",
        business_type: "individual",
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },

        business_profile: {
          name: data.businessName || "Test Business 2",
          mcc: data.mcc || "5045",
          url: data.businessUrl || "https://atoms.com",
        },
        individual: {
          first_name: data.firstName || "John",
          last_name: data.lastName || "Doe",
          ssn_last_4: data.ssnLast4 || "0000",
          email: data.email || "johndoe@example.com",
          phone: data.phone || "+14185438090",
          dob: {
            day: data.dobDay || 1,
            month: data.dobMonth || 1,
            year: data.dobYear || 1990,
          },
          address: {
            line1: data.line1 || "123 Test St",
            city: data.city || "San Francisco",
            state: data.state || "CA",
            postal_code: data.postalCode || "94111",
            country: "US",
          },
        },
        tos_acceptance: {
          date: Math.floor(Date.now() / 1000),
          ip: data.ip || "192.168.0.1",
        },
        external_account: {
          object: "bank_account",
          country: "US",
          currency: "usd",
          account_holder_name: data.accountHolderName || "John Doe",
          account_holder_type: "individual",
          routing_number: data.routingNumber || "110000000",
          account_number: data.accountNumber || "000123456789",
        },
      });
      const existVendor = await this.prisma.vendors.findUnique({
        where: { id: data?.vendorId }
      })
      if (!existVendor) {
        throw new NotFoundException("Vendor not found");
      }
      await this.prisma.vendors.update({
        where: { id: existVendor.id },
        data: { delieryId: account?.id },
      });
      return account;
    } catch (error) {
      console.error('Stripe account creation error:', error);
      if (error instanceof Stripe.errors.StripeError) {
        if (error.statusCode === 400) {
          throw new BadRequestException('Stripe API error: ' + error.message);
        } else if (error.statusCode === 404) {
          throw new NotFoundException('Stripe API error: ' + error.message);
        } else {
          throw new Error('Stripe API error: ' + error.message);
        }
      } else if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      } else {
        throw new Error('An unexpected error occurred during account creation');
      }
    }
  }

  async deleteAccount(vendorId: string) {
    try {
      const vendor = await this.prisma.vendors.findUnique({
        where: { id: vendorId },
        select: { delieryId: true }
      });

      if (!vendor) {
        throw new NotFoundException("Vendor not found");
      }

      if (!vendor.delieryId) {
        throw new BadRequestException("This vendor doesn't have a Stripe account");
      }

      const existingAccounts = await this.stripe.accounts.list();
      const accountWithEmail = existingAccounts.data.find(
        (account) => account.id === vendor.delieryId
      );

      if (accountWithEmail) {
        await this.stripe.accounts.del(vendor.delieryId);
      } else {
        throw new NotFoundException("Vendor's Stripe account not found");
      }

      await this.prisma.vendors.update({
        where: { id: vendorId },
        data: { delieryId: null },
      });

      return { success: true, message: "Stripe account deleted successfully" };
    } catch (error) {
      console.error("Stripe account deletion error:", error.message);
      throw new BadRequestException(
        error.message || "Stripe account deletion error",
      );
    }
  }

  async getAccountDetails(accountId: string) {
    try {
      const account = await this.stripe.accounts.retrieve(accountId);
      return account;
    } catch (error) {
      console.error("Account verification error:", error.message);
      throw new InternalServerErrorException(
        error.message || "Failed to verify account",
      );
    }
  }

  async calculateTax(addressId: string, price: number) {
    try {
      if (price <= 0) {
        throw new BadRequestException("Price must be greater than zero");
      }

      const address = await this.prisma.address.findUnique({
        where: { id: addressId },
      });
      if (!address) {
        throw new NotFoundException("Address not found");
      }

      const stripeAddress = {
        line1: address.streetAddress,
        city: address.city,
        state: address.state,
        postal_code: address.zipCode,
        country: "US",
      };
      const taxCalculation = await this.stripe.tax.calculations.create({
        currency: "usd",
        line_items: [
          {
            amount: price,
            reference: "L1",
            tax_code: "txcd_99999999"
          },
        ],
        customer_details: {
          address: stripeAddress,
          address_source: "shipping"
        },
      });

      const taxAmount = taxCalculation.tax_amount_exclusive / 100;
      return taxAmount;
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) {
        throw new InternalServerErrorException(`${error.message}`);
      }
      throw new BadRequestException("Error calculating tax");
    }
  }

  async addBankAccount(accountId: string, bankAccountToken: string) {
    try {
      const bankAccount = await this.stripe.accounts.createExternalAccount(
        accountId,
        {
          external_account: bankAccountToken,
        }
      );
      return bankAccount;
    } catch (error) {
      throw new Error(`Error adding bank account: ${error.message}`);
    }
  }

  async createBankAccountToken(
    accountNumber: string,
    routingNumber: string,
    country: string,
    currency: string,
    vendorName: string
  ) {
    try {
      const bankAccountToken = await this.stripe.tokens.create({
        bank_account: {
          country: country,
          currency: currency,
          account_holder_name: vendorName,
          account_holder_type: "individual",
          routing_number: routingNumber,
          account_number: accountNumber,
        },
      });
      return bankAccountToken;
    } catch (error) {
      throw new Error(`Error creating bank account token: ${error.message}`);
    }
  }

  async createPaymentIntent(
    amount: number,
    currency: string,
    customerId: string,
    paymentMethodId: string,
    captureMethod: "automatic" | "manual",
    metadata: Record<string, string>,
    billingDetails?: BillingDetails
  ): Promise<Stripe.PaymentIntent> {
    try {
      // Attach the customer's billing name / email / address to the saved
      // payment method before charging. Stripe forwards these to the issuer
      // for AVS (Address Verification) and feeds them into Radar's risk model,
      // which reduces false-positive "fraudulent" declines on valid cards.
      if (billingDetails) {
        await this.updatePaymentMethodBillingDetails(paymentMethodId, billingDetails);
      }

      return await this.stripe.paymentIntents.create({
        amount,
        currency,
        customer: customerId,
        payment_method: paymentMethodId,
        capture_method: captureMethod,
        metadata,
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: "never",
        },
      });
    } catch (error) {
      // Preserve the real Stripe reason (e.g. a card declined as fraudulent)
      // so the caller can surface an actionable message to the client.
      const stripeError = handleStripeError(error);
      if (stripeError) {
        throw stripeError;
      }
      throw new NotFoundException("Payment failed during order");
    }
  }

  /**
   * Updates a saved payment method's billing details (name, email, address)
   * so the issuer can run AVS and Radar gets stronger signals. Best-effort:
   * a failure here must not block an otherwise-valid checkout, so we log and
   * continue rather than throw.
   */
  async updatePaymentMethodBillingDetails(
    paymentMethodId: string,
    billingDetails: BillingDetails
  ): Promise<void> {
    try {
      const address: Stripe.AddressParam = {
        line1: billingDetails.line1 || undefined,
        line2: billingDetails.line2 || undefined,
        city: billingDetails.city || undefined,
        state: billingDetails.state || undefined,
        postal_code: billingDetails.postalCode || undefined,
        country: billingDetails.country || "US",
      };

      await this.stripe.paymentMethods.update(paymentMethodId, {
        billing_details: {
          name: billingDetails.name || undefined,
          email: billingDetails.email || undefined,
          phone: billingDetails.phone || undefined,
          address,
        },
      });
    } catch (error) {
      console.error(
        `[StripeService] Failed to update billing details for PM ${paymentMethodId}:`,
        error?.message
      );
    }
  }

  async capturePaymentIntent(
    paymentIntentId: string
  ): Promise<Stripe.PaymentIntent> {
    try {
      return await this.stripe.paymentIntents.capture(paymentIntentId);
    } catch (error) {
      const stripeError = handleStripeError(error);
      if (stripeError) {
        throw stripeError;
      }
      throw error;
    }
  }

  async createTransfer(
    amount: number,
    currency: string,
    destination: string
  ): Promise<Stripe.Transfer> {
    return this.stripe.transfers.create({
      amount,
      currency,
      destination,
    });
  }

  async reverseTransfer(transferId: string, amount?: any): Promise<Stripe.TransferReversal> {
    try {
      const options = amount ? { amount: Math.round(amount * 100) } : {};
      return await this.stripe.transfers.createReversal(transferId, options);
    } catch (error) {
      throw new Error(`Error reversing transfer: ${error.message}`);
    }
  }

  async confirmPaymentIntent(
    paymentIntentId: string
  ): Promise<Stripe.PaymentIntent> {
    try {
      // With manual capture, the card is authorized here — this is where a
      // valid card can be declined as fraudulent by the issuer or Stripe Radar.
      const paymentIntent = await this.stripe.paymentIntents.confirm(paymentIntentId);

      // confirm() can resolve without throwing while leaving the intent in a
      // non-successful state (e.g. requires_payment_method after a soft decline).
      if (
        paymentIntent.status === "requires_payment_method" ||
        paymentIntent.status === "canceled"
      ) {
        const lastError = (paymentIntent.last_payment_error as any) || {};
        throw new BadRequestException(getStripeDeclineMessage(lastError));
      }

      return paymentIntent;
    } catch (error) {
      const stripeError = handleStripeError(error);
      if (stripeError) {
        throw stripeError;
      }
      throw error;
    }
  }

  async cancelPaymentIntent(paymentIntentId: string) {
    return this.stripe.paymentIntents.cancel(paymentIntentId);
  }

  async getPaymentIntent(paymentIntentId: string) {
    return this.stripe.paymentIntents.retrieve(paymentIntentId);
  }

  async getPaymentMethods(customerId: string) {
    try {
      return this.stripe.paymentMethods.list({
        customer: customerId,
        type: "card",
      });
    } catch (error) {
      throw new Error(`Error while fetching cards: ${error.message}`);
    }
  }

  async getPaymentMethod(paymentMethodId: string) {
    try {
      return await this.stripe.paymentMethods.retrieve(paymentMethodId);
    } catch (error) {
      throw new Error(`Error fetching payment method: ${error.message}`);
    }
  }

  async removePaymentMethod(paymentMethodId: string) {
    try {
      await this.stripe.paymentMethods.detach(paymentMethodId);
      return {
        message: "Payment method deleted successfully"
      }
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) {
        throw new InternalServerErrorException(`${error.message}`);
      }
      throw new InternalServerErrorException(`${error.message}`);
    }
  }

  async createPayout(
    amount: number,
    currency: string,
    connectedAccountId: string
  ) {
    try {
      const payout = await this.stripe.payouts.create(
        {
          amount: amount,
          currency: currency,
          destination: connectedAccountId,
        },
        {
          stripeAccount: connectedAccountId,
        }
      );
      return payout;
    } catch (error) {
      throw new Error(`Error creating payout: ${error.message}`);
    }
  }

  async attachPaymentMethodToCustomer(
    paymentMethodId: string,
    customerId: string
  ) {
    try {
      console.log(`[StripeService] Attaching PM ${paymentMethodId} to customer ${customerId}`);
      const pm = await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });
      console.log(`[StripeService] Attached PM successfully`);
      return pm;
    } catch (error) {
      console.error(`[StripeService] Attachment failed:`, error.message);
      throw new Error(
        `Error attaching payment method to customer: ${error.message}`
      );
    }
  }

  async setDefaultPaymentMethod(paymentMethodId: string, customerId: string) {
    try {
      console.log(`[StripeService] Setting default PM ${paymentMethodId} for customer ${customerId}`);
      const customer = await this.stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
      console.log(`[StripeService] Set default PM successfully`);
      return customer;
    } catch (error) {
      console.error(`[StripeService] Set default PM failed:`, error.message);
      throw new Error(`Error setting default payment method: ${error.message}`);
    }
  }

  async getCustomerInvoices(customerId: string) {
    try {
      return await this.stripe.invoices.list({
        customer: customerId,
      });
    } catch (error) {
      throw new Error(`Error fetching invoices: ${error.message}`);
    }
  }

  async createRefund(amount: number, paymentIntentId: string, reason: string) {
    try {
      if (!amount || !paymentIntentId) {
        throw new BadRequestException('Invalid refund parameters.');
      }
      const refund = await this.stripe.refunds.create({
        amount: amount,
        payment_intent: paymentIntentId,
        metadata: {
          reason: reason
        }
      });
      return refund;
    } catch (error) {
      console.error("Stripe refund error:", error);
      if (error instanceof Stripe.errors.StripeError) {
        throw new InternalServerErrorException(`${error.message}`);
      }
      throw new BadRequestException("Refund process failed");
    }
  }

  async getRefund(refundId: string) {
    try {
      const refundData = await this.stripe.refunds.retrieve(refundId);
      if (!refundData) {
        throw new NotFoundException('Refund not found');
      }
      return refundData;
    } catch (error) {
      throw new Error(`Error fetching refund data", ${error.message}`);
    }
  }

  async createAccountLink(vendorId: string, account: string): Promise<Stripe.AccountLink> {
    try {
      const vendor = await this.prisma.vendors.findUnique({
        where: { id: vendorId },
        include: { connectAccount: true }
      });

      if (!vendor) {
        throw new NotFoundException('Vendor not found');
      }

      const stripeAccount = await this.stripe.accounts.retrieve(account);
      const needsOnboarding = this.checkOnboardingStatus(stripeAccount);

      if (needsOnboarding) {
        const accountLink = await this.stripe.accountLinks.create({
          account: account,
          return_url: this.returnUrl,
          refresh_url: this.returnUrl,
          type: 'account_onboarding',
        });

        if (!accountLink?.url) {
          throw new Error('Invalid account link response from Stripe');
        }

        return accountLink;
      } else {
        await this.createLoginLink(vendor.id);
        console.warn("Account is already completed please login on your account!")
      }

    } catch (error) {
      console.error('Error creating Stripe account link:', error);
    }
  }

  async createAccount(vendorId: string): Promise<{ account: string; url: string }> {
    try {
      const vendor = await this.prisma.vendors.findUnique({
        where: { id: vendorId }
      });

      if (!vendor) {
        throw new NotFoundException('Vendor not found');
      }

      let stripeAccount: Stripe.Account;
      let accountId = vendor.delieryId;

      if (!accountId) {
        stripeAccount = await this.stripe.accounts.create({
          country: "US",
          type: "express",
          email: vendor?.email,
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true }
          },
          business_profile: {
            product_description: "Vendor account",
            url: vendor.websiteUrl || undefined
          }
        });

        if (!stripeAccount?.id) {
          throw new Error('Failed to create Stripe account: No account ID returned');
        }

        accountId = stripeAccount.id;

        await this.prisma.vendors.update({
          where: { id: vendorId },
          data: { delieryId: accountId },
        });
      } else {
        stripeAccount = await this.stripe.accounts.retrieve(accountId);
      }

      const needsOnboarding = await this.checkOnboardingStatus(stripeAccount);

      if (needsOnboarding) {
        const accountLink = await this.createAccountLink(vendorId, accountId);
        if (!accountLink?.url) {
          throw new Error('Failed to create Stripe onboarding link');
        }
        return {
          account: accountId,
          url: accountLink.url
        };
      } else {
        const loginLink = await this.createLoginLink(vendorId);
        return {
          account: accountId,
          url: loginLink.url
        };
      }

    } catch (error) {
      console.error('Error creating Stripe account:', error);

      if (error instanceof Stripe.errors.StripeError) {
        throw new BadRequestException(`Stripe error: ${error.message}`);
      }

      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error creating Stripe account: ${error.message}`);
    }
  }

  async createLoginLink(vendorId: string) {
    try {
      const vendor = await this.prisma.vendors.findUnique({
        where: { id: vendorId }
      })
      if (!vendor) {
        throw new NotFoundException("Vendor not found");
      }

      if (vendor.link) {
        throw new BadRequestException("Vendor already has a connect account login link");
      }

      const link = await this.stripe.accounts.createLoginLink(vendor.delieryId);

      if (link && link.url) {
        await this.prisma.vendors.update({
          where: { id: vendorId },
          data: {
            link: link.url
          }
        })
      }
      return link;


    } catch (error) {
      console.error('Error creating Stripe login link:', error);
      if (error?.type === 'StripeInvalidRequestError') {
        throw new BadRequestException(`Invalid Stripe request: ${error.message}`);
      }
      throw new InternalServerErrorException('Failed to create login link');
    }
  }

  async checkOnboardingStatus(account: Stripe.Account): Promise<boolean> {
    if (!account.details_submitted) return true;
    if (!account.charges_enabled) return true;
    if (!account.payouts_enabled) return true;

    const requiredCapabilities = ['card_payments', 'transfers'];
    for (const capability of requiredCapabilities) {
      const status = account.capabilities?.[capability];
      if (status !== 'active') return true;
    }

    if (account.requirements) {
      if (account.requirements.disabled_reason) return true;
      if (account.requirements.currently_due?.length > 0) return true;
      if (account.requirements.past_due?.length > 0) return true;
      if (account.requirements.pending_verification?.length > 0) return true;
    }

    return false;
  }

  async getAdminTransactions(
    adminId: string,
    status?: Stripe.Charge.Status,
    limit = 10,
    page = 1,
    createdDate?: number,
    searchId?: string,
  ) {
    try {
      const offset = (page - 1) * limit;
      const stripeLimit = Math.min(100, limit * 2);

      const params: Stripe.ChargeListParams = {
        limit: stripeLimit,
      };

      if (createdDate) {
        const startOfDay = createdDate - (createdDate % 86400);
        const endOfDay = startOfDay + 86399;
        params.created = { gte: startOfDay, lte: endOfDay };
      }

      let allCharges: Stripe.Charge[] = [];
      let hasMore = true;
      let lastId: string | undefined = undefined;
      const maxRecordsNeeded = (page + 1) * limit * 3;

      while (hasMore && allCharges.length < maxRecordsNeeded) {
        if (lastId) {
          params.starting_after = lastId;
        }

        const response = await this.stripe.charges.list(params);
        const batch = response.data;

        if (batch.length > 0) {
          allCharges = [...allCharges, ...batch];
          lastId = batch[batch.length - 1].id;
          hasMore = response.has_more;
        } else {
          hasMore = false;
        }

        if (allCharges.length >= maxRecordsNeeded) {
          break;
        }
      }

      let charges = allCharges;
      if (status) {
        charges = charges.filter(charge => charge.status === status);
      }

      if (searchId) {
        const searchTerm = searchId.toLowerCase().trim();
        charges = charges.filter(charge =>
          charge.id.toLowerCase().includes(searchTerm) ||
          (charge.payment_intent &&
            charge.payment_intent.toString().toLowerCase().includes(searchTerm))
        );
      }

      const enrichedPromises = charges.map(async (charge) => {
        const metadata = charge.metadata;
        const userId = metadata?.userId;

        if (!userId) return null;

        const order = await this.prisma.orders.findFirst({
          where: { userId },
          include: {
            products: {
              include: {
                vendor: true,
              }
            }
          }
        });

        if (!order) return null;

        const hasVendorUnderAdmin = order.products.some(item => item.vendor?.adminId === adminId);

        if (!hasVendorUnderAdmin) return null;

        return {
          ...charge,
          createdDate: new Date(charge.created * 1000),
          orderId: order.id,
          vendorIds: order.products.map(p => p.vendorId),
        };
      });

      const enriched = await Promise.all(enrichedPromises);
      const filtered = enriched.filter(Boolean) as any[];

      filtered.sort((a, b) => b.created - a.created);

      const paginated = filtered.slice(offset, offset + limit);

      const totalTransactions = filtered.length;
      const totalPages = Math.ceil(totalTransactions / limit);

      return {
        data: paginated,
        currentPage: page,
        totalPages: totalPages,
        totalTransactions: totalTransactions,
        hasMore: hasMore && totalTransactions === filtered.length,
        limit: limit
      };
    } catch (error: any) {
      console.error("Error fetching admin transactions", error);
      throw new Error(`Error fetching admin transactions: ${error.message}`);
    }
  }

  async getTransaction(transactionId: string) {
    try {
      const charge = await this.stripe.charges.retrieve(transactionId);

      if (!charge) {
        throw new Error('Transaction not found');
      }

      const userId = charge.metadata?.userId;

      if (!userId) {
        throw new Error('No userId found in charge metadata');
      }

      return {
        ...charge,
        createdDate: new Date(charge.created * 1000),
      };
    } catch (error: any) {
      throw new Error(`Error fetching transaction: ${error.message}`);
    }
  }

  async getAllTransactions(
    status?: Stripe.Charge.Status,
    limit = 10,
    page = 1,
    createdDate?: number,
    searchId?: string,
  ) {
    try {
      const skip = (page - 1) * limit;
      const params: Stripe.ChargeListParams = {
        limit: Math.min(100, limit + skip),
      };

      if (createdDate) {
        const startOfDay = createdDate - (createdDate % 86400);
        const endOfDay = startOfDay + 86399;
        params.created = { gte: startOfDay, lte: endOfDay };
      }

      const response = await this.stripe.charges.list(params);
      let charges = response.data;

      if (status) {
        charges = charges.filter(charge => charge.status === status);
      }

      if (searchId) {
        const term = searchId.toLowerCase().trim();
        charges = charges.filter(charge =>
          charge.id.toLowerCase().includes(term) ||
          (charge.payment_intent &&
            charge.payment_intent.toString().toLowerCase().includes(term))
        );
      }

      const enrichedCharges = await Promise.all(charges.map(async (charge) => {
        let orderId: string | undefined;
        if (charge.metadata?.cartId) {
          try {
            const cart = await this.prisma.cart.findUnique({
              where: { id: charge.metadata.cartId },
              select: {
                userId: true,
              }
            });
            if (cart) {
              const order = await this.prisma.orders.findFirst({
                where: {
                  userId: cart.userId,
                },
                orderBy: { createdAt: 'desc' },
                select: { id: true }
              });

              if (order) {
                orderId = order.id;
              }
            }
          } catch (error) {
            console.error(`Error finding order for charge ${charge.id}:`, error);
          }
        }

        return {
          ...charge,
          createdDate: new Date(charge.created * 1000),
          orderId,
        };
      }));
      enrichedCharges.sort((a, b) => b.created - a.created);

      const totalTransactions = enrichedCharges.length;
      const totalPages = Math.ceil(totalTransactions / limit);

      const paginatedCharges = enrichedCharges.slice(skip, skip + limit);
      return {
        data: paginatedCharges,
        currentPage: page,
        totalPages: totalPages,
        totalTransactions: totalTransactions,
        limit: limit,
      };
    } catch (error: any) {
      console.error("Error fetching all transactions", error);
      throw new Error(`Error fetching transactions: ${error.message}`);
    }
  }

  async createCharges() {
    try {
      return await this.stripe.charges.create({
        amount: 10000000,
        currency: 'usd',
        source: 'tok_bypassPending',
        description: 'Funding test account balance',
      })
    } catch (error) {
      console.error("Error create charges for testing", error);
      throw new Error(`Error create charges: ${error.message}`);
    }
  }

  async getConnectAccountBalance(delieryId: string) {
    try {
      const balance = await this.stripe.balance.retrieve({
        stripeAccount: delieryId,
      });
      return balance;
    } catch (error) {
      console.error("Error fetching vendor balance", error);
      throw new Error(`Error fetch balance: ${error.message}`);
    }
  }

  async transferList() {
    return await this.stripe.transfers.list()
  }

  async transferDetails(transferId: string) {
    try {
      const transfer = await this.stripe.transfers.retrieve(transferId);
      return transfer;
    } catch (error) {
      console.error("Error fetching transfer details", error);
      throw new Error(`Error fetching transfer details: ${error.message}`);
    }
  }

  async getStripeFee(paymentIntentId: string) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(
        paymentIntentId,
        {
          expand: ['latest_charge.balance_transaction']
        }
      );

      const charge = paymentIntent.latest_charge as Stripe.Charge;
      const balanceTransaction = charge.balance_transaction as Stripe.BalanceTransaction;

      return {
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        fee: balanceTransaction.fee,
        net: balanceTransaction.net,
        feeDetails: balanceTransaction.fee_details,
        breakdown: {
          totalAmount: paymentIntent.amount / 100,
          stripeFee: balanceTransaction.fee / 100,
          netAmount: balanceTransaction.net / 100,
          percentageFee: (balanceTransaction.fee / paymentIntent.amount * 100).toFixed(2) + '%'
        }
      };
    } catch (error) {
      console.error("Error fetching stripe fee details", error);
      throw new Error(`Error fetching stripe fee details: ${error.message}`);
    }
  }

  async getPlatformBalance(): Promise<{
    available: number;
    pending: number;
    total: number;
    currency: string;
  }> {
    try {
      const balance = await this.stripe.balance.retrieve();

      const usdBalance = balance.available.find(
        (b) => b.currency === 'usd'
      ) || {
        amount: 0,
        currency: 'usd',
      };

      const pendingUsdBalance = balance.pending.find(
        (b) => b.currency === 'usd'
      ) || {
        amount: 0,
        currency: 'usd',
      };

      return {
        available: usdBalance.amount,
        pending: pendingUsdBalance.amount,
        total: usdBalance.amount + pendingUsdBalance.amount,
        currency: usdBalance.currency,
      };
    } catch (error) {
      console.error('Error retrieving Stripe balance:', error);
      throw new Error('Failed to retrieve platform balance');
    }
  }

}