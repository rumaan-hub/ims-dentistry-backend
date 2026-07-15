import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";

import {
  exceptionHandler,
  handlePrismaError,
} from "src/utils/error-handler.util";
import { CreateAddressDto } from "./dto/create-address.dto";
import { UpdateAddressDto } from "./dto/updateAddress.dto";

@Injectable()
export class AddressService {
  private readonly logger: Logger = new Logger(AddressService.name);

  constructor(private prismaService: PrismaService) {}

  async createAddress(userId: string, createAddress: CreateAddressDto) {
    try {
      const userExists = await this.prismaService.user.findUnique({
        where: { id: userId },
      });
      if (!userExists) {
        throw new NotFoundException(`User with ID ${userId} does not exist.`);
      }
      const newAddress = await this.prismaService.address.create({
        data: {
          user: {
            connect: { id: userId },
          },
          officeName: createAddress.officeName,
          phone: createAddress.phone,
          extension: createAddress.extension,
          streetAddress: createAddress.streetAddress,
          building: createAddress.building,
          city: createAddress.city,
          state: createAddress.state,
          zipCode: createAddress.zipCode,
          isDefault: createAddress.isDefault ?? false,
        },
      });
      return {
        data: newAddress,
        message: "Address has been created successfully!",
      };
    } catch (error) {
      this.logger.error("Error registering address", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async findAddressById(userId: string, addressId: string) {
    try {
      const hasAddress = await this.prismaService.address.findUnique({
        where: {
          id: addressId,
          userId,
        },
        include: {
          user: true,
        },
      });
      if (!hasAddress) {
        throw new NotFoundException("Address Not Found!");
      }
      return {
        data: hasAddress,
      };
    } catch (error) {
      this.logger.error("Error registering address", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async findUserAddress(userId: string) {
    try {
      const addresses = await this.prismaService.address.findMany({
        where: {
          userId,
        },
        include: {
          user: true,
        },
      });
      if (!addresses.length) {
        return {
          data: [],
        };
      }
      return {
        data: addresses,
      };
    } catch (error) {
      this.logger.error("Error registering address", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async updateAddress(
    userId: string,
    addressId: string,
    updatedAddress: UpdateAddressDto
  ) {
    try {

      if (updatedAddress.isDefault) {
        const allAddresses = await this.prismaService.address.findMany({
          where: {
            userId,
          },
        });
        for (const address of allAddresses) {
          if (address.isDefault) {
            await this.prismaService.address.update({
              where: {
                id: address.id,
              },
              data: {
                isDefault: false,
              },
            });
          }
        }
      }
      const specificAddress = await this.prismaService.address.findUnique({
        where: {
          id: addressId,
        },
      });
      if (!specificAddress) {
        throw new NotFoundException("Address Not Found!");
      }
      const address = await this.prismaService.address.update({
        where: {
          id: addressId,
          userId,
        },
        data: updatedAddress,
      });
      return {
        data: address,
        message: "Account has been updated successfully!",
      };
    } catch (error) {
      this.logger.error("Error registering address", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async deleteAddress(userId: string, addressId: string) {
    const hasAddress = await this.prismaService.address.findUnique({
      where: {
        id: addressId,
        userId,
      },
    });
    if (!hasAddress) {
      throw new NotFoundException("Address Not Found!");
    }
    await this.prismaService.address.delete({
      where: {
        id: addressId,
      },
    });
    return {
      message: "Address has been deleted succssfully!",
    };
  }
}
