import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards,
  Req
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { PermissionsGuard } from '../user/guard/permissions.guard';
import { Permissions } from '../user/guard/permissions.decorator';
import { JwtGuard } from '../user/guard/jwt.guard';

@Controller("ims/inventory")
@UseGuards(JwtGuard, PermissionsGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions('inventory.create')
  create(@Body() createInventoryDto: CreateInventoryDto, @Req() req: any) {
    return this.inventoryService.create(createInventoryDto, req.user);
  }

  @Get()
  @Permissions('inventory.view')
  findAll(
    @Req() req: any,
    @Query('search') searchTerm: string,
    @Query('page') page: string | number = '1',
    @Query('limit') limit: string | number = '50',
    @Query('officeId') officeId?: string,
    @Query('inventoryType') inventoryType?: string,
  ) {
    return this.inventoryService.findAll(req.user, searchTerm, Number(page), Number(limit), officeId, inventoryType);
  }

  // ── Ledger endpoints — MUST come before :id to avoid route conflicts ───────

  @Get('ledger/transactions')
  @Permissions('ledger.view')
  getLedgerTransactions(
    @Req() req: any,
    @Query('officeId') officeId?: string,
    @Query('type') type?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('inventoryType') inventoryType?: string,
  ) {
    return this.inventoryService.getLedgerTransactions(req.user, officeId, type, dateFrom, dateTo, inventoryType);
  }

  @Get('ledger/low-stock')
  @Permissions('ledger.view')
  getLowStockAlerts(@Req() req: any, @Query('inventoryType') inventoryType?: string) {
    return this.inventoryService.getLowStockAlerts(req.user, inventoryType);
  }

  @Get('ledger/near-expiry')
  @Permissions('ledger.view')
  getNearExpiryAlerts(@Req() req: any, @Query('days') days?: string) {
    return this.inventoryService.getNearExpiryAlerts(req.user, days ? Number(days) : 60);
  }

  @Get('ledger/near-expiry-count')
  @Permissions('ledger.view')
  getNearExpiryCount(@Req() req: any, @Query('days') days?: string) {
    return this.inventoryService.getNearExpiryCount(req.user, days ? Number(days) : 30);
  }

  // ── Analytics ──────────────────────────────────────────────────────────────

  @Get('analytics/suggestions')
  @Permissions('ledger.view')
  getAnalyticsSuggestions(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.inventoryService.getAnalyticsSuggestions(
      req.user,
      page ? Number(page) : 1,
      limit ? Number(limit) : 10,
    );
  }

  // ── Standard CRUD ──────────────────────────────────────────────────────────

  @Get(':id')
  @Permissions('inventory.view')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.inventoryService.findOne(id, req.user);
  }

  @Patch(':id')
  @Permissions('inventory.edit')
  update(@Param('id') id: string, @Body() updateInventoryDto: UpdateInventoryDto, @Req() req: any) {
    return this.inventoryService.update(id, updateInventoryDto, req.user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('inventory.delete')
  remove(@Param('id') id: string, @Req() req: any, @Query('type') type?: string) {
    return this.inventoryService.remove(id, req.user, type);
  }
}
