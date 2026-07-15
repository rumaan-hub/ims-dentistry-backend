import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from 'src/user/guard/jwt.guard';
import { RolesGuard } from 'src/user/role/role.guard';
import { Roles } from 'src/user/role/role.decorator';
import { Role } from 'src/user/role/role.enum';
import { BundleService } from './bundle.service';
import { CreateBundleDto } from './dto/create-bundle.dto';
import { UpdateBundleDto } from './dto/update-bundle.dto';
import { FilterBundleDto } from './dto/filter-bundle.dto';

@Controller('bundle')
export class BundleController {
  constructor(private readonly bundleService: BundleService) {}

  // ─── Vendor ────────────────────────────────────────────────────────────────

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.VENDOR)
  @Post('/vendor/:vendorId/create')
  createBundle(@Body() dto: CreateBundleDto, @Param('vendorId') vendorId: string) {
    return this.bundleService.createBundle(dto, vendorId);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.VENDOR)
  @Put('/:bundleId/vendor/:vendorId')
  updateBundle(
    @Body() dto: UpdateBundleDto,
    @Param('bundleId') bundleId: string,
    @Param('vendorId') vendorId: string,
  ) {
    return this.bundleService.updateBundle(dto, bundleId, vendorId);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.VENDOR)
  @Delete('/:bundleId/vendor/:vendorId')
  deleteBundle(
    @Param('bundleId') bundleId: string,
    @Param('vendorId') vendorId: string,
  ) {
    return this.bundleService.deleteBundle(bundleId, vendorId);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.VENDOR)
  @Patch('/:bundleId/vendor/:vendorId/submit')
  submitBundle(
    @Param('bundleId') bundleId: string,
    @Param('vendorId') vendorId: string,
  ) {
    return this.bundleService.submitBundle(bundleId, vendorId);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.VENDOR)
  @Patch('/:bundleId/vendor/:vendorId/pause')
  togglePause(
    @Param('bundleId') bundleId: string,
    @Param('vendorId') vendorId: string,
  ) {
    return this.bundleService.togglePause(bundleId, vendorId);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.VENDOR)
  @Get('/vendor/:vendorId/all')
  getVendorBundles(
    @Param('vendorId') vendorId: string,
    @Query() filter: FilterBundleDto,
  ) {
    return this.bundleService.getVendorBundles(vendorId, filter);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.VENDOR, Role.ADMIN, Role.SUPER_ADMIN)
  @Get('/:bundleId')
  getBundleById(@Param('bundleId') bundleId: string) {
    return this.bundleService.getBundleById(bundleId);
  }

  // ─── Admin ─────────────────────────────────────────────────────────────────

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Get('/admin/all')
  getAllBundlesAdmin(@Query() filter: FilterBundleDto) {
    return this.bundleService.getAllBundlesAdmin(filter);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Patch('/:bundleId/approve')
  approveBundle(@Param('bundleId') bundleId: string, @Req() req) {
    return this.bundleService.approveBundle(bundleId, req.user.id);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Patch('/:bundleId/reject')
  rejectBundle(
    @Param('bundleId') bundleId: string,
    @Body('reason') reason: string,
    @Req() req,
  ) {
    return this.bundleService.rejectBundle(bundleId, req.user.id, reason);
  }

  // ─── Public ────────────────────────────────────────────────────────────────

  @Get('/public/all')
  getApprovedBundles(@Query() filter: FilterBundleDto) {
    return this.bundleService.getApprovedBundles(filter);
  }

  @Get('/public/storewide-deals')
  getStorewideDeals() {
    return this.bundleService.getStorewideDeals();
  }

  @Get('/public/:slug')
  getBundleBySlug(@Param('slug') slug: string) {
    return this.bundleService.getBundleBySlug(slug);
  }
}
