import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    Req,
    Query,
    ForbiddenException,
} from '@nestjs/common';
import { ImsSubscriptionService } from './ims-subscription.service';
import { JwtGuard } from '../user/guard/jwt.guard';
import { PermissionsGuard } from '../user/guard/permissions.guard';
import { Public } from '../user/guard/public.decorator';
import { SendLinkDto } from './dto/send-link.dto';

@Controller('ims-subscription')
@UseGuards(JwtGuard, PermissionsGuard)
export class ImsSubscriptionController {
    constructor(private readonly service: ImsSubscriptionService) { }

    @Get('my-subscription')
    getMySubscription(@Req() req: any) {
        return this.service.getMySubscription(req.user.client_id);
    }

    @Get('plans')
    @Public()
    getPlans() {
        return this.service.getPlans();
    }

    @Post('plans')
    createPlan(@Body() dto: any, @Req() req: any) {
        return this.service.createPlan(dto, req.user);
    }

    @Patch('plans/:id')
    updatePlan(@Param('id') id: string, @Body() dto: any, @Req() req: any) {
        return this.service.updatePlan(id, dto, req.user);
    }

    @Delete('plans/:id')
    deletePlan(@Param('id') id: string, @Req() req: any) {
        return this.service.deletePlan(id, req.user);
    }

    @Post('send-link')
    sendLink(@Body() dto: SendLinkDto, @Req() req: any) {
        return this.service.sendLink(dto, req.user);
    }

    @Patch('activate/:clientId')
    activateClient(@Param('clientId') clientId: string, @Req() req: any) {
        if (!req.user.is_system_admin) throw new ForbiddenException();
        return this.service.activateClient(clientId, req.user.client_id);
    }

    @Patch('deactivate/:clientId')
    deactivateClient(@Param('clientId') clientId: string, @Req() req: any) {
        if (!req.user.is_system_admin) throw new ForbiddenException();
        return this.service.deactivateClient(clientId);
    }

    @Delete('revoke-free-access/:clientId')
    revokeFreeAccess(@Param('clientId') clientId: string, @Req() req: any) {
        if (!req.user.is_system_admin) throw new ForbiddenException();
        return this.service.revokeFreeAccess(clientId);
    }

    @Get('payment-history')
    getPaymentHistory(@Req() req: any) {
        return this.service.getPaymentHistory(req.user.client_id);
    }

    @Get('client-status/:clientId')
    getClientStatus(@Param('clientId') clientId: string) {
        return this.service.getClientStatus(clientId);
    }

    @Get('stats')
    getStats(@Req() req: any, @Query('filter') filter?: string) {
        return this.service.getStats(req.user, filter);
    }

    @Get('chart-data')
    getChartData(@Req() req: any, @Query('filter') filter?: string) {
        return this.service.getChartData(req.user, filter);
    }

    @Post('grant-free-access')
    grantFreeAccess(@Body() body: any, @Req() req: any) {
        if (!req.user.is_system_admin) throw new ForbiddenException();
        return this.service.grantFreeAccess(
            body.clientId,
            body.planId,
            body.durationType,
            body.durationDays,
            body.reason,
        );
    }

    @Post('create-user-with-access')
    createUserWithAccess(@Body() body: any, @Req() req: any) {
        if (!req.user.is_system_admin) throw new ForbiddenException();
        return this.service.createUserWithAccess({
            firstName: body.firstName,
            lastName: body.lastName,
            email: body.email,
            companyName: body.companyName,
            contactNumber: body.contactNumber,
            planId: body.planId,
            durationType: body.durationType,
            durationDays: body.durationDays,
            reason: body.reason,
        });
    }

    @Get('verify-token/:token')
    @Public()
    verifyToken(@Param('token') token: string) {
        return this.service.verifyToken(token);
    }
}
