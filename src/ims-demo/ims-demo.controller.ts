import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { ImsDemoService } from './ims-demo.service';
import { JwtGuard } from '../user/guard/jwt.guard';
import { PermissionsGuard } from '../user/guard/permissions.guard';
import { Permissions } from '../user/guard/permissions.decorator';
import { Public } from '../user/guard/public.decorator';
import { CreateImsDemoDto } from './dto/create-ims-demo.dto';
import { UpdateImsDemoDto } from './dto/update-ims-demo.dto';

@Controller('ims-demo')
@UseGuards(JwtGuard, PermissionsGuard)
export class ImsDemoController {
    constructor(private readonly imsDemoService: ImsDemoService) { }

    @Post('schedule')
    @Public()
    schedule(@Body() dto: CreateImsDemoDto) {
        return this.imsDemoService.schedule(dto);
    }

    // Public: bookable 30-min slots for a date (YYYY-MM-DD, US Eastern).
    // Returns availability flags only — no other bookers' details.
    @Get('available-slots')
    @Public()
    getAvailableSlots(@Query('date') date: string) {
        return this.imsDemoService.getAvailableSlots(date);
    }

    @Get('restore-requests')
    @UseGuards(JwtGuard)
    getRestoreRequests(@Req() req: any) {
        return this.imsDemoService.getRestoreRequests(req.user);
    }

    @Get('all')
    @Permissions('demo.manage')
    findAll(@Query('includeDeleted') includeDeleted?: string) {
        return this.imsDemoService.findAll(includeDeleted === 'true');
    }

    @Get('my/:client_id')
    findByClient(@Param('client_id') clientId: string, @Req() req: any) {
        return this.imsDemoService.findByClient(clientId, req.user);
    }

    @Patch(':id/status')
    @Permissions('demo.manage')
    updateStatus(
        @Param('id') id: string,
        @Body() dto: UpdateImsDemoDto,
        @Req() req: any,
    ) {
        return this.imsDemoService.updateStatus(id, dto, req.user);
    }

    @Patch('restore-allow/:clientId')
    @UseGuards(JwtGuard)
    restoreAllow(@Param('clientId') clientId: string, @Req() req: any) {
        return this.imsDemoService.restoreAllow(clientId, req.user);
    }

    @Patch('restore-reject/:clientId')
    @UseGuards(JwtGuard)
    restoreReject(@Param('clientId') clientId: string, @Req() req: any) {
        return this.imsDemoService.restoreReject(clientId, req.user);
    }

    @Delete(':id')
    @Permissions('demo.manage')
    remove(@Param('id') id: string, @Req() req: any) {
        return this.imsDemoService.remove(id, req.user);
    }
}
