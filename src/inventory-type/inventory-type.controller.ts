import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { InventoryTypeService } from "./inventory-type.service";
import { JwtGuard } from "src/user/guard/jwt.guard";
import { RolesGuard } from "src/user/role/role.guard";
import { Roles } from "src/user/role/role.decorator";
import { Role } from "src/user/role/role.enum";
import { CreateInventoryTypeDto } from "./dto/create-inventory-type.dto";

@Controller("inventory-types")
export class InventoryTypeController {
  constructor(private readonly inventoryTypeService: InventoryTypeService) {}

  @Get()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.VENDOR, Role.ADMIN, Role.SUPER_ADMIN)
  getAllInventoryTypes() {
    return this.inventoryTypeService.getAllInventoryTypes();
  }

  @Post()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  createInventoryType(@Body() payload: CreateInventoryTypeDto) {
    return this.inventoryTypeService.createInventoryType(payload);
  }

  @Delete(":id")
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  softDeleteInventoryType(@Param("id") id: string) {
    return this.inventoryTypeService.softDeleteInventoryType(id);
  }
}
