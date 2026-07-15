// import { Injectable, Logger, NotFoundException } from "@nestjs/common";
// import { CreateCourierServiceDto } from "./dto/create-courierService.dto";
// import { UpdateCourierServiceDto } from "./dto/update-courierService.dto";
// import { PrismaService } from "src/prisma/prisma.service";

// @Injectable()
// export class CourierServiceService {
//   private readonly logger: Logger = new Logger(CourierServiceService.name);

//   constructor(private readonly prisma: PrismaService) {}

//   async createCourierService(vendorId: string, dto: CreateCourierServiceDto) {
//     try {
//       const vendor = await this.prisma.vendors.findUnique({
//         where: { id: vendorId },
//         select: {
//           courierServices: true,
//         },
//       });
//       if (!vendor) {
//         throw new NotFoundException(`Vendor with ID ${vendorId} not found`);
//       }

//       for (const service of vendor.courierServices) {
//         if (service.name.toLowerCase() === dto.name.toLowerCase()) {
//           throw new Error(
//             `Courier Service with name ${dto.name} already exists for this vendor`
//           );
//         }
//       }

//       const courierService = await this.prisma.courierService.create({
//         data: {
//           vendorId: dto.vendorId,
//           name: dto.name,
//           websiteUrl: dto.websiteUrl,
//           phoneNo: dto.phoneNo,
//         },
//       });
//       return {
//         message: "Courier Service created successfully",
//         courierService,
//       };
//     } catch (error) {
//       this.logger.error("Error creating courier service", error.message);
//       throw error;
//     }
//   }

//   async updateCourierService(
//     id: string,
//     vendorId: string,
//     dto: UpdateCourierServiceDto
//   ) {
//     try {
//       const courierService = await this.prisma.courierService.findUnique({
//         where: { id, vendorId },
//       });
//       if (!courierService) {
//         throw new NotFoundException(`Courier Service with ID ${id} not found`);
//       }
//       if (dto.name && dto.name !== courierService.name) {
//         const existingService = await this.prisma.courierService.findFirst({
//           where: {
//             vendorId,
//             name: dto.name,
//           },
//         });
//         if (existingService) {
//           throw new Error(
//             `Courier Service with name ${dto.name} already exists for this vendor`
//           );
//         }
//       }

//       const updatedcourierService = await this.prisma.courierService.update({
//         where: { id },
//         data: { ...dto },
//       });

//       return {
//         message: "Courier Service updated successfully",
//         courierService: updatedcourierService,
//       };
//     } catch (error) {
//       this.logger.error("Error updating courier service", error.message);
//       throw error;
//     }
//   }

//   async deleteCourierService(id: string, vendorId: string) {
//     try {
//       const courierService = await this.prisma.courierService.findUnique({
//         where: { id, vendorId },
//       });
//       if (!courierService) {
//         throw new NotFoundException(`Courier Service with ID ${id} not found`);
//       }

//       await this.prisma.courierService.delete({
//         where: { id, vendorId },
//       });

//       return { message: "Courier Service deleted successfully" };
//     } catch (error) {
//       this.logger.error("Error deleting courier service", error.message);
//       throw error;
//     }
//   }

//   async getCourierService(id: string) {
//     try {
//       const courierService = await this.prisma.courierService.findUnique({
//         where: { id },
//         include: { vendor: true },
//       });
//       if (!courierService) {
//         throw new NotFoundException(`Courier Service with ID ${id} not found`);
//       }

//       return courierService;
//     } catch (error) {
//       this.logger.error("Error finding courier service", error.message);
//       throw error;
//     }
//   }

//   async getAllCourierService(vendorId: string) {
//     try {
//       const vendor = await this.prisma.vendors.findUnique({
//         where: { id: vendorId },
//       });
//       if (!vendor) {
//         throw new NotFoundException(`Vendor with ID ${vendorId} not found`);
//       }

//       const getCourierService = await this.prisma.courierService.findMany({
//         where: { vendorId },
//       });
//       return getCourierService;
//     } catch (error) {
//       this.logger.error("Error finding courier services", error.message);
//       throw error;
//     }
//   }
// }
