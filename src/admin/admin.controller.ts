import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Param,
  Put,
  Req,
  Query,
  Delete,
} from "@nestjs/common";
import { JwtGuard } from "src/user/guard/jwt.guard";
import { RolesGuard } from "src/user/role/role.guard";
import { Role } from "src/user/role/role.enum";
import { Roles } from "src/user/role/role.decorator";
import { LoginDTO } from "src/user/dto/login-user.dto";
import { CreateAdminDto } from "src/superAdmin/dto/create-admin.dto";
import { AdminService } from "./admin.service";
import { UpdateAdminDto } from "./dto/update-admin.dto";
import { ResetPasswordDto } from "src/user/dto/resetPassword.dto";
import { UpdatePasswordDto } from "src/user/dto/updatePasswordDto.dto copy";
import { updateVendorStatusDto } from "./dto/update-vendor-status-dto";
import { TransactionFilterDto } from "./dto/create-admin.dto";
import { FilterOptions } from "src/vendor/dto/filter-options.dto";

@Controller("admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) { }

  @Post("signup")
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  signupForAdmin(@Body() createAdminDto: CreateAdminDto) {
    return this.adminService.signupForAdmin(createAdminDto);
  }

  @Post("login")
  login(@Body() createAdminDto: LoginDTO) {
    return this.adminService.login(createAdminDto);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Get("allAdmins")
  findAllAdmins(
    @Query("search") searchTerm: string,
    @Query("status") status: string,
    @Query("page") page: string | number = "1",
    @Query("limit") limit: string | number = "10"
  ) {
    page = Number(page);
    limit = Number(limit);
    return this.adminService.findAllAdmins(page, limit, searchTerm, status);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Get(":id")
  getSpecificAdmin(@Param("id") id: string) {
    return this.adminService.getSpecificAdmin(id);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Put(":id/update")
  updateAdmin(
    @Param("id") userId: string,
    @Body() updatedSuperAdminData: UpdateAdminDto
  ) {
    return this.adminService.updateAdmin(userId, updatedSuperAdminData);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Delete(":id/delete")
  deleteAdmin(@Param("id") adminId: string) {
    return this.adminService.deleteAdmin(adminId);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Get(":id/assignedVendors")
  getAssignedVendors(
    @Param("id") id: string,
    @Query("search") searchTerm: string,
    @Query("page") page: string | number = "1",
    @Query("limit") limit: string | number = "10",
    @Query('status') status: string
  ) {
    page = Number(page);
    limit = Number(limit);
    return this.adminService.getAssignedVendors(id, searchTerm, page, limit, status);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Get(":id/unAssignedVendor/:vendorId")
  unAssignedVendorFromAdmin(
    @Param("id") id: string,
    @Param("vendorId") vendorId: string,
    @Req() req,
  ) {
    return this.adminService.unAssignedVendorFromAdmin(id, vendorId, req.user);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Put("/:id/vendor/:vendorId")
  verifyVendor(
    @Param("id") id: string,
    @Param("vendorId") vendorId: string,
    @Req() req,
    @Body() updateVendorStatus: updateVendorStatusDto
  ) {
    return this.adminService.verifyVendor(id, vendorId, req.user, updateVendorStatus);
  }

  @Put("forgetPassword")
  forgetPassword(@Body("email") email: string) {
    return this.adminService.forgetPassword(email);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Put("verifyToken")
  verifyToken() {
    return this.adminService.verifyToken();
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Post(":id/update-Password")
  updatePassword(@Param("id") id: string, @Body() dto: UpdatePasswordDto) {
    return this.adminService.updatePassword(id, dto);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Post(":id/reset-Password")
  resetPassword(@Param("id") id: string, @Body() dto: ResetPasswordDto) {
    return this.adminService.resetPassword(id, dto);
  }

  @Get('transactions/:id')
  @Roles(Role.ADMIN)
  async getTransactions(@Query() filter: TransactionFilterDto, @Param("id") id: string) {
    return this.adminService.getTransactions(filter, id);
  }

  @Get('/:adminId/transfers')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getVendorTransfers(
    @Param('adminId') adminId: string,
    @Query() query: FilterOptions,
  ) {
    return this.adminService.getVendorTransfers(
      adminId,
      query
    );
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get("dashboard/metrics")
  getDashboardMetrics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('timeFrame') timeFrame: string,
    @Req() req,
  ) {
    return this.adminService.getDashboardMetrics(new Date(startDate), new Date(endDate), timeFrame, req.user);
  }

}
