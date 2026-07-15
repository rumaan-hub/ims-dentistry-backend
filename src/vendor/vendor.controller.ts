import {
  Controller,
  Post,
  Body,
  Put,
  UseGuards,
  Param,
  Req,
  Get,
  Query,
  Headers,
  RawBodyRequest,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { LoginDTO } from "src/user/dto/login-user.dto";
import { VendorService } from "./vendor.service";
import { CreateVendorDto, ResendEmailDTO } from "./dto/create-vendor.dto";
import { JwtGuard } from "src/user/guard/jwt.guard";
import { RolesGuard } from "src/user/role/role.guard";
import { Role } from "src/user/role/role.enum";
import { Roles } from "src/user/role/role.decorator";
import { DeactivateVendorDto, UpdateVendorDto } from "./dto/update-vendor.dto";
import { UpdatePasswordDto } from "src/user/dto/updatePasswordDto.dto copy";
import { ResetPasswordDto } from "src/user/dto/resetPassword.dto";
import Stripe from "stripe";
import { PrismaService } from "src/prisma/prisma.service";
import { MailerService } from "src/mailer/mailer.service";
import { StripeService } from "src/payment/payment.service";
import { getVendorStripeAccountCreateTemplate, getVendorStripeAccountDisconnectedTemplate } from "src/utils/email-templates";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { FilterOptions } from "./dto/filter-options.dto";

@Controller("vendor")
export class VendorController {
  private readonly stripe: Stripe;
  public stripeWebhookSecret: string;
  private readonly logger: Logger = new Logger(VendorController.name);

  constructor(
    private readonly vendorService: VendorService,
    private prismaService: PrismaService,
    private mailerService: MailerService,
    private stripeService: StripeService,
    private eventEmitter: EventEmitter2
  ) {
    this.stripeWebhookSecret = process.env.STRIPE_CONNECT_ACCOUNT_WEBHOOK_SECRET_KEY;
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
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
      console.error('Webhook signature verification for connect account failed:', err.message);
      throw new BadRequestException(`Connect Account Webhook Error: ${err.message}`);
    }

    switch (event.type) {
      case 'account.updated':
        await this.handleAccountUpdated(event);
        break;
      case 'account.application.authorized':
        await this.handleAccountAuthorized(event);
        break;
      case 'account.application.deauthorized':
        await this.handleAccountDeauthorized(event);
        break;
      case 'account.external_account.created':
        await this.handleExternalAccountCreated(event);
        break;
      case 'account.external_account.updated':
        await this.handleExternalAccountUpdated(event);
        break;
      case 'account.external_account.deleted':
        await this.handleExternalAccountDeleted(event);
        break;
      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }

    return { received: true, eventType: event.type };
  }

  @Post("signup")
  signupForSuperAdmin(@Body() createAdminDto: CreateVendorDto) {
    return this.vendorService.signupForVendor(createAdminDto);
  }

  @Get('verify-email')
  async verifyVendorEmail(@Query('token') token: string) {
    return this.vendorService.verifyVendorEmail(token);
  }

  @Post('resend-verification')
  async resendVerification(@Body() body: ResendEmailDTO) {
    return this.vendorService.resendVerificationEmail(body.email);
  }

  @Post("login")
  login(@Body() createAdminDto: LoginDTO) {
    return this.vendorService.login(createAdminDto);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.VENDOR, Role.ADMIN, Role.SUPER_ADMIN)
  @Get(":id")
  getSpecificVendor(@Param("id") id: string) {
    return this.vendorService.getSpecificVendor(id);
  }

  @UseGuards(JwtGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Get("")
  getAllVendors(
    @Query("page") page: string | number = "1",
    @Query("limit") limit: string | number = "10",
    @Query("search") searchTerm: string,
    @Query("approved") approved: string | boolean,
    @Query("status") status: string
  ) {
    page = Number(page);
    limit = Number(limit);
    approved =
      approved !== undefined
        ? approved === "true"
          ? true
          : approved === "false"
            ? false
            : undefined
        : undefined;
    return this.vendorService.getAllVendors(page, limit, searchTerm, approved, status);
  }

  @UseGuards(JwtGuard)
  @Get(":id/vendor-dashboard")
  getVendorDashboardData(
    @Param("id") id: string,
    @Query("startDate") startDateStr: string,
    @Query("endDate") endDateStr: string,
    @Query("timeFrame") timeFrame: string
  ) {
    const startDate = startDateStr ? new Date(startDateStr) : undefined;
    const endDate = endDateStr ? new Date(endDateStr) : undefined;

    return this.vendorService.getVendorDashboardData(id, startDate, endDate, timeFrame);
  }

  @UseGuards(JwtGuard)
  @Get(':id/vendor-summary')
  getVendorDashboard(
    @Param('vendorId') vendorId: string,
    @Query('year') year: string = new Date().getFullYear().toString(),
  ) {
    return this.vendorService.getVendorDashboard(vendorId, year);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.VENDOR)
  @Put(":id/update")
  updateVendor(
    @Param("id") userId: string,
    @Body() updatedSuperAdminData: UpdateVendorDto,
  ) {
    return this.vendorService.updateVendor(
      userId,
      updatedSuperAdminData
    );
  }

  @Put("forgetPassword")
  forgetPassword(@Body("email") email: string) {
    return this.vendorService.forgetPassword(email);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.VENDOR)
  @Put("verifyToken")
  verifyToken() {
    return this.vendorService.verifyToken();
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.VENDOR)
  @Post(":id/update-Password")
  updatePassword(@Param("id") id: string, @Body() dto: UpdatePasswordDto) {
    return this.vendorService.updatePassword(id, dto);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.VENDOR)
  @Post(":id/reset-Password")
  resetPassword(@Param("id") id: string, @Body() dto: ResetPasswordDto) {
    return this.vendorService.resetPassword(id, dto);
  }

  @Put(':id/deactivate')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async deactivateVendor(@Param('id') vendorId: string, @Body() deactivateVendorDto: DeactivateVendorDto) {
    return this.vendorService.deactivateVendor(vendorId, deactivateVendorDto);
  }

  @Put(':id/reactivate')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async reactivateVendor(@Param('id') vendorId: string) {
    return this.vendorService.activateVendor(vendorId);
  }

  @Get('/:vendorId/transfers')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async getVendorTransfers(
    @Param('vendorId') vendorId: string,
    @Query() query: FilterOptions,
  ) {
    return this.vendorService.getVendorTransfers({
      ...query,
      vendorId,
    });
  }

  private async handleAccountAuthorized(event: Stripe.Event) {
    const account = event.data.object as Stripe.Account;
    this.logger.log('Stripe application authorized for account:', account.id);
  }

  private async handleAccountUpdated(event: Stripe.Event) {
    const account = event.data.object as Stripe.Account;
    this.logger.log('Stripe account updated:', account.id);
    const fullAccount = await this.stripe.accounts.retrieve(account.id, {
      expand: ['individual', 'external_accounts']
    });

    const vendor = await this.prismaService.vendors.findFirst({
      where: { delieryId: account.id },
      include: { connectAccount: true }
    });

    if (!vendor) {
      this.logger.warn(`No vendor found for Stripe account ${account.id}`);
      return;
    }

    const needsOnboarding =
      (account.requirements.currently_due.length > 0 ||
        account.requirements.past_due.length > 0 ||
        account.requirements.pending_verification.length > 0) ||
      (account.capabilities?.transfers !== "active") ||
      (account.capabilities?.card_payments !== "active") ||
      !account.details_submitted ||
      !account.charges_enabled ||
      !account.payouts_enabled;

    if (!needsOnboarding) {
      let loginLinkCreated = false;
      if (!vendor.link) {
        const link = await this.stripeService.createLoginLink(vendor.id);
        this.logger.log(`Created Stripe login link for vendor ${vendor.id}`);
        loginLinkCreated = true;

        await this.mailerService.sendEmail(
          vendor.email,
          'Stripe Connect Complete',
          getVendorStripeAccountCreateTemplate(vendor)
        )
      } else {
        this.logger.warn(`Stripe account login link already exists for ${account.id}. Not recreating.`);
      }

      this.eventEmitter.emit(vendor.id, 'stripe.loginLinkUpdated', {
        hasLoginLink: !!vendor.link || loginLinkCreated,
        loginLinkUrl: vendor.link
      });

    }

    const connectAccountData = this.prepareConnectAccountData(fullAccount);
    if (vendor.connectAccount) {
      await this.prismaService.connectAccount.update({
        where: { vendorId: vendor.id },
        data: connectAccountData
      });
      this.logger.log(`Updated connect account for vendor ${vendor.id}`);
    } else if (fullAccount.details_submitted) {
      await this.prismaService.connectAccount.create({
        data: {
          ...connectAccountData,
          vendorId: vendor.id
        }
      });
      this.logger.log(`Created new connect account for vendor ${vendor.id}`);

      await this.mailerService.sendEmail(
        vendor.email,
        'Onboarding Complete',
        'Your Stripe Connect onboarding is complete. Your account is now ready to accept payments.'
      );
    }

  }

  private async handleAccountDeauthorized(event: Stripe.Event) {
    const account = event.data.object as Stripe.Account;
    this.logger.log('Stripe account deauthorized:', account.id);

    const vendor = await this.prismaService.vendors.findFirst({
      where: { delieryId: account.id }
    });
    if (vendor) {
      await this.mailerService.sendEmail(
        vendor.email,
        'Stripe Connect Deauthorized',
        getVendorStripeAccountDisconnectedTemplate(vendor)
      );
    }

  }

  private async handleExternalAccountCreated(event: Stripe.Event) {
    const externalAccount = event.data.object as Stripe.BankAccount | Stripe.Card;
    this.logger.log('External account added:', externalAccount.id);

    const accountId = externalAccount.account as string;
    const vendor = await this.prismaService.vendors.findFirst({
      where: { delieryId: accountId }
    });

    if (vendor) {
      if (externalAccount.object === 'bank_account') {
        const bankAccount = externalAccount as Stripe.BankAccount;
        await this.prismaService.connectAccount.update({
          where: { vendorId: vendor.id },
          data: {
            accountHolderName: bankAccount.account_holder_name || '',
            accountNumber: bankAccount.last4 ? `****${bankAccount.last4}` : '',
            routingNumber: bankAccount.routing_number || ''
          }
        });
      }
    }
  }

  private async handleExternalAccountUpdated(event: Stripe.Event) {
    const externalAccount = event.data.object as Stripe.BankAccount | Stripe.Card;
    this.logger.log('External account updated:', externalAccount.id);

    const accountId = externalAccount.account as string;
    const vendor = await this.prismaService.vendors.findFirst({
      where: { delieryId: accountId }
    });

    if (vendor && externalAccount.object === 'bank_account') {
      const bankAccount = externalAccount as Stripe.BankAccount;
      await this.prismaService.connectAccount.update({
        where: { vendorId: vendor.id },
        data: {
          accountHolderName: bankAccount.account_holder_name || '',
          accountNumber: bankAccount.last4 ? `****${bankAccount.last4}` : '',
          routingNumber: bankAccount.routing_number || ''
        }
      });
    }
  }

  private async handleExternalAccountDeleted(event: Stripe.Event) {
    const externalAccount = event.data.object as Stripe.BankAccount | Stripe.Card;
    this.logger.log('External account deleted:', externalAccount.id);

    const accountId = externalAccount.account as string;
    const vendor = await this.prismaService.vendors.findFirst({
      where: { delieryId: accountId }
    });

    if (vendor) {
      const accounts = await this.stripe.accounts.listExternalAccounts(accountId);
      if (accounts.data.length === 0) {
        await this.prismaService.connectAccount.update({
          where: { vendorId: vendor.id },
          data: {
            accountHolderName: '',
            accountNumber: '',
            routingNumber: ''
          }
        });
      }
    }
  }

  private prepareConnectAccountData(account: Stripe.Account): any {
    const individual = account.individual;
    const businessProfile = account.business_profile;
    const address = individual?.address;
    const externalAccounts = account.external_accounts?.data as Stripe.BankAccount[];
    const defaultBankAccount = externalAccounts?.[0];

    return {
      businessType: account?.business_type || 'individual',
      country: account?.country || '',
      businessName: businessProfile?.name || null,
      websiteURL: businessProfile?.url || null,
      email: individual.email,
      MCC: businessProfile?.mcc || null,
      phone: individual?.phone || '',
      firstName: individual?.first_name || '',
      lastName: individual?.last_name || '',
      dateOfBirth: individual?.dob
        ? `${individual.dob.day}/${individual.dob.month}/${individual.dob.year}`
        : '',
      SNN: null,
      ENN: null,
      streetAddress: address?.line1 || '',
      building: address?.line2 || '',
      city: address?.city || '',
      state: address?.state || '',
      zipCode: address?.postal_code || '',
      accountHolderName: defaultBankAccount?.account_holder_name || '',
      accountNumber: defaultBankAccount?.last4 ? `****${defaultBankAccount.last4}` : '',
      routingNumber: defaultBankAccount?.routing_number || '',
    };
  }
}
