import { Body, Controller, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { CommissionService } from "./commission.service";
import { JwtGuard } from "src/user/guard/jwt.guard";
import { RolesGuard } from "src/user/role/role.guard";
import { Role } from "src/user/role/role.enum";
import { Roles } from "src/user/role/role.decorator";
import { UpdateCommissionDto } from "./dto/update-commission.dto";

@Controller("commission")
export class CommissionController {
  constructor(private commissionService: CommissionService) {}

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Post(":vendorId/add")
  addCommission(
    @Param("vendorId") vendorId: string,
  ) {
    return this.commissionService.addCommission(vendorId);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Put(":vendorId/update")
  updateCommission(
    @Param("vendorId") vendorId: string,
    @Body() updateCommissionDto: UpdateCommissionDto
  ) {
    return this.commissionService.updateCommission(vendorId, updateCommissionDto);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Get(":vendorId")
  getCommission(
    @Param("vendorId") vendorId: string,
  ) {
    return this.commissionService.getCommission(vendorId);
  }
}
