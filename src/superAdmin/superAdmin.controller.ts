import {
  Controller,
  Post,
  Body,
  Put,
  UseGuards,
  Param,
  Delete,
  Get,
  Req,
  Query,
} from "@nestjs/common";
import { CreateSuperAdminDto } from "./dto/create-superAdmin.dto";
import { SuperAdminService } from "./superAdmin.service";
import { JwtGuard } from "src/user/guard/jwt.guard";
import { RolesGuard } from "src/user/role/role.guard";
import { Role } from "src/user/role/role.enum";
import { Roles } from "src/user/role/role.decorator";
import { LoginDTO } from "src/user/dto/login-user.dto";
import { UpdateSuperAdminDto } from "./dto/update-superAdmin.dto";
import { TransactionFilterDto } from "src/admin/dto/create-admin.dto";
import { FilterOptions } from "src/vendor/dto/filter-options.dto";

@Controller("superAdmin")
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) { }

  @Post("signup")
  signupForSuperAdmin(@Body() createAdminDto: CreateSuperAdminDto) {
    return this.superAdminService.signupForSuperAdmin(createAdminDto);
  }

  @Post("login")
  login(@Body() createAdminDto: LoginDTO) {
    return this.superAdminService.login(createAdminDto);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Put("assignVendorToAdmin")
  assignVendorToAdmin(
    @Body("adminId") adminId: string,
    @Body("vendorId") vendorId: string[]
  ) {
    return this.superAdminService.assignVendorsToAdmin(adminId, vendorId);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Delete("delete/:id")
  deleteSuperAdmin(@Param("id") userId: string, @Req() req) {
    return this.superAdminService.deleteSuperAdmin(userId, req.user);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Put("update/:id")
  updateSuperAdmin(
    @Param("id") userId: string,
    @Body() updatedSuperAdminData: UpdateSuperAdminDto,
    @Req() req
  ) {
    return this.superAdminService.updateSuperAdmin(
      userId,
      updatedSuperAdminData,
      req.user
    );
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Get("availableVendors")
  getAllAvailableVendors() {
    return this.superAdminService.getAllAvailableVendors();
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Get(":id")
  findUser(@Param("id") userId: string) {
    return this.superAdminService.findUser(userId);
  }

  @Put("forgetPassword")
  forgetPassword(@Body("email") email: string) {
    return this.superAdminService.forgetPassword(email);
  }

  @Put("verifyToken")
  verifyResetToken(@Body("token") token: string) {
    return this.superAdminService.verifyResetToken(token);
  }

  @Put("resetPassword")
  resetPassword(
    @Body("token") token: string,
    @Body("password") password: string
  ) {
    return this.superAdminService.resetPassword(token, password);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Get("dashboard/metrics")
  getDashboardMetrics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('timeFrame') timeFrame: string = 'overall',
  ) {
    return this.superAdminService.getDashboardMetrics(new Date(startDate), new Date(endDate), timeFrame);
  }

  @Get('/all/transactions')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  async getTransactions(@Query() filter: TransactionFilterDto) {
    return this.superAdminService.getTransactions(filter);
  }

  @Get('transfers/details')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  async getVendorTransfers(
    @Query() query: FilterOptions,
  ) {
    return this.superAdminService.getVendorTransfers({
      ...query,
    });
  }

}
