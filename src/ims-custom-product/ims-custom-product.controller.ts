import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ImsCustomProductService } from './ims-custom-product.service';
import { CreateCustomProductDto } from './dto/create-custom-product.dto';
import { UpdateCustomProductDto } from './dto/update-custom-product.dto';
import { JwtGuard } from '../user/guard/jwt.guard';
import { PermissionsGuard } from '../user/guard/permissions.guard';
import { Permissions } from '../user/guard/permissions.decorator';

@Controller('ims/custom-products')
@UseGuards(JwtGuard, PermissionsGuard)
export class ImsCustomProductController {
  constructor(private readonly service: ImsCustomProductService) {}

  @Post()
  @Permissions('inventory.create')
  create(@Req() req: any, @Body() dto: CreateCustomProductDto) {
    return this.service.create(req.user.client_id, dto);
  }

  @Get()
  @Permissions('inventory.view')
  findAll(
    @Req() req: any,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('inventory_type') inventoryType?: string,
  ) {
    return this.service.findAll(req.user.client_id, {
      search,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 50,
      inventoryType,
    });
  }

  @Get(':id')
  @Permissions('inventory.view')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.service.findOne(id, req.user.client_id);
  }

  @Patch(':id')
  @Permissions('inventory.edit')
  update(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: UpdateCustomProductDto,
  ) {
    return this.service.update(id, req.user.client_id, dto);
  }

  @Delete(':id')
  @Permissions('inventory.delete')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.service.remove(id, req.user.client_id);
  }
}
