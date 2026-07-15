import {
    Controller,
    Post,
    Param,
    Body,
    Put,
    Get,
    Delete,
    UseGuards,
  } from "@nestjs/common";
  import { CreateLicenseDto } from "./dto/createLicense.dto";
  import { LicenseService } from "./license.service";
  import { UpdateLicensesDto } from "./dto/updateLicense.dto";
  import { JwtGuard } from "src/user/guard/jwt.guard";
  import { RolesGuard } from "src/user/role/role.guard";
  
  @Controller("user/:userId/license")
  export class LicenseController {
    constructor(private readonly licenseService: LicenseService) {}
  
    @UseGuards(JwtGuard, RolesGuard)
    @Post("create")
    createLicense(@Param('userId') userId: string, @Body() licenseData: CreateLicenseDto) {
      return this.licenseService.createLicense(userId, licenseData);
    }

    @UseGuards(JwtGuard, RolesGuard)
    @Get('')
    findLicenseByUser(@Param('userId') userId: string) {
      return this.licenseService.findLicenseByUser(userId);
    }
  
    @UseGuards(JwtGuard, RolesGuard)
    @Get(':id')
    findLicenseById(@Param('userId') userId: string, @Param('id') id: string) {
      return this.licenseService.findLicenseById(userId, id);
    }
  
    @UseGuards(JwtGuard, RolesGuard)
    @Put(':licenseId/update')
    updateLicense(@Param('userId') userId: string, @Param('licenseId') licenseId: string, @Body() updatedData: UpdateLicensesDto) {
      return this.licenseService.updateLicense(userId, licenseId, updatedData);
    }
  
    @UseGuards(JwtGuard, RolesGuard)
    @Delete(':licenseId/delete')
    deleteLicense(@Param('userId') userId: string, @Param('licenseId') licenseId: string) {
      return this.licenseService.deleteLicense(userId, licenseId);
    }
  }
  