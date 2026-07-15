import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
} from "@nestjs/common";
import { UspsService } from "./usps.service";
import { CreateAccountUPS } from "./dto/create-account.dto";
import { UpdateAccountUPS } from "./dto/update-accout.dto";
import { JwtGuard } from "src/user/guard/jwt.guard";
import { Response } from "express";

@Controller("ups")
export class UspsController {
  private readonly vendorAuthorizationReturnUrl = process.env.VENDOR_AUTHORIZATION_RETURN_URL;
  constructor(private readonly uspsService: UspsService) {}

  @UseGuards(JwtGuard)
  @Get("track/:trackingNumber")
  async trackOrder(@Param("trackingNumber") trackingNumber: string) {
    return await this.uspsService.trackOrder(trackingNumber);
  }

  // @UseGuards(JwtGuard)
  @Get("authorization/:vendorId")
  async vendorAuthorization(@Param('vendorId') vendorId: string, @Res() res: Response) {
    try {
      const authorizationUrl = await this.uspsService.vendorAuthorization(vendorId);
      return res.send({
        url: authorizationUrl
      });
    } catch (error) {
      throw new BadRequestException(
        error.message
      );
    }
  }

  @Get("callback")
  async upsCallback(@Query() query: any, @Res() res: Response) {
    try {
      await this.uspsService.exchangeCodeForToken(query);
      return res.redirect(this.vendorAuthorizationReturnUrl);
    } catch (error) {
      console.error('OAuth callback error:', error);
      return res.redirect('/error?message=Failed to connect UPS');
    }
  }

  @UseGuards(JwtGuard)
  @Post("vendor/:vendorId/token")
  async getValidTokenForVendor(
    @Param("vendorId") vendorId: string,
  ) {
    return await this.uspsService.getValidTokenForVendor(vendorId);
  }

  @UseGuards(JwtGuard)
  @Put("create-account/vendor/:vendorId")
  async createDelieveryAccount(
    @Param("vendorId") vendorId: string,
    @Body() accountData: CreateAccountUPS
  ) {
    return await this.uspsService.createUPSAccount(vendorId, accountData);
  }

  @UseGuards(JwtGuard)
  @Put("update-account/:accountId")
  async updateDeliveryAccount(
    @Param("accountId") accountId: string,
    @Body() accountData: UpdateAccountUPS
  ) {
    return await this.uspsService.updateDeliveryAccount(accountId, accountData);
  }

  @Post('rates/user/:userId/cart/:cartId/address/:addressId')
  async getRagetShippingRatesForOrdertes(
    @Param('userId') userId: string,
    @Param('cartId') cartId: string,
    @Param('addressId') addressId: string
  ) {
    return this.uspsService.getShippingRatesForOrder(userId, cartId, addressId);
  }

  @Post('subscribe')
  async subscribe(@Body() body: { trackingNumbers: string[] }) {
    try {
      const result = await this.uspsService.subscribeToTrackingUpdates(body.trackingNumbers);
      
      return {
        message: 'Subscription successful',
        details: {
          validNumbers: result.validTrackingNumbers,
          invalidNumbers: result.invalidTrackingNumbers,
        },
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('webhook')
  handleWebhook(@Body() payload: any) {
    
    if (!payload.trackingNumber && !payload?.TrackResponse?.Shipment?.Package?.TrackingNumber) {
      console.error('Invalid webhook payload: missing trackingNumber', payload);
      throw new BadRequestException('Invalid webhook payload: missing trackingNumber');
    }

    return this.uspsService.processTrackingUpdate(payload);
  }

  @Post('label-shipping-rates/user/:userId/address/:addressId/vendor/:vendorId')
  async shippingRatesForLabel(
    @Param("userId") userId: string,
    @Param("addressId") addressId: string,
    @Param("vendorId") vendorId: string,
    @Body() items: any
  ) {
    return await this.uspsService.shippingRatesForLabel(items, userId, addressId, vendorId);
  }
  
}
