import { Controller, Post, Get, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { OfficeService } from './office.service';
import { CreateOfficeDto } from './dto/create-office.dto';

import { JwtGuard } from '../user/guard/jwt.guard';
import { PermissionsGuard } from '../user/guard/permissions.guard';

@Controller('ims/offices')
@UseGuards(JwtGuard, PermissionsGuard)
export class OfficeController {
    constructor(private readonly officeService: OfficeService) { }

    @Post()
    create(@Body() dto: CreateOfficeDto) {
        return this.officeService.create(dto);
    }

    /** Full list with nested user — for admin/audit views */
    @Get()
    findAll() {
        return this.officeService.findAll();
    }

    /**
     * Lightweight list — only essential fields, no joins.
     * Used by dropdowns, transfer routes, filters, and staff assignment.
     * Supports optional ?search= query param.
     */
    @Get('light')
    findAllLight(@Query('search') search: string = '') {
        return this.officeService.findAllLight(search);
    }

    /** Update an office's name or address */
    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: Partial<CreateOfficeDto>) {
        return this.officeService.update(id, dto);
    }

    /** Delete an office */
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.officeService.remove(id);
    }
}