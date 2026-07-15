import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { handlePrismaError } from "src/utils/error-handler.util";
import { CreateInventoryTypeDto } from "./dto/create-inventory-type.dto";

@Injectable()
export class InventoryTypeService {
  private readonly logger = new Logger(InventoryTypeService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getAllInventoryTypes() {
    try {
      return await this.prisma.inventory_type.findMany({
        where: {
          isActive: true,
        },
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      });
    } catch (error) {
      this.logger.error("Error fetching inventory types", error);
      throw handlePrismaError(error);
    }
  }

  async createInventoryType(payload: CreateInventoryTypeDto) {
    try {
      const existing = await this.prisma.inventory_type.findUnique({
        where: {
          name: payload.name,
        },
      });

      if (existing?.isActive) {
        throw new BadRequestException("Inventory type already exists.");
      }

      if (existing && !existing.isActive) {
        const reactivated = await this.prisma.inventory_type.update({
          where: { id: existing.id },
          data: { isActive: true },
          select: { id: true, name: true },
        });

        return {
          data: reactivated,
          message: "Inventory type has been reactivated successfully!",
        };
      }

      const created = await this.prisma.inventory_type.create({
        data: {
          name: payload.name,
        },
        select: {
          id: true,
          name: true,
        },
      });

      return {
        data: created,
        message: "Inventory type has been created successfully!",
      };
    } catch (error) {
      this.logger.error("Error creating inventory type", error);
      if (error?.response) {
        throw error;
      }
      throw handlePrismaError(error);
    }
  }

  async softDeleteInventoryType(id: string) {
    try {
      const existing = await this.prisma.inventory_type.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new NotFoundException("Inventory type not found!");
      }

      if (!existing.isActive) {
        return {
          message: "Inventory type is already inactive.",
        };
      }

      await this.prisma.inventory_type.update({
        where: { id },
        data: {
          isActive: false,
        },
      });

      return {
        message: "Inventory type has been deleted successfully!",
      };
    } catch (error) {
      this.logger.error("Error deleting inventory type", error);
      if (error?.response) {
        throw error;
      }
      throw handlePrismaError(error);
    }
  }
}
