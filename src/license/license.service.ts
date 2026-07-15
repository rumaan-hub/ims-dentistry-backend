import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateLicenseDto } from "./dto/createLicense.dto";
import { UpdateLicensesDto } from "./dto/updateLicense.dto";
import {
  exceptionHandler,
  handlePrismaError,
} from "src/utils/error-handler.util";

@Injectable()
export class LicenseService {
  private readonly logger: Logger = new Logger(LicenseService.name);

  constructor(private prismaService: PrismaService) {}

  async createLicense(userId: string, createLicenseDto: CreateLicenseDto) {
    try {
      const userExists = await this.prismaService.user.findUnique({
        where: { id: userId },
      });
      if (!userExists) {
        throw new NotFoundException(`User with ID ${userId} does not exist.`);
      }
      const newLicense = await this.prismaService.licenseList.create({
        data: {
          userId,
          ...createLicenseDto,
        },
      });
      return {
        data: newLicense,
        message: "License has been created successfully!",
      };
    } catch (error) {
      this.logger.error("Error creating license", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async findLicenseById(userId: string, licenseId: string) {
    try {
      const license = await this.prismaService.licenseList.findUnique({
        where: {
          id: licenseId,
          userId,
        },
        include: {
          user: true,
        },
      });
      if (!license) {
        throw new NotFoundException("License Not Found!");
      }
      return {
        data: license,
      };
    } catch (error) {
      this.logger.error("Error finding license", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async findLicenseByUser(userId: string) {
    try {
      const userLicense = await this.prismaService.licenseList.findMany({
        where: {
          userId,
        },
        include: {
          user: true,
        },
      });
      if (!userLicense.length) {
        return {
          data: [],
        };
      }
      return {
        data: userLicense,
      };
    } catch (error) {
      this.logger.error("Error finding license", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async updateLicense(
    userId: string,
    licenseId: string,
    updatedLicense: UpdateLicensesDto
  ) {
    try {
      if (updatedLicense.isDefault) {
        await this.prismaService.licenseList.updateMany({
          where: {
            userId,
            isDefault: true,
          },
          data: {
            isDefault: false,
          },
        });
      }
    const specificLicense = await this.prismaService.licenseList.findFirst({
      where: {
        id: licenseId,
        userId,
      },
    });
    if (!specificLicense) {
      throw new NotFoundException("License Not Found!");
    }

    const license = await this.prismaService.licenseList.update({
      where: {
        id: licenseId,
      },
      data: updatedLicense,
    });
    
    return {
      data: license,
      message: "License has been updated successfully!",
    };
    } catch (error) {
      this.logger.error("Error updating license", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async deleteLicense(userId: string, licenseId: string) {
    try {
      const license = await this.prismaService.licenseList.findUnique({
        where: {
          id: licenseId,
          userId,
        },
      });
      if (!license) {
        throw new NotFoundException("License Not Found!");
      }
      await this.prismaService.licenseList.delete({
        where: {
          id: licenseId,
        },
      });
      return {
        message: "License has been deleted successfully!",
      };
    } catch (error) {
      this.logger.error("Error deleting license", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }
}
