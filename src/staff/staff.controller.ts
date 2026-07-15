import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { StaffService } from './staff.service';
import { JwtGuard } from '../user/guard/jwt.guard';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { PermissionsGuard } from '../user/guard/permissions.guard';
import { Permissions } from '../user/guard/permissions.decorator';

@Controller('ims/staff')
@UseGuards(JwtGuard, PermissionsGuard)
export class StaffController {
    constructor(private readonly staffService: StaffService) { }

    @Post()
    @Permissions('staff.manage')
    create(@Body() createStaffDto: CreateStaffDto) {
        return this.staffService.create(createStaffDto);
    }

    @Get()
    @Permissions('staff.view')
    findAll(@Req() req: any) {
        return this.staffService.findAll(req.user);
    }

    @Get('client/:client_id')
    @Permissions('staff.view')
    findByClient(@Param('client_id') client_id: string) {
        return this.staffService.findByClient(client_id);
    }

    @Get(':id')
    @Permissions('staff.view')
    findOne(@Param('id') id: string) {
        return this.staffService.findOne(id);
    }

    @Patch(':id')
    @Permissions('staff.manage')
    update(@Param('id') id: string, @Body() updateStaffDto: UpdateStaffDto) {
        return this.staffService.update(id, updateStaffDto);
    }

    @Delete(':id')
    @Permissions('staff.manage')
    remove(@Param('id') id: string) {
        return this.staffService.remove(id);
    }
}
