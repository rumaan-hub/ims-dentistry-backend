import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import * as bcrypt from "bcrypt";

import { PrismaService } from "../prisma/prisma.service";

import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import {
  exceptionHandler,
  handlePrismaError,
} from "src/utils/error-handler.util";
import { CreateSuperAdminDto } from "./dto/create-superAdmin.dto";
import { LoginDTO } from "src/user/dto/login-user.dto";
import { RequestUser } from "src/user/interface/user.interface";
import { Role, TransactionStatus } from "@prisma/client";
import { UpdateSuperAdminDto } from "./dto/update-superAdmin.dto";
import * as crypto from "crypto";
import { MailerService } from "src/mailer/mailer.service";
import { startOfDay, endOfDay, subDays, subMonths, subHours } from "date-fns";
import { TransactionFilterDto } from "src/admin/dto/create-admin.dto";
import { groupBy } from "rxjs";
import { FilterOptions } from "src/vendor/dto/filter-options.dto";

@Injectable()
export class SuperAdminService {
  private readonly logger: Logger = new Logger(SuperAdminService.name);

  constructor(
    private prismaService: PrismaService,
    private configService: ConfigService,
    private emailService: MailerService,
    private jwt: JwtService
  ) { }

  async signupForSuperAdmin(createSuperAdminDto: CreateSuperAdminDto) {
    try {
      const { email, role } = createSuperAdminDto;
      const existingUser = await this.prismaService.superAdmin.findUnique({
        where: {
          email: email.toLowerCase(),
          role,
        },
      });

      if (existingUser) {
        throw new ConflictException(
          "This super admin has already been registered"
        );
      }

      const hash = await bcrypt.hash(createSuperAdminDto.password, 10);
      const newUser = await this.prismaService.superAdmin.create({
        data: {
          ...createSuperAdminDto,
          email,
          password: hash,
          firstName: createSuperAdminDto.firstName,
          lastName: createSuperAdminDto.lastName,
          phone: createSuperAdminDto.phone,
          role: Role.SUPER_ADMIN,
          profile: createSuperAdminDto.profile ?? null,
        },
      });

      return { data: newUser };
    } catch (error) {
      this.logger.error("Error registering admin", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async login(loginAdmin: LoginDTO) {
    try {
      const existingAdmin = await this.prismaService.superAdmin.findUnique({
        where: {
          email: loginAdmin.email,
          role: Role.SUPER_ADMIN,
        },
      }) || await this.prismaService.admin.findUnique({
        where: {
          email: loginAdmin.email,
          role: Role.ADMIN,
        },
      })

      if (!existingAdmin && (existingAdmin.role === 'USER' || existingAdmin.role === 'VENDOR')) {
        throw new NotFoundException("No User Found!");
      }

      const isPasswordMatch = await bcrypt.compare(
        loginAdmin.password,
        existingAdmin.password
      );

      if (!isPasswordMatch) {
        throw new ForbiddenException("Incorrect Credentials");
      }

      const { password, ...existingAdminData } = existingAdmin;
      const token = await this.generateToken(
        existingAdmin.id,
        existingAdmin.email,
        this.configService.get("JWT_EXPIRY_TIME"),
        existingAdmin.role
      );
      return { data: existingAdminData, token: token };
    } catch (error) {
      this.logger.error("Error login ", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }


  async updateSuperAdmin(
    id: string,
    updateUserData: UpdateSuperAdminDto,
    loggedInUser: RequestUser
  ) {
    try {
      const userExists = await this.prismaService.superAdmin.findUnique({
        where: { id },
      });

      if (!userExists) {
        throw new NotFoundException(`A user with ID ${id} does not exist.`);
      }

      if (id !== loggedInUser.id && loggedInUser.role !== Role.SUPER_ADMIN) {
        throw new NotFoundException("You don't has access to update that user");
      }
      const userDataToUpdate = {
        ...updateUserData,
        ...(updateUserData.address && {
          address: {
            update: (updateUserData.address || []).map((addr) => ({
              where: { id: addr.id },
              data: addr,
            })),
          },
        }),
      };

      const existingUser = await this.prismaService.superAdmin.update({
        where: {
          id,
        },
        data: userDataToUpdate,
      });
      return {
        data: existingUser,
        message: "User has been updated successfully!",
      };
    } catch (error) {
      this.logger.error("Error update superAdmin", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async deleteSuperAdmin(id: string, loggedInUser: RequestUser) {
    try {
      if (id !== loggedInUser.id && loggedInUser.role !== Role.SUPER_ADMIN) {
        throw new NotFoundException("You don't has access to delete that user");
      }
      await this.prismaService.superAdmin.delete({
        where: {
          id,
        },
      });
      return {
        message: "Super Admin has been deleted successfully!",
      };
    } catch (error) {
      this.logger.error("Error deleting super Admin", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async forgetPassword(email: string) {
    try {
      const isUserExist = await this.prismaService.superAdmin.findUnique({
        where: {
          email,
        },
      });
      if (!isUserExist) {
        throw new NotFoundException("No user found with this email");
      }
      const token = crypto.randomBytes(2).toString("hex");
      const now = new Date();
      const expiration = new Date(now.getTime() + 3600000);

      await this.prismaService.superAdmin.update({
        where: { email },
        data: {
          resetToken: token,
          resetTokenExp: expiration,
        },
      });
      await this.emailService.sendEmail(
        isUserExist.email,
        "Reset password token!",
        `<p>Here is the token to update your password ${token}</p>`
      );
      return {
        message: "Code is generated for reseting password!",
        data: {
          token,
          expiration,
        },
      };
    } catch (error) {
      this.logger.error("Error deleting super Admin", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async verifyResetToken(token: string) {
    const user = await this.prismaService.superAdmin.findFirst({
      where: {
        resetToken: token,
        resetTokenExp: {
          gte: new Date(),
        },
      },
    });

    if (!user) throw new Error("Invalid or expired token");
    return {
      message: "Token is valid. You can now reset your password!",
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.prismaService.superAdmin.findFirst({
      where: {
        resetToken: token,
        resetTokenExp: {
          gte: new Date(),
        },
      },
    });

    if (!user) throw new Error("Invalid or expired token");

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const superAdmin = await this.prismaService.superAdmin.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExp: null,
      },
    });
    return {
      message: "Password has been updated successfully",
      data: superAdmin,
    };
  }

  async findUser(userId: string) {
    try {
      const user = await this.prismaService.superAdmin.findUnique({
        where: {
          id: userId,
          role: Role.SUPER_ADMIN,
        },
      });
      if (!user) {
        throw new ConflictException("No User Found");
      }
      return {
        data: user,
      };
    } catch (error) {
      this.logger.error("Error find single user", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async assignVendorsToAdmin(adminId: string, vendorIds: string[]) {
    try {
      const admin = await this.prismaService.admin.findUnique({
        where: { id: adminId },
        include: { vendors: true },
      });

      if (!admin) {
        throw new ConflictException("This admin does not exist!");
      }
      const alreadyAssignedVendors = await this.prismaService.vendors.findMany({
        where: {
          id: { in: vendorIds },
          adminId: {
            not: null,
          },
        },
      });
      if (alreadyAssignedVendors.length > 0) {
        const assignedVendorNames = alreadyAssignedVendors
          .map((vendor) => `${vendor.firstName} ${vendor.lastName}`)
          .join(", ");
        throw new ConflictException(
          `The following vendors are already assigned to another admin: ${assignedVendorNames}`
        );
      }
      const invalidVendors = await this.prismaService.vendors.findMany({
        where: {
          id: { in: vendorIds },
          OR: [
            { adminId: { not: null } },
            { status: { not: "APPROVE" } },
          ],
        },
      });

      if (invalidVendors.length > 0) {
        const groupedVendors = invalidVendors.reduce((acc, vendor) => {
          if (!acc[vendor.status]) {
            acc[vendor.status] = new Set();
          }
          acc[vendor.status].add(`${vendor.firstName} ${vendor.lastName}`);
          return acc;
        }, {} as Record<string, Set<string>>);
        const errorMessage = Object.entries(groupedVendors)
          .map(([status, names]) => `${Array.from(names).join(", ")} (Status: ${status})`)
          .join("; ");

        throw new ConflictException(
          `The following vendors cannot be assigned: ${errorMessage}`
        );
      }
      const unassignedVendors = vendorIds.filter(
        (id) =>
          !alreadyAssignedVendors.some((assignedVendor) => assignedVendor.id === id)
      );

      await this.prismaService.vendors.updateMany({
        where: {
          id: { in: unassignedVendors },
          adminId: null,
        },
        data: {
          adminId: adminId,
        },
      });

      const updatedAdmin = await this.prismaService.admin.findUnique({
        where: { id: adminId },
        include: { vendors: true },
      });

      return {
        message: "Vendors assigned to admin successfully",
        data: updatedAdmin,
      };
    } catch (error) {
      this.logger.error("Error assigning vendors to admin", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async getAllAvailableVendors() {
    try {
      const vendors = await this.prismaService.vendors.findMany({
        where: {
          admin: null,
        },
        include: {
          admin: true,
        },
      });
      return {
        data: vendors,
      };
    } catch (error) {
      this.logger.error("Error all admins", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async getDashboardMetrics(startDate: Date, endDate: Date, timeFrame: string) {
    try {
      
      let calculatedStartDate: Date;
      let calculatedEndDate: Date = endOfDay(new Date());
      switch (timeFrame.toLowerCase()) {
        case 'overall':
          calculatedStartDate = new Date(0);
          break;
        case '12 months':
          calculatedStartDate = startOfDay(subMonths(new Date(), 12));
          break;
        case '30 days':
          calculatedStartDate = startOfDay(subDays(new Date(), 30));
          break;
        case '7 days':
          calculatedStartDate = startOfDay(subDays(new Date(), 7));
          break;
        case '24 hours':
          calculatedStartDate = startOfDay(subHours(new Date(), 24));
          break;
        case 'custom':
          if (!startDate || !endDate) {
            throw new BadRequestException('Start date and end date are required for custom time frame');
          }
          calculatedStartDate = startOfDay(startDate);
          calculatedEndDate = endOfDay(endDate);
          break;
        default:
          throw new BadRequestException('Invalid time frame specified');
      }
      
      const orders = await this.prismaService.orders.findMany({
        where: {
          createdAt: {
            gte: calculatedStartDate,
            lte: calculatedEndDate,
          },
        },
      });
      const totalRevenue = orders.reduce((sum, order) => sum + order.price, 0);

      const vendors = await this.prismaService.vendors.findMany({
        where: {
          createdAt: {
            gte: calculatedStartDate,
            lte: calculatedEndDate,
          },
        },
        include: {
          products: true,
        },
      });

      const assignedVendors = vendors.filter(vendor => vendor.products.length > 0);
      const unassignedVendors = vendors.length - assignedVendors.length;

      const approvedProducts = await this.prismaService.product.findMany({
        where: {
          approved: true,
          createdAt: {
            gte: calculatedStartDate,
            lte: calculatedEndDate,
          },
        },
      })
      const unapprovedProducts = await this.prismaService.product.findMany({
        where: {
          approved: false,
          createdAt: {
            gte: calculatedStartDate,
            lte: calculatedEndDate,
          },
        },
      })

      return {
        totalOrders: orders.length,
        totalRevenue,
        assignedVendors: assignedVendors.length,
        unassignedVendors,
        approvedProducts: approvedProducts.length,
        unapprovedProducts: unapprovedProducts.length,
      };
    } catch (error) {
      this.logger.error("Failed to retrieve dashboard metrics", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async generateToken(id: string, email: string, time: string, role: string) {
    const payload = {
      id,
      email: email,
      role,
    };

    const jwt_secret = this.configService.get("JWT_SECRET");
    const jwt_expiryTime = time;

    const token = await this.jwt.signAsync(payload, {
      expiresIn: jwt_expiryTime,
      secret: jwt_secret,
    });

    return {
      access_token: token,
    };
  }

  async getTransactions(filter: TransactionFilterDto) {
    const { search, status, page = 1, limit = 10 } = filter;

    const where = this.buildFilterWhereClause({ search, status });

    const totalCount = await this.prismaService.transaction.count({ where });

    const totalPages = Math.ceil(totalCount / limit);

    const transactions = await this.prismaService.transaction.findMany({
      where,
      include: {
        order: {
          include: {
            user: true,
          },
        },
        vendor: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: Number(limit),
    });

    if (!transactions || !Array.isArray(transactions)) {
      return {
        data: [],
        totalItems: 0,
        totalPages: 0,
        currentPage: page,
      };
    }

    const groupedData = this.groupByOrderWithSummary(transactions);

    return {
      data: groupedData,
      totalTransactions: totalCount,
      totalPages,
      currentPage: page,
    };
  }

  private groupByOrderWithSummary(transactions: any[]) {
    const orderMap = new Map<string, any>();

    transactions.forEach(txn => {
      if (!txn.orderId) return;

      if (!orderMap.has(txn.orderId)) {
        orderMap.set(txn.orderId, {
          orderId: txn.orderId,
          stripePaymentIntentId: txn.stripePaymentIntentId,
          customer: {
            id: txn.order?.user?.id || null,
            firstName: txn.order?.user?.firstName || null,
            lastName: txn.order?.user?.lastName || null,
          },
          status: txn.status,
          transactions: [],
          summary: {
            subtotal: 0,
            taxAmount: 0,
            totalAmount: 0,
            refundAmount: 0,
            shippingCost: 0
          }
        });
      }

      const orderGroup = orderMap.get(txn.orderId);
      orderGroup.transactions.push({
        id: txn.id,
        vendor: {
          id: txn.vendor.id || null,
          firstName: txn.vendor.firstName || null,
          lastName: txn.vendor.lastName || null,
        },
        subtotalAmount: txn.subtotalAmount,
        taxAmount: txn.taxAmount,
        totalAmount: txn.totalAmount,
        status: txn.status,
        refundAmount: txn.refundAmount || 0,
        shippingCost: txn.shippingCost || 0,
        createdAt: txn.createdAt
      });

      orderGroup.summary.subtotal += txn.subtotalAmount;
      orderGroup.summary.taxAmount += txn.taxAmount;
      orderGroup.summary.totalAmount += txn.totalAmount;
      orderGroup.summary.refundAmount += txn.refundAmount || 0;
      orderGroup.summary.shippingCost += txn.shippingCost || 0;
    });

    orderMap.forEach(orderGroup => {
      orderGroup.summary = {
        subtotal: this.roundToTwo(orderGroup.summary.subtotal),
        taxAmount: this.roundToTwo(orderGroup.summary.taxAmount),
        totalAmount: this.roundToTwo(orderGroup.summary.totalAmount),
        refundAmount: this.roundToTwo(orderGroup.summary.refundAmount),
        shippingCost: this.roundToTwo(orderGroup.summary.shippingCost)
      };
    });

    return Array.from(orderMap.values());
  }

  private roundToTwo(num: number): number {
    return parseFloat(num.toFixed(2));
  }

  private buildFilterWhereClause(filter: Pick<TransactionFilterDto, 'search' | 'status'>) {
    const where: any = {};
    const search = filter.search?.trim();
    if (search) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

      if (dateRegex.test(search)) {
        const start = new Date(search);
        const end = new Date(search);
        end.setUTCHours(23, 59, 59, 999);

        where.createdAt = {
          gte: start,
          lte: end,
        };
      } else {
        where.orderId = {
          contains: search,
          mode: 'insensitive',
        };
      }
    }

    if (filter.status) {
      where.status = filter.status;
    }

    return where;
  }


  async getSuperAdminById(id: string) {
    try {
      const superAdmin = await this.prismaService.superAdmin.findUnique({
        where: { id },
      });

      if (!superAdmin) {
        throw new NotFoundException("Super Admin not found");
      }

      return {
        data: superAdmin,
      };
    } catch (error) {
      this.logger.error("Error fetching super admin", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async getVendorTransfers(filters: FilterOptions) {
    const { status, search, page, limit } = filters;

    try {
      const AND: any[] = [];

      if (status) AND.push({ status });

      if (search?.trim()) {
        const s = search.trim();
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

        if (dateRegex.test(s)) {
          const start = new Date(s);
          const end = new Date(s);
          end.setUTCHours(23, 59, 59, 999);

          AND.push({ createdAt: { gte: start, lte: end } });
        } else {
          const OR: any[] = [];
          const tokens = s.split(/\s+/).filter(Boolean);

          OR.push(
            { id: { contains: s, mode: 'insensitive' } },
            { vendor: { is: { id: { contains: s, mode: 'insensitive' } } } },
            { orderId: { contains: s, mode: 'insensitive' } },
            { vendor: { is: { firstName: { contains: s, mode: 'insensitive' } } } },
            { vendor: { is: { lastName: { contains: s, mode: 'insensitive' } } } },
          );

          if (tokens.length >= 2) {
            const first = tokens[0];
            const last = tokens[tokens.length - 1];

            OR.push(
              {
                vendor: {
                  is: {
                    AND: [
                      { firstName: { contains: first, mode: 'insensitive' } },
                      { lastName: { contains: last, mode: 'insensitive' } },
                    ],
                  },
                },
              },
              {
                vendor: {
                  is: {
                    AND: [
                      { firstName: { contains: last, mode: 'insensitive' } },
                      { lastName: { contains: first, mode: 'insensitive' } },
                    ],
                  },
                },
              }
            );
          }

          AND.push({ OR });
        }
      }

      const where: any = AND.length > 0 ? { AND } : {};
      const [data, total] = await Promise.all([
        this.prismaService.vendorTransfers.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            order: true,
            vendor: true,
          },
        }),
        this.prismaService.vendorTransfers.count({ where }),
      ]);

      return {
        currentPage: page,
        totalTransfers: total,
        totalPages: Math.ceil(total / limit),
        data,
      };
    } catch (error) {
      this.logger.error('Error fetching vendor transfers data:', error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

}
