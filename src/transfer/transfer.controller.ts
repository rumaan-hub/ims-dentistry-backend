import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../user/guard/jwt.guard';
import { PermissionsGuard } from '../user/guard/permissions.guard';
import { TransferService } from './transfer.service';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { UpdateTransferDto } from './dto/update-transfer.dto';

@Controller('ims/transfer')
@UseGuards(JwtGuard, PermissionsGuard)
export class TransferController {
    constructor(private readonly transferService: TransferService) { }

    @Post()
    create(@Body() createTransferDto: CreateTransferDto) {
        return this.transferService.create(createTransferDto);
    }

    @Get()
    findAll() {
        return this.transferService.findAll();
    }

    @Get('client/:client_id')
    findByClient(@Param('client_id') client_id: string) {
        return this.transferService.findByClient(client_id);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.transferService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateTransferDto: UpdateTransferDto) {
        return this.transferService.update(id, updateTransferDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.transferService.remove(id);
    }
}
