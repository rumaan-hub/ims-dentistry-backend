import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from "@nestjs/common";
import { JwtGuard } from "src/user/guard/jwt.guard";
import { RolesGuard } from "src/user/role/role.guard";
import { PromotionsService } from "./promotions.service";
import { CreatePromotionDto } from "./dto/create.promotions.dto";
import { UpdatePromotionDto } from "./dto/update.promotions.dto";
import { PromotionFilter } from "./dto/filter.options.dto";
import { ApplyPromotionDto, ValidatePromotionDto } from "./dto/validate-promotion.dto";
import { Role } from "src/user/role/role.enum";
import { Roles } from "src/user/role/role.decorator";

@Controller("promotion")
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.VENDOR)
  @Post("/:vendorId/create")
  createPromotion(@Body() createPromotionDto: CreatePromotionDto, @Param('vendorId') vendorId: string) {
    return this.promotionsService.addPromotion(createPromotionDto, vendorId);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.VENDOR)
  @Put('/:promotionId/vendor/:vendorId/update')
  updatePromotion(@Body() updatePromotionDto: UpdatePromotionDto, @Param('promotionId') promotionId: string, @Param('vendorId') vendorId: string){
    return this.promotionsService.updatePromotion(updatePromotionDto, promotionId, vendorId);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.VENDOR)
  @Delete('/:promotionId/vendor/:vendorId/delete')
  deletePromotion(@Param('promotionId') promotionId: string, @Param('vendorId') vendorId: string){
    return this.promotionsService.deletePromotion(promotionId, vendorId);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.VENDOR, Role.ADMIN, Role.SUPER_ADMIN)
  @Get('/:promotionId')
  fetchByIdPromotion(@Param('promotionId') promotionId: string){
    return this.promotionsService.getByIdPromotion(promotionId);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.VENDOR)
  @Get('/:vendorId/all')
  fetchAllPromotion(@Param('vendorId') vendorId: string, @Query() filter: PromotionFilter){
    return this.promotionsService.fetchAllPromotions(filter, vendorId);
  }

  @Get('all/superAdmin')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  fetchAllVendorPromotions(
    @Query() filter: PromotionFilter,
  ) {
    return this.promotionsService.fetchAllVendorPromotions(filter);
  }

  @Get('/all/:adminId')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  fetchAssignnedVendorPromotions(
    @Query() filter: PromotionFilter, @Param('adminId') adminId: string
  ) {
    return this.promotionsService.fetchAssignnedVendorPromotions(filter, adminId);
  }

  @Get('/get/website')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.USER)
  fetchAllPromotionForWebsite(@Query() filter: PromotionFilter){
    return this.promotionsService.fetchAllPromotionForWebsite(filter);
  }

  @Post('/validate')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.USER)
  validatePromoCode(@Body() dto: ValidatePromotionDto, @Req() req) {
    return this.promotionsService.validatePromoCode(dto, req.user.id);
  }

  @Post('/apply')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.USER)
  applyPromoCode(@Body() dto: ApplyPromotionDto, @Req() req) {
    return this.promotionsService.applyPromoCode(dto, req.user.id);
  }

}
