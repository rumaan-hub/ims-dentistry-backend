import {
  Controller,
  Post,
  Param,
  Body,
  UseGuards,
  Get,
  Put,
  Query,
  Req,
} from "@nestjs/common";
import { JwtGuard } from "src/user/guard/jwt.guard";
import { OrdersService } from "./orders.service";
import { RolesGuard } from "src/user/role/role.guard";
import { Roles } from "src/user/role/role.decorator";
import { Role } from "src/user/role/role.enum";
import { CreateOrderDto } from "./dto/create-order.dto";
import { UpdateOrderDto } from "./dto/update-order.dto";
import { CreateReturnOrderDto } from "./dto/create-return-order";
import { CreateCancelOrderDto } from "./dto/create-cancel-order";

@Controller("order")
export class OrdersController {
  constructor(private orderService: OrdersService) {}

  @Post("user/:userId/cart/:cartId")
  // @UseGuards(JwtGuard, RolesGuard)
  // @Roles(Role.USER)
  addOrder(
    @Param("userId") userId: string,
    @Param("cartId") cartId: string,
    @Body() orderData: CreateOrderDto
  ) {
    return this.orderService.addOrder(userId, cartId, orderData);
  }

  @Get("all")
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  getAllOrdersForSuperAdmin(
    @Query("vendorId") vendorId: string,
    @Query("status") status: string,
    @Query("search") searchTerm: string,
    @Query("page") page: string | number = "1",
    @Query("limit") limit: string | number = "10"
  ) {
    page = Number(page);
    limit = Number(limit);
    return this.orderService.getAllOrdersForSuperAdmin(
      vendorId,
      status,
      searchTerm,
      page,
      limit
    );
  }

  @Get("admin/:adminId")
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  getOrdersForAdmin(
    @Param("adminId") adminId: string,
    @Query("page") page: string | number = "1",
    @Query("limit") limit: string | number = "10",
    @Query("status") status: string,
    @Query("search") searchTerm: string
  ) {
    page = Number(page);
    limit = Number(limit);
    return this.orderService.getOrdersForAdmin(
      adminId,
      page,
      limit,
      status,
      searchTerm
    );
  }

  @Post(":orderId/return")
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.USER)
  createReturnOrder(
    @Param("orderId") orderId: string,
    @Body() returnData: CreateReturnOrderDto
  ) {
    return this.orderService.createReturnOrder(orderId, returnData);
  }

  @Post(":orderId/user/:userId/cancel")
  // @UseGuards(JwtGuard, RolesGuard)
  // @Roles(Role.USER)
  cancelOrder(
    @Param("userId") userId: string,
    @Param("orderId") orderId: string,
    @Body() cancelOrderData: CreateCancelOrderDto
  ) {
    return this.orderService.cancelOrder(userId, orderId, cancelOrderData);
  }

  @Get("user/:userId")
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.USER)
  getAllOrders(
    @Param("userId") userId: string,
    @Query("page") page: string | number = "1",
    @Query("limit") limit: string | number = "10",
    @Query("status") status: string,
    @Query("search") searchTerm: string,
    @Query("recentOrder") returnOrder: string
  ) {
    page = Number(page);
    limit = Number(limit);
    return this.orderService.getAllOrders(
      userId,
      page,
      limit,
      status,
      searchTerm,
      returnOrder
    );
  }

  @Get("user/:userId/returnOrder")
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.USER)
  getReturnOrders(
    @Param("userId") userId: string,
    @Query("search") searchTerm: string,
  ) {
    return this.orderService.getReturnOrders(userId, searchTerm);
  }

  @Get("variant/:variantId")
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.USER)
  getOrdersByProduct(
    @Param("variantId") variantId: string,
    @Query("page") page: string | number = "1",
    @Query("limit") limit: string | number = "10",
    @Query("status") status: string,
    @Query("search") searchTerm: string
  ) {
    page = Number(page);
    limit = Number(limit);
    return this.orderService.getOrdersByProduct(
      variantId,
      page,
      limit,
      status,
      searchTerm
    );
  }

  @Get(":id")
  @UseGuards(JwtGuard)
  getSpecificOrder(@Param("id") id: string) {
    return this.orderService.getSpecificOrder(id);
  }

  @Put(":id/update")
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.USER, Role.VENDOR, Role.ADMIN, Role.SUPER_ADMIN)
  updateOrder(@Req() req, @Param("id") id: string, @Body() updateOrder: UpdateOrderDto) {
    return this.orderService.updateOrder(id, updateOrder, req.user);
  }

  @Get("recent/vendor/:vendorId")
  getRecentOrdersByVendor(
    @Param("vendorId") vendorId: string,
    @Query("status") status: string,
    @Query("search") searchTerm: string,
    @Query("page") page: string | number = "1",
    @Query("limit") limit: string | number = "10"
  ) {
    page = Number(page);
    limit = Number(limit);
    return this.orderService.getRecentOrdersByVendor(
      vendorId,
      status,
      searchTerm,
      page,
      limit
    );
  }
}
