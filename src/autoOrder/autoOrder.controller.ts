import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { JwtGuard } from "src/user/guard/jwt.guard";
import { Roles } from "src/user/role/role.decorator";
import { Role } from "src/user/role/role.enum";
import { RolesGuard } from "src/user/role/role.guard";
import { AutoOrderService } from "./autoOrder.service";
import { CreateAutoOrderDto } from "./dto/create-auto-order.dto";
import { UpdateAutoOrderDto } from "./dto/update-auto-order.dto";

@Controller("autoOrder")
export class AutoOrderController {
  constructor(private service: AutoOrderService) {}
  @Post("user/:userId")
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.USER)
  createAutoOrder(
    @Param("userId") userId: string,
    @Body() orderData: CreateAutoOrderDto
  ) {
    return this.service.createAutoOrder(userId, orderData);
  }
  @Delete(":autoOrderId/user/:userId/delete")
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.USER)
  removeAutoOrder(
    @Param("userId") userId: string,
    @Param("autoOrderId") autoOrderId: string
  ) {
    return this.service.removeAutoOrder(userId, autoOrderId);
  }
  @Put(":autoOrderId/user/:userId/update")
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.USER)
  updateAutoOrder(
    @Param("userId") userId: string,
    @Param("autoOrderId") autoOrderId: string,
    @Body() orderData: UpdateAutoOrderDto
  ) {
    return this.service.updateAutoOrder(userId, autoOrderId, orderData);
  }
  @Get("user/:userId")
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.USER)
  getAutoOrders(
    @Param("userId") userId: string,
    @Query("page") page: string | number = "1",
    @Query("limit") limit: string | number = "10",
    @Query("autoOrderFrequency") autoOrderFrequency?: string
  ) {
    return this.service.getAutoOrders(userId, Number(page), Number(limit), autoOrderFrequency);
  }
}
