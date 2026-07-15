import { Controller, Post, Param, Body, UseGuards, Get, Put, Delete, Patch } from '@nestjs/common';
import { CartService } from './cart.service';
import { JwtGuard } from 'src/user/guard/jwt.guard';
import { Roles } from 'src/user/role/role.decorator';
import { Role } from 'src/user/role/role.enum';
import { RolesGuard } from 'src/user/role/role.guard';

@Controller('cart')
export class CartController {
  constructor(private cartService: CartService) {}

  @Post('add')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.USER)
  addToCart(
    @Body('userId') userId: string,
    @Body('variantId') variantId: string,
    @Body('quantity') quantity: number
  ) {
    return this.cartService.addToCart(userId, variantId, quantity);
  }

  @Get('/user/:userId/findCartProducts')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.USER)
  getCartProducts( @Param('userId') userId: string) {
    return this.cartService.getCartProducts( userId)
  }

  @Put('/user/:userId/updateCart')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.USER)
  updateCart(@Param('userId') userId: string, @Body('quantity') quantity: number, @Body('variantId') variantId: string) {
    return this.cartService.updateCart(userId, quantity, variantId)
  }

  @Post('/bundle/add')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.USER)
  addBundleToCart(
    @Body('userId') userId: string,
    @Body('bundleId') bundleId: string,
    @Body('quantity') quantity: number,
  ) {
    return this.cartService.addBundleToCart(userId, bundleId, quantity);
  }

  @Patch('/bundle/:bundleId/user/:userId/quantity')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.USER)
  updateBundleQuantity(
    @Param('userId') userId: string,
    @Param('bundleId') bundleId: string,
    @Body('quantity') quantity: number,
  ) {
    return this.cartService.updateBundleQuantity(userId, bundleId, quantity);
  }

  @Delete('/bundle/:bundleId/user/:userId')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.USER)
  removeBundleFromCart(
    @Param('userId') userId: string,
    @Param('bundleId') bundleId: string,
  ) {
    return this.cartService.removeBundleFromCart(userId, bundleId);
  }

}
