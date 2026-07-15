import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { exceptionHandler, handlePrismaError } from "src/utils/error-handler.util";
import { CreateMaterialDto } from "./dto/create-material.dto";
import { UpdateMaterialDto } from "./dto/update-material.dto";

@Injectable()
export class MaterialService {
  private readonly logger: Logger = new Logger(MaterialService.name);

  constructor(private prismaService: PrismaService) {}

  async createMaterial(materialData: CreateMaterialDto) {
    try {
      const newMaterial = await this.prismaService.material.create({
        data: materialData,
      });
      return {
        data: newMaterial,
        message: "Material has been created successfully!",
      };
    } catch (error) {
      this.logger.error("Error creating material", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async findMaterialById(materialId: string) {
    try {
      const material = await this.prismaService.material.findUnique({
        where: {
          id: materialId,
        },
      });
      if (!material) {
        throw new NotFoundException("Material Not Found!");
      }
      return {
        data: material,
      };
    } catch (error) {
      this.logger.error("Error finding material", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async getAllMaterials() {
    try {
      const brands = await this.prismaService.material.findMany();
      return {
        data: brands,
      };
    } catch (error) {
      this.logger.error("Error finding all brands", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async updateMaterial(materialId: string, updateMaterial: UpdateMaterialDto) {
    try {
      const specificMaterial = await this.prismaService.material.findUnique({
        where: {
          id: materialId,
        },
      });
      if (!specificMaterial) {
        throw new NotFoundException("Material Not Found!");
      }
      const material = await this.prismaService.material.update({
        where: {
          id: materialId,
        },
        data: updateMaterial,
      });
      return {
        data: material,
        message: "Material has been updated successfully!",
      };
    } catch (error) {
      this.logger.error("Error updating material", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async deleteMaterial(materialId: string) {
    try {
      const material = await this.prismaService.material.findUnique({
        where: {
          id: materialId,
        },
      });
      if (!material) {
        throw new NotFoundException("Material Not Found!");
      }
      await this.prismaService.material.delete({
        where: {
          id: materialId,
        },
      });
      return {
        message: "Material has been deleted successfully!",
      };
    } catch (error) {
      this.logger.error("Error deleting material", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }
}
