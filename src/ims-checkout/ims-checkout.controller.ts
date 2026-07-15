import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    UseGuards,
} from '@nestjs/common';
import { ImsCheckoutService } from './ims-checkout.service';
import { JwtGuard } from '../user/guard/jwt.guard';
import { PermissionsGuard } from '../user/guard/permissions.guard';
import { Public } from '../user/guard/public.decorator';

@Controller('ims-checkout')
@UseGuards(JwtGuard, PermissionsGuard)
export class ImsCheckoutController {
    constructor(private readonly service: ImsCheckoutService) { }

    @Get('config')
    @Public()
    getConfig() {
        return { publishableKey: process.env.STRIPE_PUBLISHABLE_KEY };
    }

    @Post('create-payment-intent')
    @Public()
    createPaymentIntent(@Body() dto: any) {
        return this.service.createPaymentIntent(dto);
    }

    @Post('license')
    @Public()
    saveLicense(@Body() dto: any) {
        return this.service.saveLicense(dto);
    }

    @Post('shipping')
    @Public()
    saveShipping(@Body() dto: any) {
        return this.service.saveShipping(dto);
    }

    @Post('billing')
    @Public()
    saveBilling(@Body() dto: any) {
        return this.service.saveBilling(dto);
    }

    @Get('license/:token')
    @Public()
    getLicense(@Param('token') token: string) {
        return this.service.getLicense(token);
    }

    @Get('shipping/:token')
    @Public()
    getShipping(@Param('token') token: string) {
        return this.service.getShipping(token);
    }

    @Get('billing/:token')
    @Public()
    getBilling(@Param('token') token: string) {
        return this.service.getBilling(token);
    }

    @Post('confirm')
    @Public()
    confirmOrder(@Body() dto: any) {
        return this.service.confirmOrder(dto);
    }
}
