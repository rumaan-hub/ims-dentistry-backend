import { Injectable, Logger, NotFoundException, BadRequestException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateBannerDto } from "./dto/create-banner.dto";
import { UpdateBannerDto } from "./dto/update-banner.dto";
import { UploadFileService } from "src/upload-file/upload-file.service";
import { handlePrismaError } from "src/utils/error-handler.util";

@Injectable()
export class BannerService {
  private readonly logger: Logger = new Logger(BannerService.name);
  constructor(
    private prismaService: PrismaService,
    private uploadFileService: UploadFileService,
  ) {}

  async create(dto: CreateBannerDto) {
    try {
      if (dto.order === undefined || dto.order === null) {
        const last = await this.prismaService.banner.findFirst({ orderBy: { order: "desc" } });
        dto.order = last ? last.order + 1 : 0;
      }
      const banner = await this.prismaService.banner.create({
        data: { ...dto, overlays: (dto.overlays ?? []) as unknown as Prisma.InputJsonValue },
      });
      return { message: "Banner created successfully", banner };
    } catch (error) {
      this.logger.error("Error creating banner:", error);
      throw handlePrismaError(error);
    }
  }

  async findAllPublic() {
    try {
      return await this.prismaService.banner.findMany({
        where: { isActive: true },
        orderBy: { order: "asc" },
      });
    } catch (error) {
      this.logger.error("Error fetching banners:", error);
      throw handlePrismaError(error);
    }
  }

  async findAll() {
    try {
      return await this.prismaService.banner.findMany({
        orderBy: { order: "asc" },
      });
    } catch (error) {
      this.logger.error("Error fetching banners:", error);
      throw handlePrismaError(error);
    }
  }

  async update(id: string, dto: UpdateBannerDto) {
    try {
      const existing = await this.prismaService.banner.findUnique({ where: { id } });
      if (!existing) throw new NotFoundException("Banner not found");

      const banner = await this.prismaService.banner.update({
        where: { id },
        data: {
          ...dto,
          ...(dto.overlays !== undefined && {
            overlays: dto.overlays as unknown as Prisma.InputJsonValue,
          }),
        },
      });
      return { message: "Banner updated successfully", banner };
    } catch (error) {
      this.logger.error("Error updating banner:", error);
      if (error instanceof NotFoundException) throw error;
      throw handlePrismaError(error);
    }
  }

  async swapOrder(id: string, direction: "up" | "down") {
    try {
      const current = await this.prismaService.banner.findUnique({ where: { id } });
      if (!current) throw new NotFoundException("Banner not found");

      const neighbor = await this.prismaService.banner.findFirst({
        where: {
          order: direction === "up" ? { lt: current.order } : { gt: current.order },
        },
        orderBy: { order: direction === "up" ? "desc" : "asc" },
      });

      if (!neighbor) throw new BadRequestException(`Banner is already at the ${direction === "up" ? "top" : "bottom"}`);

      await this.prismaService.$transaction([
        this.prismaService.banner.update({ where: { id: current.id }, data: { order: neighbor.order } }),
        this.prismaService.banner.update({ where: { id: neighbor.id }, data: { order: current.order } }),
      ]);

      return { message: "Banner order updated successfully" };
    } catch (error) {
      this.logger.error("Error swapping banner order:", error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      throw handlePrismaError(error);
    }
  }

  async delete(id: string) {
    try {
      const existing = await this.prismaService.banner.findUnique({ where: { id } });
      if (!existing) throw new NotFoundException("Banner not found");

      await this.uploadFileService.deleteFile(existing.imageKey);
      await this.prismaService.banner.delete({ where: { id } });
      return { message: "Banner deleted successfully" };
    } catch (error) {
      this.logger.error("Error deleting banner:", error);
      if (error instanceof NotFoundException) throw error;
      throw handlePrismaError(error);
    }
  }
}
