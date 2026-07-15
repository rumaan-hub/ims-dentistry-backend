import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Put,
  UseGuards,
} from "@nestjs/common";
import { WishlistService } from "./wishlist.service";
import { JwtGuard } from "src/user/guard/jwt.guard";
import { RolesGuard } from "src/user/role/role.guard";
import { Role } from "src/user/role/role.enum";
import { Roles } from "src/user/role/role.decorator";

@Controller("wishlist")
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Post("add/user/:userId")
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.USER)
  addProductToWishlist(
    @Param("userId") userId: string,
    @Body("variantId") variantId: string,
    @Body("quantity") quantity: number
  ) {
    return this.wishlistService.addProductToWishlist(
      userId,
      variantId,
      quantity
    );
  }

  @Get("user/:userId")
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.USER)
  getUsersWishList(@Param("userId") userId: string) {
    return this.wishlistService.getWishListProducts(userId);
  }

  @Put("user/:userId")
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.USER)
  updateWishList(
    @Param("userId") userId: string,
    @Body("quantity") quantity: number,
    @Body("variantId") variantId: string
  ) {
    return this.wishlistService.updateWishList(userId, quantity, variantId);
  }
}
