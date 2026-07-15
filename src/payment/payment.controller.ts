import { Body, Controller, Get, Param, Post, Delete, ParseFloatPipe, Query } from "@nestjs/common";
import { StripeService } from "./payment.service";
import Stripe from "stripe";
@Controller("stripe")
export class StripeController {
  
  constructor(private readonly stripeService: StripeService) {
  }
  
  @Post("create-customer")
  async createCustomer(@Body() body: { email: string; name: string }) {
    return this.stripeService.createCustomer(body.email, body.name);
  }

  @Post("create-payment-intent")
  async createPaymentIntent(
    @Body()
    body: {
      amount: number;
      currency: string;
      customerId: string;
      paymentMethodId: string;
      captureMethod: "automatic" | "manual";
      metadata: Record<string, string>;
    }
  ) {
    return this.stripeService.createPaymentIntent(
      body.amount,
      body.currency,
      body.customerId,
      body.paymentMethodId,
      body.captureMethod,
      body.metadata
    );
  }

  @Get("payment-intent/:paymentIntentId/capture")
  async capturePaymentIntent(
    @Param("paymentIntentId") paymentIntentId: string
  ) {
    return this.stripeService.capturePaymentIntent(paymentIntentId);
  }

  @Get("payment-method/:customerId")
  async getPaymentMethods(@Param("customerId") paymentMethodId: string) {
    return this.stripeService.getPaymentMethods(paymentMethodId);
  }

  @Post("create-payment-transfer")
  async createTransfer(
    @Body()
    body: {
      amount: number;
      currency: string;
      destination: string;
    }
  ) {
    return this.stripeService.createTransfer(
      body.amount,
      body.currency,
      body.destination
    );
  }

  @Post('/account_link')
  async createAccountLink(
    @Body() { account }: { account: string },
    @Query('vendorId') vendorId: string
  ) {
    return this.stripeService.createAccountLink(vendorId, account);
  }

  @Post('/account/:vendorId')
  async createAccount(@Param('vendorId') vendorId: string) {
    return this.stripeService.createAccount(vendorId);
  }

  @Post('/connect-account-link/:vendorId')
  async createLoginLink(@Param('vendorId') vendorId: string) {
    return this.stripeService.createLoginLink(vendorId);
  }

  @Post('connect-account')
  async accountCreation(@Body() body: any) {
    return this.stripeService.accountCreation(body);
  }

  @Delete('delete-account/:vendorId')
  async deleteAccount(@Param('vendorId') vendorId: string) {
    return this.stripeService.deleteAccount(vendorId);
  }

  @Get('verify-account/:accountId')
  async getAccountDetails(@Param('accountId') accountId: string) {
    return this.stripeService.getAccountDetails(accountId);
  }
  @Get("payment-intent/:paymentMethodId/confirm")
  async confirmPaymentIntent(@Param("paymentMethodId") paymentMethodId: string) {
    return this.stripeService.confirmPaymentIntent(paymentMethodId);
  }
  
  @Get("payment-intent/:paymentMethodId/cancel")
  async cancelPaymentIntent(@Param("paymentMethodId") paymentMethodId: string) {
    return this.stripeService.cancelPaymentIntent(paymentMethodId);
  }

  @Delete('remove-card/:paymentMethodId')
  async removeCard(@Param('paymentMethodId') paymentMethodId: string ) {
      return this.stripeService.removePaymentMethod(paymentMethodId);
  }

  @Get('attachPaymentMethodToCustomer/customer/:customerId/paymentMethod/:paymentMethodId')
  async attachPaymentMethodToCustomer(
    @Param('paymentMethodId') paymentMethodId: string,
    @Param('customerId') customerId: string
  ) {
    return this.stripeService.attachPaymentMethodToCustomer(paymentMethodId, customerId);
  }

  @Get('defaultPaymentMethod/customer/:customerId/paymentMethod/:paymentMethodId')
  async setDefaultPaymentMethod(
    @Param('paymentMethodId') paymentMethodId: string,
    @Param('customerId') customerId: string
  ) {
    return this.stripeService.setDefaultPaymentMethod(paymentMethodId, customerId);
  }

  @Get('calculate-tax/address/:addressId/price/:price')
  async calculateTax(
    @Param('addressId') addressId: string,
    @Param('price', ParseFloatPipe) price: number
  ) {
    const formatedPrice = Math.round(price * 100);
    return this.stripeService.calculateTax(addressId, formatedPrice);
  }

  @Post('refundPayment')
  async refundPayment(
    @Body("amount") amount: number,
    @Body("paymentIntentId") paymentIntentId: string,
    @Body("reason") reason: string,
  ) {
    return this.stripeService.createRefund(amount, paymentIntentId, reason);
  }

  @Get('refund')
  async refund(
    @Param('refundId') refundId: string
  ) {
    return this.stripeService.getRefund(refundId);
  }

  @Get("transactions/:adminId")
  async getTransactions(
    @Query('status') status?: string,
    @Query('limit') limit = 10,
    @Query('page') page = 1,
    @Query('createdDate') createdDate?: number,
    @Query('searchId') searchId?: string,
    @Param('adminId') adminId?: string
  ) {
    return this.stripeService.getAdminTransactions(
      adminId,
      status as Stripe.Charge.Status,
      limit,
      page,
      createdDate,
      searchId
    );
  }

  @Get("transaction/:transectionId")
  async getTransaction(
    @Param('transectionId') transectionId?: string
  ) {
    return this.stripeService.getTransaction(
      transectionId
    );
  }

  @Get()
  async getAllTransactions(
    @Query('status') status?: Stripe.Charge.Status,
    @Query('limit') limit = 10,
    @Query('page') page = 1,
    @Query('createdDate') createdDate?: number,
    @Query('searchId') searchId?: string,
  ) {
    return this.stripeService.getAllTransactions(
      status,
      limit,
      page,
      createdDate,
      searchId
    );
  }

  @Post('charges')
  async createCharges(){
    return this.stripeService.createCharges();
  }

  @Get('transfer/details/:transferId')
  async getTransferList(
    @Param('transferId') transferId: string
  ) {
    return this.stripeService.transferDetails(transferId);  
  }
}
