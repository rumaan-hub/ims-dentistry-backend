import {
    Controller,
    Post,
    Get,
    Patch,
    Body,
    Param,
    UseGuards,
    Query,
} from '@nestjs/common';
import { PurchaseService } from './purchase.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { JwtGuard } from '../user/guard/jwt.guard';
import { PermissionsGuard } from '../user/guard/permissions.guard';

@Controller('ims/purchase')
@UseGuards(JwtGuard, PermissionsGuard)
export class PurchaseController {
    constructor(private readonly purchaseService: PurchaseService) { }

    @Post()
    async createPurchase(@Body() dto: CreatePurchaseDto) {
        return this.purchaseService.createPurchase(dto);
    }

    @Get('proposals/:clientId')
    async getProposals(@Param('clientId') clientId: string) {
        return this.purchaseService.getProposals(clientId);
    }

    @Get(':clientId')
    async getPurchases(@Param('clientId') clientId: string) {
        return this.purchaseService.getPurchases(clientId);
    }

    @Patch('proposals/:id/accept')
    async acceptProposal(@Param('id') id: string) {
        return this.purchaseService.acceptProposal(id);
    }

    @Patch('proposals/:id/reject')
    async rejectProposal(@Param('id') id: string) {
        return this.purchaseService.rejectProposal(id);
    }
}
