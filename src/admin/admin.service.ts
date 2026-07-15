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
import { LoginDTO } from "src/user/dto/login-user.dto";
import { Admin, Role, Status, TransactionStatus, vendorStatus } from "@prisma/client";
import { CreateAdminDto } from "src/superAdmin/dto/create-admin.dto";
import { RequestUser } from "src/user/interface/user.interface";
import { MailerService } from "src/mailer/mailer.service";
import { UpdateAdminDto } from "./dto/update-admin.dto";
import { UpdatePasswordDto } from "src/user/dto/updatePasswordDto.dto copy";
import { ResetPasswordDto } from "src/user/dto/resetPassword.dto";
import { updateVendorStatusDto } from "./dto/update-vendor-status-dto";
import { adminActivationEmail, adminDeactivationEmail, vendorApprovedStatusEmail, vendorBlockStatusEmail, vendorPendingStatusEmail, vendorRejectedStatusEmail, vendorReSubmitStatusEmail } from "src/utils/vendorEmailTemplates";
import { getForgotPasswordEmailTemplate } from "src/utils/email-templates";
import { TransactionFilterDto } from "./dto/create-admin.dto";
import { FilterOptions } from "src/vendor/dto/filter-options.dto";
import { endOfDay, startOfDay, subDays, subHours, subMonths } from "date-fns";

@Injectable()
export class AdminService {
  private readonly logger: Logger = new Logger(AdminService.name);

  constructor(
    private prismaService: PrismaService,
    private configService: ConfigService,
    private emailService: MailerService,
    private jwt: JwtService
  ) { }

