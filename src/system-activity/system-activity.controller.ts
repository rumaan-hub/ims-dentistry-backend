import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { SystemActivityService } from './system-activity.service';

@Controller('system-activity')
export class SystemActivityController {
    constructor(private readonly systemActivityService: SystemActivityService) { }

    @Post('log')
    async logActivity(@Body() data: {
        action: string;
        product?: string;
        office?: string;
        user?: string;
        client_id?: string;
    }) {
        return this.systemActivityService.create(data);
    }

    @Get()
    async getLogs(
        @Query('clientId') clientId?: string,
        @Query('limit') limit?: string,
    ) {
        return this.systemActivityService.findAllByClient(clientId, limit ? parseInt(limit, 10) : 50);
    }
}
