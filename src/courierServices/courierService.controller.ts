// import {
//   Body,
//   Controller,
//   Delete,
//   Get,
//   Param,
//   Post,
//   Put,
//   UseGuards,
// } from "@nestjs/common";
// import { CourierServiceService } from "./courierService.service";
// import { CreateCourierServiceDto } from "./dto/create-courierService.dto";
// import { UpdateCourierServiceDto } from "./dto/update-courierService.dto";
// import { JwtGuard } from "src/user/guard/jwt.guard";
// import { RolesGuard } from "src/user/role/role.guard";
// import { Role } from "src/user/role/role.enum";
// import { Roles } from "src/user/role/role.decorator";

// @Controller("courier-service")
// export class CourierServiceController {
//   constructor(private readonly courierService: CourierServiceService) {}

//   @UseGuards(JwtGuard, RolesGuard)
//   @Roles(Role.VENDOR)
//   @Post("vendor/:vendorId/create")
//   async create(
//     @Body() dto: CreateCourierServiceDto,
//     @Param("vendorId") vendorId: string
//   ) {
//     return await this.courierService.createCourierService(vendorId, dto);
//   }

//   @UseGuards(JwtGuard, RolesGuard)
//   @Roles(Role.VENDOR)
//   @Put(":id/vendor/:vendorId/update")
//   async update(
//     @Param("id") id: string,
//     @Param("vendorId") vendorId: string,
//     @Body() dto: UpdateCourierServiceDto
//   ) {
//     return await this.courierService.updateCourierService(id, vendorId, dto);
//   }

//   @UseGuards(JwtGuard, RolesGuard)
//   @Roles(Role.VENDOR)
//   @Delete(":id/vendor/:vendorId/delete")
//   async remove(@Param("id") id: string, @Param("vendorId") vendorId: string) {
//     return await this.courierService.deleteCourierService(id, vendorId);
//   }

//   @UseGuards(JwtGuard, RolesGuard)
//   @Roles(Role.VENDOR)
//   @Get(":id")
//   async getCourierService(@Param("id") id: string) {
//     return await this.courierService.getCourierService(id);
//   }

//   @UseGuards(JwtGuard, RolesGuard)
//   @Roles(Role.VENDOR)
//   @Get("vendor/:vendorId")
//   async getAllCourierService(@Param("vendorId") vendorId: string) {
//     return await this.courierService.getAllCourierService(vendorId);
//   }
// }