  async login(loginAdmin: LoginDTO) {
    try {
      const existingAdmin = await this.prismaService.admin.findUnique({
        where: {
          email: loginAdmin.email,
          role: Role.ADMIN,
          status: Status.ACTIVE,
        },
      });

      if (!existingAdmin) {
        throw new NotFoundException("No User Found!");
      }

      if (existingAdmin.status === Status.IN_ACTIVE) {
        throw new ForbiddenException("Your account has been deactivated. Please contact the Super Admin for assistance.");
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

  async signupForAdmin(createAdminDto: CreateAdminDto) {
    try {
      const { email, role } = createAdminDto;
      const existingUser = await this.prismaService.admin.findUnique({
        where: {
          email: email.toLowerCase(),
          role: role || Role.ADMIN,
        },
      });

      if (existingUser) {
        throw new ConflictException(
          "This admin has already been registered with this email!"
        );
      }

      const hash = await bcrypt.hash(createAdminDto.password, 10);

      const admin = await this.prismaService.admin.create({
        data: {
          email,
          password: hash,
          firstName: createAdminDto.firstName,
          lastName: createAdminDto.lastName,
          phone: createAdminDto.phone,
          dateOfBirth: createAdminDto.dateOfBirth
            ? new Date(createAdminDto.dateOfBirth)
            : null,
          role: Role.ADMIN,
          address: createAdminDto.address ?? "",
          status: Status.ACTIVE,
          profile: createAdminDto.profile ?? null
        },
      });

      if (createAdminDto.emergencyContact) {
        await this.prismaService.emergencyContact.create({
          data: {
            ...createAdminDto.emergencyContact,
            adminId: admin.id,
          },
        });
      }

      if (createAdminDto.adminRoles && createAdminDto.adminRoles.length > 0) {
        const rolePromises = createAdminDto.adminRoles.map((role) =>
          this.prismaService.adminRole.create({
            data: {
              ...role,
              adminId: admin.id,
            },
          })
        );
        await Promise.all(rolePromises);
      }

      return { data: admin, message: "Admin has been created successfully" };
    } catch (error) {
      this.logger.error("Error registering admin", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async findAllAdmins(
    page: number,
    limit: number,
    search: string,
    status: string
  ) {
    try {
      const skip = (page - 1) * limit;
      const whereClause: any = {};
      search = search?.trim();

      if (search) {
        const tokens = search.split(/\s+/).filter(Boolean);
        whereClause.OR = [
          { firstName: { contains: search, mode: "insensitive" } },
          { lastName: { contains: search, mode: "insensitive" } },
          { phone: { contains: search } },
          { email: { contains: search, mode: "insensitive" } },
        ];
        if (tokens.length >= 2) {
          const first = tokens[0];
          const last = tokens[tokens.length - 1];
          whereClause.OR.push(
            {
              AND: [
                { firstName: { contains: first, mode: "insensitive" } },
                { lastName: { contains: last, mode: "insensitive" } },
              ],
            },
            {
              AND: [
                { firstName: { contains: last, mode: "insensitive" } },
                { lastName: { contains: first, mode: "insensitive" } },
              ],
            }
          );
        }
      }

      const validStatuses = [Status.ACTIVE, Status.IN_ACTIVE];
      if (status && validStatuses.includes(status as Status)) {
        whereClause.status = status as Status;
      }
      const allUsers = await this.prismaService.admin.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          adminRoles: true,
          vendors: true,
          emergencyContact: true,
        }
      });
      const totalAdmins = await this.prismaService.admin.count({
        where: whereClause,
      });
      return {
        data: allUsers,
        currentPage: page,
        totalPages: Math.ceil(totalAdmins / limit),
        totalVendors: totalAdmins,
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

  async getSpecificAdmin(adminId: string) {
    try {
      const admin = await this.prismaService.admin.findUnique({
        where: {
          id: adminId,
        },
        include: {
          adminRoles: true,
          emergencyContact: true,
          vendors: true,
        },
      });
      if (!admin) {
        throw new NotFoundException("User not found!");
      }
      return {
        data: admin,
      };
    } catch (error) {
      this.logger.error("Error", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async updateAdmin(
    id: string,
    updateAdminDto: UpdateAdminDto,
  ) {
    try {
      const {
        firstName,
        lastName,
        email,
        phone,
        address,
        status,
        emergencyContact,
        adminRoles,
        dateOfBirth,
        reason,
        profile,
        password
      } = updateAdminDto;

      const existingAdmin = await this.prismaService.admin.findUnique({
        where: { id: id },
      });

      if (!existingAdmin) {
        throw new NotFoundException(`Admin with ID ${id} not found`);
      }

      if (status === Status.ACTIVE) {
        if (existingAdmin.status === Status.ACTIVE) {
          throw new BadRequestException(`Admin with ID ${id} is already active`);
        }

        const activatedAdmin = await this.prismaService.admin.update({
          where: { id },
          data: { status: Status.ACTIVE },
        });

        await this.emailService.sendEmail(
          activatedAdmin.email,
          "Admin Account Activation",
          adminActivationEmail(activatedAdmin)
        )
        return {
          data: activatedAdmin,
          message: "Admin has been activated successfully!",
        };
      }

      if (status === Status.IN_ACTIVE) {
        return await this.deactivateAdmin(existingAdmin, reason);
      }

      if (email && email !== existingAdmin.email) {
        const emailExists = await this.prismaService.admin.findFirst({
          where: { email, NOT: { id } },
        });

        if (emailExists) {
          throw new ConflictException("This email is already in use!");
        }
      }

      let hashedPassword: string | undefined = undefined;
      if (password) {
        hashedPassword = await bcrypt.hash(password, 10);
      }
      const updatedAdmin = await this.prismaService.admin.update({
        where: { id },
        data: {
          firstName,
          lastName,
          email,
          phone,
          address,
          status,
          profile,
          dateOfBirth: dateOfBirth
            ? new Date(dateOfBirth)
            : existingAdmin.dateOfBirth,
          password: hashedPassword ?? existingAdmin.password,
        },
      });

      if (emergencyContact) {
        const existingContact =
          await this.prismaService.emergencyContact.findUnique({
            where: { adminId: id },
          });

        if (existingContact) {
          await this.prismaService.emergencyContact.update({
            where: { adminId: id },
            data: { ...emergencyContact },
          });
        } else {
          await this.prismaService.emergencyContact.create({
            data: {
              firstName: emergencyContact.firstName,
              lastName: emergencyContact.lastName,
              contactNo: emergencyContact.contactNo,
              relation: emergencyContact.relation,
              admin: {
                connect: { id },
              },
            },
          });
        }
      }

      if (adminRoles && adminRoles.length > 0) {
        await this.prismaService.adminRole.deleteMany({
          where: { adminId: id },
        });

        const rolePromises = adminRoles.map((role) =>
          this.prismaService.adminRole.create({
            data: {
              ...role,
              adminId: id,
            },
          })
        );
        await Promise.all(rolePromises);
      }
      return {
        data: updatedAdmin,
        message: "Admin data has been updated successfully!",
      };
    } catch (error) {
      this.logger.error("Error update admin", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async deactivateAdmin(admin: Admin, reason: string) {
    try {
      if (!reason || reason === '') {
        throw new BadRequestException("Deactivation reason is required.");
      }

      await this.prismaService.vendors.updateMany({
        where: { adminId: admin.id },
        data: { adminId: null }
      })
      await this.prismaService.admin.update({
        where: { id: admin.id },
        data: { status: Status.IN_ACTIVE, reason: reason },
      })

      await this.emailService.sendEmail(
        admin.email,
        "Account Deactivation Notice",
        adminDeactivationEmail(admin, reason)
      )

      return { message: "Admin account has been deactivated successfully" }
    } catch (error) {
      this.logger.error(`Error deactivating admin ${admin.id}:`, error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async verifyVendor(adminId: string, vendorId: string, loggedInUser: RequestUser, updateVendorStatus: updateVendorStatusDto) {
    try {

      if (loggedInUser.role === "ADMIN") {
        const selectedAdmin = await this.prismaService.admin.findUnique({
          where: { id: adminId },
          include: { vendors: true },
        });

        if (!selectedAdmin) {
          throw new NotFoundException("Admin Not Found!");
        }
      }
      if (loggedInUser.role === "SUPER_ADMIN") {
        const selectedSuperAdmin = await this.prismaService.superAdmin.findUnique({
          where: { id: adminId },
        });

        if (!selectedSuperAdmin) {
          throw new NotFoundException("Admin Not Found!");
        }
      }
      const vendor = await this.prismaService.vendors.findUnique({
        where: { id: vendorId },
      });

      if (!vendor) {
        throw new NotFoundException("Vendor Not Found!");
      }

      await this.prismaService.vendors.update({
        where: { id: vendorId },
        data: {
          status: updateVendorStatus.status,
          reason: updateVendorStatus.reason,
          lastStatusNotifyAt: null
        },
      });

      let emailContent = "";
      switch (updateVendorStatus.status) {
        case "APPROVE":
          emailContent = vendorApprovedStatusEmail(vendor.firstName, vendor.lastName);
          break;
        case "BLOCK":
          emailContent = vendorBlockStatusEmail(vendor.firstName, vendor.lastName, updateVendorStatus.reason);
          break;
        case "REJECT":
          emailContent = vendorRejectedStatusEmail(vendor.firstName, vendor.lastName, updateVendorStatus.reason);
          break;
        case "RESUBMIT":
          emailContent = vendorReSubmitStatusEmail(vendor.firstName, vendor.lastName, updateVendorStatus.reason);
          break;
        case "PENDING":
          emailContent = vendorPendingStatusEmail(vendor.firstName, vendor.lastName);
          break;
        default:
          throw new BadRequestException("Invalid status provided");
      }
      await this.emailService.sendEmail(
        vendor.email,
        `Vendor Profile Status: ${updateVendorStatus.status}`,
        emailContent
      );
      let toastMessage = "";
      if (updateVendorStatus.status === "PENDING") {
        toastMessage = "The vendor status has been updated to Pending for further review."
      } else if (updateVendorStatus.status === "APPROVE") {
        toastMessage = "The vendor has been successfully approved and is now authorized to operate."
      } else if (updateVendorStatus.status === "REJECT") {
        toastMessage = "You have rejected the vendor application. Please ensure the provided reason is communicated."
      } else if (updateVendorStatus.status === "BLOCK") {
        toastMessage = `The vendor has been blocked and can no longer access the platform.`
      } else if (updateVendorStatus.status === "RESUBMIT") {
        toastMessage = `The vendor has been asked to resubmit the application with the required updates.`
      }
      return {
        message: toastMessage
      };
    } catch (error) {
      this.logger.error("Error updating vendor status", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async getAssignedVendors(adminId: string, searchTerm: string, page: number, limit: number, status: string) {
    try {
      const isAdmin = await this.prismaService.admin.findUnique({
        where: {
          id: adminId
        }
      })
      if (!isAdmin) {
        throw new NotFoundException('Admin does not exist!')
      }

      const skip = (page - 1) * limit;
      const filters: any = { adminId };

      if (searchTerm) {
        searchTerm = searchTerm?.trim();
        const tokens = searchTerm.split(/\s+/).filter(Boolean);
        const OR: any[] = [
          {
            firstName: {
              contains: searchTerm,
              mode: "insensitive",
            },
          },
          {
            lastName: {
              contains: searchTerm,
              mode: "insensitive",
            },
          },
        ];

        if (tokens.length >= 2) {
          const first = tokens[0];
          const last = tokens[tokens.length - 1];

          OR.push(
            {
              AND: [
                { firstName: { contains: first, mode: "insensitive" } },
                { lastName: { contains: last, mode: "insensitive" } },
              ],
            },
            {
              AND: [
                { firstName: { contains: last, mode: "insensitive" } },
                { lastName: { contains: first, mode: "insensitive" } },
              ],
            }
          );
        }

        filters.OR = OR;
      }

      const validateStatus = [vendorStatus.APPROVE, vendorStatus.BLOCK, vendorStatus.PENDING, vendorStatus.REJECT, vendorStatus.RESUBMIT];
      if (status && validateStatus.includes(status as vendorStatus)) {
        filters.status = status;
      }
      const assignedVendors = await this.prismaService.vendors.findMany({
        where: filters,
        skip: skip,
        take: limit,
        orderBy: [
          {
            status: 'asc',
          },
          {
            updatedAt: 'desc',
          },
        ],
      });
      const totalVendors = await this.prismaService.vendors.count({
        where: filters,
      });
      return {
        data: assignedVendors,
        currentPage: page,
        totalPages: Math.ceil(totalVendors / limit),
        totalVendors: totalVendors,
      };
    } catch (error) {
      this.logger.error("Error", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async unAssignedVendorFromAdmin(adminId: string, vendorId: string, loggedInUser: RequestUser) {
    try {
      if (!loggedInUser) {
        throw new ForbiddenException('You are not authorized to perform this action');
      }
      if (loggedInUser.role === "ADMIN") {
        const isAdmin = await this.prismaService.admin.findUnique({
          where: {
            id: adminId
          }
        });
        if (!isAdmin) {
          throw new NotFoundException('Admin does not exist!');
        }
      }
      if (loggedInUser.role === Role.SUPER_ADMIN) {
        const isSuperAdmin = await this.prismaService.superAdmin.findUnique({
          where: { id: adminId }
        })
        if (!isSuperAdmin) {
          throw new NotFoundException('superAdmin does not exist!');
        }
      }

      const updatedVendor = await this.prismaService.vendors.update({
        where: {
          id: vendorId
        },
        data: {
          adminId: null
        }
      });

      return {
        message: 'Vendor unassigned successfully',
        vendor: updatedVendor
      };
    } catch (error) {
      this.logger.error("Error", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async deleteAdmin(adminId: string) {
    try {
      const isAdminExist = await this.prismaService.admin.findUnique({
        where: {
          id: adminId,
        },
      });
      if (!isAdminExist) {
        throw new ConflictException("No Admin found in the database!");
      }
      await this.prismaService.emergencyContact.deleteMany({
        where: {
          adminId: adminId,
        },
      });
      await this.prismaService.adminRole.deleteMany({
        where: {
          adminId: adminId,
        },
      });
      await this.prismaService.admin.delete({
        where: {
          id: adminId,
        },
      });

      return {
        message: "Admin has been deleted successfully",
      };
    } catch (error) {
      this.logger.error("Error deleting Admin", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async forgetPassword(email: string) {
    try {
      const isAdminExist = await this.prismaService.admin.findUnique({
        where: {
          email,
        },
      });
      if (!isAdminExist) {
        throw new NotFoundException("No user found with this email");
      }
      const { access_token } = await this.generateToken(isAdminExist.id, isAdminExist.email, this.configService.get('JWT_RESET_PASS_EXPIRY_TIME'), isAdminExist.role);

      const url = `${this.configService.get('HOST_URL')}/change-password?id=${isAdminExist.id
        }&token=${access_token}`;

      await this.emailService.sendEmail(
        isAdminExist.email,
        "Reset Your Password - Dentistry99",
        getForgotPasswordEmailTemplate(isAdminExist, url)
      );
      return {
        message: "Reset password link has been sent to your email!",
      };
    } catch (error) {
      this.logger.error("Error Forget password for user", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async verifyToken() {
    try {
      return { message: "Token Verified" };
    } catch (error) {
      this.logger.error('Error verifying token:', error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async updatePassword(vendorId: string, dto: UpdatePasswordDto) {
    try {
      const isAdminExist = await this.prismaService.admin.findUnique({
        where: {
          id: vendorId,
        }
      });

      if (!isAdminExist) {
        throw new NotFoundException('Admin not found');
      }

      const hash = await bcrypt.hash(dto.newPassword, 10);
      if (dto.newPassword !== dto.confirmNewPassword) {
        throw new BadRequestException('New password and confirmation password must match.');
      }
      await this.prismaService.admin.update({
        where: {
          id: isAdminExist.id,
        },
        data: {
          password: hash
        },
      });

      return { message: 'Your password has been successfully updated.' }

    } catch (error) {
      this.logger.error('Error updating password:', error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async resetPassword(id: string, dto: ResetPasswordDto) {
    try {
      const isAdminExist = await this.prismaService.admin.findUnique({
        where: {
          id,
        }
      });

      if (!isAdminExist) {
        throw new NotFoundException('Admin not found');
      }

      const isPasswordMatch = await bcrypt.compare(dto.oldPassword, isAdminExist.password);

      if (!isPasswordMatch)
        throw new NotFoundException('Incorrrect old password');
      if (dto.newPassword !== dto.confirmNewPassword) {
        throw new BadRequestException('New password and confirmation password must match.');
      }
      const hash = await bcrypt.hash(dto.newPassword, 10);

      await this.prismaService.admin.update({
        where: {
          id: isAdminExist.id,
        },
        data: {
          password: hash
        },
      });

      return { message: 'Your password has been successfully updated.' }

    } catch (error) {
      this.logger.error('Error resetting password:', error);
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

  async getTransactions(filter: TransactionFilterDto, adminId: string) {
    const {
      status,
      search,
      page = 1,
      limit = 10,
    } = filter;

    const AND: any[] = [{ vendor: { adminId } }];

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
          { customer: { is: { firstName: { contains: s, mode: 'insensitive' } } } },
          { customer: { is: { lastName: { contains: s, mode: 'insensitive' } } } },
        );

        if (tokens.length >= 2) {
          const first = tokens[0];
          const last = tokens[tokens.length - 1];

          OR.push(
            {
              customer: {
                is: {
                  AND: [
                    { firstName: { contains: first, mode: 'insensitive' } },
                    { lastName: { contains: last, mode: 'insensitive' } },
                  ],
                },
              },
            },
            {
              customer: {
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

    const where: any = { AND };

    const [data, total] = await Promise.all([
      this.prismaService.transaction.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: true,
          vendor: true,
          order: true,
        },
      }),
      this.prismaService.transaction.count({ where }),
    ]);

    return {
      currentPage: page,
      totalTransactions: total,
      totalPages: Math.ceil(total / limit),
      data,
    };
  }

  async getVendorTransfers(adminId: string, filters: FilterOptions) {
    const { status, search, page, limit } = filters;

    try {

      const AND: any[] = [{ vendor: { is: { adminId } } }];

      if (status) AND.push({ status });

      if (search?.trim()) {
        const s = search.trim();
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

        if (dateRegex.test(s)) {
          const start = new Date(s);
          const end = new Date(s);
          end.setUTCHours(23, 59, 59, 999);

          AND.push({
            createdAt: { gte: start, lte: end },
          });
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

      const where: any = { AND };

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

  async getDashboardMetrics(startDate: Date, endDate: Date, timeFrame: string, admin: RequestUser) {
    try {

      const adminId = admin.id;
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
          products: {
            some: {
              vendor: {
                adminId: adminId
              }
            }
          }
        },
      });
      const totalRevenue = orders.reduce((sum, order) => sum + order.price, 0);
  
      const vendors = await this.prismaService.vendors.findMany({
        where: {
          createdAt: {
            gte: calculatedStartDate,
            lte: calculatedEndDate,
          },
          adminId: adminId
        },
        include: {
          products: true,
        },
      });
  
      const assignedVendors = vendors.filter(vendor => vendor.products.length > 0);
      const unassignedVendors = vendors.length - assignedVendors.length;
  
      const approvedProducts =await this.prismaService.product.findMany({
        where: {
          approved: true,
          vendor: {
            adminId: adminId
          },
          createdAt: {
            gte: calculatedStartDate,
            lte: calculatedEndDate,
          },
        },
      })
      const unapprovedProducts = await this.prismaService.product.findMany({
        where: {
          approved: false,
          vendor: {
            adminId: adminId
          },
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
  
}
