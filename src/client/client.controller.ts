import {
    Controller, Post, Get, Patch, Delete,
    Body, Param, Req,
} from '@nestjs/common';
import { ClientService } from './client.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { CreateLicenseDto } from './dto/create-license.dto';
import { UpdateLicenseDto } from './dto/update-license.dto';
import { CreateShippingDto } from './dto/create-shipping.dto';
import { UpdateShippingDto } from './dto/update-shipping.dto';
import { CreateBillingDto } from './dto/create-billing.dto';
import { UpdateBillingDto } from './dto/update-billing.dto';

// ═══════════════════════════════════════════════════════════════
// CLIENT  →  /ims/clients
// ═══════════════════════════════════════════════════════════════
@Controller('ims/clients')
export class ClientController {
    constructor(private readonly clientService: ClientService) { }

    // POST /ims/clients
    @Post()
    create(@Body() dto: CreateClientDto) {
        return this.clientService.create(dto);
    }

    // GET /ims/clients
    @Get()
    findAll() {
        return this.clientService.findAll();
    }

    /**
     * GET /ims/clients/me
     * MUST be declared before @Get(':id') — NestJS routes top-to-bottom.
     */
    @Get('me')
    getCurrentClient(@Req() req: any) {
        return this.clientService.getCurrentClient(req.user.client_id);
    }

    // GET /ims/clients/:id
    @Get(':id')
    findById(@Param('id') id: string) {
        return this.clientService.findById(id);
    }

    // PATCH /ims/clients/:id
    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateClientDto) {
        return this.clientService.update(id, dto);
    }

    // DELETE /ims/clients/:id
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.clientService.remove(id);
    }
}

// ═══════════════════════════════════════════════════════════════
// LICENSE  →  /ims/client-licenses
//   POST   /ims/client-licenses/:clientId          → addLicense
//   PATCH  /ims/client-licenses/:licenseId         → updateLicense
//   DELETE /ims/client-licenses/:licenseId         → removeLicense
// ═══════════════════════════════════════════════════════════════
@Controller('ims/client-licenses')
export class LicenseController {
    constructor(private readonly clientService: ClientService) { }

    @Post(':clientId')
    addLicense(
        @Param('clientId') clientId: string,
        @Body() dto: CreateLicenseDto,
    ) {
        return this.clientService.addLicense(clientId, dto);
    }

    @Patch(':licenseId')
    updateLicense(
        @Param('licenseId') licenseId: string,
        @Body() dto: UpdateLicenseDto,
    ) {
        return this.clientService.updateLicense(licenseId, dto);
    }

    @Delete(':licenseId')
    removeLicense(@Param('licenseId') licenseId: string) {
        return this.clientService.removeLicense(licenseId);
    }
}

// ═══════════════════════════════════════════════════════════════
// SHIPPING  →  /ims/client-shippings
//   POST   /ims/client-shippings/:clientId         → addShipping
//   PATCH  /ims/client-shippings/:shippingId       → updateShipping
//   DELETE /ims/client-shippings/:shippingId       → removeShipping
// ═══════════════════════════════════════════════════════════════
@Controller('ims/client-shippings')
export class ShippingController {
    constructor(private readonly clientService: ClientService) { }

    @Post(':clientId')
    addShipping(
        @Param('clientId') clientId: string,
        @Body() dto: CreateShippingDto,
    ) {
        return this.clientService.addShipping(clientId, dto);
    }

    @Patch(':shippingId')
    updateShipping(
        @Param('shippingId') shippingId: string,
        @Body() dto: UpdateShippingDto,
    ) {
        return this.clientService.updateShipping(shippingId, dto);
    }

    @Delete(':shippingId')
    removeShipping(@Param('shippingId') shippingId: string) {
        return this.clientService.removeShipping(shippingId);
    }
}

// ═══════════════════════════════════════════════════════════════
// BILLING  →  /ims/client-billings
//   POST   /ims/client-billings/:clientId          → addBilling
//   PATCH  /ims/client-billings/:billingId         → updateBilling
//   DELETE /ims/client-billings/:billingId         → removeBilling
// ═══════════════════════════════════════════════════════════════
@Controller('ims/client-billings')
export class BillingController {
    constructor(private readonly clientService: ClientService) { }

    @Post(':clientId')
    addBilling(
        @Param('clientId') clientId: string,
        @Body() dto: CreateBillingDto,
    ) {
        return this.clientService.addBilling(clientId, dto);
    }

    @Patch(':billingId')
    updateBilling(
        @Param('billingId') billingId: string,
        @Body() dto: UpdateBillingDto,
    ) {
        return this.clientService.updateBilling(billingId, dto);
    }

    @Get(':clientId/invoices')
    getInvoices(@Param('clientId') clientId: string) {
        return this.clientService.getInvoices(clientId);
    }

    @Delete(':billingId')
    removeBilling(@Param('billingId') billingId: string) {
        return this.clientService.removeBilling(billingId);
    }
}