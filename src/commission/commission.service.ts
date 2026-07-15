import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { UpdateCommissionDto } from "./dto/update-commission.dto";
import {
  exceptionHandler,
  handlePrismaError,
} from "src/utils/error-handler.util";

@Injectable()
export class CommissionService {
  private readonly logger: Logger = new Logger(CommissionService.name);

  constructor(private prismaService: PrismaService) {}

  async addCommission(vendorId: string) {
    try {
      const vendor = await this.prismaService.vendors.findUnique({
        where: { id: vendorId },
      });
      if (!vendor) {
        throw new NotFoundException("vendor not found.");
      }
      const existing = await this.prismaService.commission.findUnique({
        where: { vendorId },
      });

      if (existing) return;

      const commission = await this.prismaService.commission.create({
        data: {
          vendorId: vendorId,
        },
      });

      return {
        commission,
        message: "Vendor commission created successfully",
      };
    } catch (error) {
      this.logger.error("Error add commission", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async updateCommission(vendorId: string, commissionDto: UpdateCommissionDto) {
    try {
      const vendor = await this.prismaService.vendors.findUnique({
        where: { id: vendorId },
      });
      if (!vendor) {
        throw new NotFoundException("vendor not found.");
      }

      const commission = await this.prismaService.commission.update({
        where: { vendorId },
        data: {
          commissionPercentage: commissionDto.commissionPercentage,
          payOnStatus: commissionDto.payOnStatus,
          calculationMethod: commissionDto.calculationMethod,
        },
      });

      return {
        commission,
        message: "Vendor commission update successfully",
      };
    } catch (error) {
      this.logger.error("Error update commission", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async getCommission(vendorId: string) {
    try {
      const vendor = await this.prismaService.vendors.findUnique({
        where: { id: vendorId },
      });
      if (!vendor) {
        throw new NotFoundException("vendor not found.");
      }

      const commission = await this.prismaService.commission.findFirst({
        where: { vendorId },
      });

      return {
        commission,
        message: "Vendor commission fetch successfully",
      };
    } catch (error) {
      this.logger.error("Error fetch commission", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }
}
