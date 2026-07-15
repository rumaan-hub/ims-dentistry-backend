import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { JwtGuard } from "src/user/guard/jwt.guard";
import { RolesGuard } from "src/user/role/role.guard";
import { Role } from "src/user/role/role.enum";
import { Roles } from "src/user/role/role.decorator";
import { BannerService } from "./banner.service";
import { CreateBannerDto } from "./dto/create-banner.dto";
import { UpdateBannerDto } from "./dto/update-banner.dto";

@Controller("banner")
export class BannerController {
  constructor(private readonly bannerService: BannerService) {}

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Post()
  create(@Body() dto: CreateBannerDto) {
    return this.bannerService.create(dto);
  }



  
  @Get()
  findAllPublic() {
    return this.bannerService.findAllPublic();
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Get("admin")
  findAll() {
    return this.bannerService.findAll();
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Put(":id")
  update(@Param("id") id: string, @Body() dto: UpdateBannerDto) {
    return this.bannerService.update(id, dto);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Put(":id/swap/:direction")
  swapOrder(@Param("id") id: string, @Param("direction") direction: "up" | "down") {
    return this.bannerService.swapOrder(id, direction);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Delete(":id")
  delete(@Param("id") id: string) {
    return this.bannerService.delete(id);
  }
}
