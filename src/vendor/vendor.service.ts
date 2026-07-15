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
import { Role, vendorStatus} from "@prisma/client";
import { CreateVendorDto } from "./dto/create-vendor.dto";
import { DeactivateVendorDto, UpdateVendorDto } from "./dto/update-vendor.dto";
import { RequestUser } from "src/user/interface/user.interface";
import * as crypto from "crypto";
import { MailerService } from "src/mailer/mailer.service";
import { endOfDay, endOfWeek, startOfDay, startOfMonth, startOfWeek, startOfYear, subDays, subHours, subMonths, subWeeks } from "date-fns";
import { StripeService } from "src/payment/payment.service";
import { UpdatePasswordDto } from "src/user/dto/updatePasswordDto.dto copy";
import { ResetPasswordDto } from "src/user/dto/resetPassword.dto";
import { getVendorActivationEmailTemplate, getVendorDeactivateEmailTemplate, vendorBlockStatusEmail, vendorPendingStatusEmail, vendorRejectedStatusEmail, vendorReSubmitStatusEmail, vendorReSubmittedProfileEmailForAdmin } from "src/utils/vendorEmailTemplates";
import { getForgotPasswordEmailTemplate, getVerifyEmailTemplate } from "src/utils/email-templates";
import { v4 as uuidv4 } from 'uuid';
import { EventEmitter2 } from "@nestjs/event-emitter";
import { CommissionService } from "src/commission/commission.service";
import { FilterOptions } from "./dto/filter-options.dto";

@Injectable()
export class VendorService {
  private readonly logger: Logger = new Logger(VendorService.name);

  constructor(
    private prismaService: PrismaService,
    private configService: ConfigService,
    private emailService: MailerService,
    private jwt: JwtService,
    private stripeService: StripeService,
    private eventEmitter: EventEmitter2,
    private commissionService: CommissionService
  ) {}

  async signupForVendor(createVendorDto: CreateVendorDto) {
    try {
      const { email, role } = createVendorDto;
      const existingUser = await this.prismaService.vendors.findUnique({
        where: {
          email: email.toLowerCase(),
          role: role || Role.VENDOR,
        },
      });

      if (existingUser) {
        throw new ConflictException("This vendor has already been registered");
      }

      const hashedPassword = await bcrypt.hash(createVendorDto.password, 10);

      if (createVendorDto.businessType === 'BUSINESS_PROFILE') {
        if (!createVendorDto.webisteName) {
          throw new NotFoundException("Please enter website name for the registration");
        } else if (!createVendorDto.websiteUrl) {
          throw new NotFoundException("Please provide website url for registration")
        }
      }
      
      const verificationToken = uuidv4();
      const verificationTokenExpiry = new Date();
      const expiryMinutes = parseInt(this.configService.get('VERIFICATION_TOKEN_EXPIRY_TIME') || '10', 10);
      verificationTokenExpiry.setMinutes(verificationTokenExpiry.getMinutes() + expiryMinutes);

      const newVendor = await this.prismaService.vendors.create({
        data: {
          firstName: createVendorDto.firstName,
          lastName: createVendorDto.lastName,
          phone: createVendorDto.phone,
          workPhone: createVendorDto.workPhone,
          businessType: createVendorDto.businessType,
          ownProductManf: createVendorDto.ownProductManf ?? false,
          autherizeDist: createVendorDto.autherizeDist ?? false,
          email: email.toLowerCase(),
          dateOfBirth: createVendorDto.dateOfBirth ?? "",
          password: hashedPassword,
          role: Role.VENDOR,
          isApproved: false,
          webisteName: createVendorDto.webisteName,
          websiteUrl: createVendorDto.websiteUrl,
          returnPolicy: createVendorDto.returnPolicy ?? false,
          profile: createVendorDto.profile ?? "",
          resetToken: verificationToken,
          resetTokenExp: verificationTokenExpiry,
          address: {
            create: {
              streetAddress: createVendorDto.address.streetAddress,
              city: createVendorDto.address.city,
              state: createVendorDto.address.state,
              zipCode: createVendorDto.address.zipCode,
              country: createVendorDto.address.country,
            },
          },
        },
      });

      const verificationLink = this.configService.get("VENDOR_VERIFY_URL");
      await this.emailService.sendEmail(
        email,
        'Verify your Email',
        getVerifyEmailTemplate(newVendor, verificationLink, verificationToken)
      );

      await this.commissionService.addCommission(newVendor.id);

      this.eventEmitter.emit('created.vendor', { vendor: newVendor });
      
      return {
        data: newVendor,
        message: "Vendor has been created successfully. Please verify your email.",
      };
    } catch (error) {
      this.logger.error("Error registering admin", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async verifyVendorEmail(token: string) {
    const vendor = await this.prismaService.vendors.findFirst({
      where: {
        resetToken: token,
        resetTokenExp: {
          gt: new Date(),
        },
      },
    });
    
    if (!vendor) {
      throw new BadRequestException('Invalid or expired verification token');
    }
    
    await this.prismaService.vendors.update({
      where: { id: vendor.id },
      data: {
        isApproved: true,
        resetToken: null,
        resetTokenExp: null
      },
    });

    const access_token = await this.generateToken(
      vendor.id,
      vendor.email,
      this.configService.get('JWT_EXPIRY_TIME'),
      vendor.role
    );
  
    const { password, ...vendorData } = vendor;

    return { message: 'Your email has been successfully verified!', vendor: vendorData, access_token };    
  }

  async resendVerificationEmail(email: string) {
    const vendor = await this.prismaService.vendors.findUnique({
      where: { email },
    });
  
    if (!vendor) {
      throw new NotFoundException('User not found');
    }
  
    if (vendor.isApproved) {
      throw new BadRequestException('User is already verified');
    }
  
    const newToken = uuidv4();
    const expiryMinutes = parseInt(this.configService.get('VERIFICATION_TOKEN_EXPIRY_TIME') || '10', 10);
    const resetTokenExp = new Date();
    resetTokenExp.setMinutes(resetTokenExp.getMinutes() + expiryMinutes);
  
    await this.prismaService.vendors.update({
      where: { id: vendor.id },
      data: {
        resetToken: newToken,
        resetTokenExp,
      },
    });
  
    const verificationLink = this.configService.get('USER_VERIFY_URL');
  
    await this.emailService.sendEmail(
      vendor.email,
      'Verify your Email',
      getVerifyEmailTemplate(vendor, verificationLink, newToken)
    );
  
    return {
      message: 'Verification email has been resent. Please check your inbox.',
    };
  }  

  async login(loginAdmin: LoginDTO) {
    try {
      const existingVendor = await this.prismaService.vendors.findUnique({
        where: {
          email: loginAdmin.email,
          role: Role.VENDOR
        },
      });

      if (!existingVendor) {
        throw new NotFoundException("No vendor found with this email address.");
      }

      if (!existingVendor.isApproved) {
        if (existingVendor.resetTokenExp && existingVendor.resetTokenExp > new Date()) {
          throw new ForbiddenException(
            'Please verify your email before logging in.'
          );
        } else {
          const verificationToken = uuidv4();
          const verificationTokenExpiry = new Date();
          const expiryMinutes = parseInt(this.configService.get('VERIFICATION_TOKEN_EXPIRY_TIME') || '10', 10);
          verificationTokenExpiry.setMinutes(verificationTokenExpiry.getMinutes() + expiryMinutes);

          await this.prismaService.vendors.update({
            where: { id: existingVendor.id },
            data: {
              resetToken: verificationToken,
              resetTokenExp: verificationTokenExpiry,
            },
          });

          const verificationLink = this.configService.get('VENDOR_VERIFY_URL');
          await this.emailService.sendEmail(
            existingVendor.email,
            'Verify your Email',
            getVerifyEmailTemplate(existingVendor, verificationLink, verificationToken)
          );

          throw new ForbiddenException(
            'Your verification token has expired. A new verification email has been sent. Please verify your email.'
          );
        }
      }

      const statusErrors: Record<vendorStatus, string> = {
        [vendorStatus.PENDING]:
          "Your account is under review. Please check your email for updates.",
        [vendorStatus.REJECT]:
          "Your registration has been declined. Check your email for details or contact support.",
        [vendorStatus.BLOCK]:
          "Your account has been deactivated. Please contact support for assistance. Check your email or contact support.",
        [vendorStatus.APPROVE]: "",
        [vendorStatus.RESUBMIT]: "Your vendor profile requires resubmission. Please check your email for details on the necessary changes.",
      };
      
      const shouldSendStatusEmail = await this.shouldSendStatusNotification(existingVendor);

      if (shouldSendStatusEmail) {
        const emailContent = await this.getVendorStatusEmail(existingVendor);
        if (emailContent) {
          await this.emailService.sendEmail(
            existingVendor.email,
            `Vendor Profile Status: ${existingVendor.status}`,
            emailContent
          );

          await this.prismaService.vendors.update({
            where: { id: existingVendor.id },
            data: { lastStatusNotifyAt: new Date() }
          });
        }
      }

      const isPasswordMatch = await bcrypt.compare(
        loginAdmin.password,
        existingVendor.password
      );

      if (!isPasswordMatch) {
        throw new ForbiddenException("Invalid login credentials. Please check your password and try again.");
      }

      const { password, ...existingVendorData } = existingVendor;
      const token = await this.generateToken(
        existingVendor.id,
        existingVendor.email,
        this.configService.get("JWT_EXPIRY_TIME"),
        existingVendor.role
      );
      return { data: existingVendorData, token: token, message: statusErrors[existingVendor.status] || undefined };
    } catch (error) {
      this.logger.error("Error login ", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  private async shouldSendStatusNotification(vendor: any): Promise<boolean> {
    if (vendor.status === vendorStatus.APPROVE) {
      return false;
    }
  
    const HOURS_24 = 24 * 60 * 60 * 1000;
    const now = new Date();
  
    if (!vendor.lastStatusNotifyAt) {
      return true;
    }
  
    const timeSinceLastNotification = now.getTime() - new Date(vendor.lastStatusNotifyAt).getTime();
  
    if (timeSinceLastNotification >= HOURS_24) {
      return true;
    }
  
    return false;
  }  

  async getVendorStatusEmail(vendor: any) {
    switch (vendor.status) {
      case vendorStatus.PENDING:
        return vendorPendingStatusEmail(vendor.firstName, vendor.lastName);
      case vendorStatus.RESUBMIT:
        return vendorReSubmitStatusEmail(vendor.firstName, vendor.lastName, vendor.reason);
      case vendorStatus.BLOCK:
        return getVendorDeactivateEmailTemplate(vendor, vendor.reason);
      case vendorStatus.REJECT:
        return vendorRejectedStatusEmail(vendor.firstName, vendor.lastName, vendor.reason);
      default:
        return "";
    }
  }

  async getAllVendors(page: number, limit: number, searchTerm: string, approved: boolean, status: string) {
    try {
      const skip = (page - 1) * limit;
      searchTerm = searchTerm?.trim();
      const filters: any = {}
      if (searchTerm) {
        const tokens = searchTerm.trim().split(/\s+/).filter(Boolean);
        const OR: any[] = [
          {
            firstName: {
              contains: searchTerm ?? '',
              mode: "insensitive",
            },
          }, {
            lastName: {
              contains: searchTerm ?? '',
              mode: "insensitive",
            },
          },
          {
            id: {
              contains: searchTerm,
              mode: "insensitive",
            }
          },
          {
            phone: {
              contains: searchTerm,
              mode: "insensitive",
            }
          },
          {
            email: {
              contains: searchTerm,
              mode: "insensitive",
            }
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
      if ((approved === true || approved === false) && approved !== undefined) {
        filters.isApproved = approved || false;
      }
      const validateStatus = [vendorStatus.APPROVE, vendorStatus.BLOCK, vendorStatus.PENDING, vendorStatus.REJECT, vendorStatus.RESUBMIT];
      if (status && validateStatus.includes(status as vendorStatus)) {
        filters.status = status;
      }
      const allVendors = await this.prismaService.vendors.findMany({
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
        include: {
          address: true,
          products: true,
          admin: true,
          ups: true,
        },
      });
      const totalVendors = await this.prismaService.vendors.count({
        where: filters,
      });
      if (!allVendors.length) {
        return {
          data: [],
          currentPage: page,
          totalPages: Math.ceil(totalVendors / limit),
          totalVendors: totalVendors,
        };
      }
      return {
        data: allVendors,
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

  async getSpecificVendor(adminId: string) {
    try {
      const vendor = await this.prismaService.vendors.findUnique({
        where: {
          id: adminId,
        },
        include: {
          address: true,
          products: true,
          ups: true,
          admin: true,
          connectAccount: true,
          commission: true
        }
      });
      if (!vendor) {
        throw new NotFoundException("Vendor not found!");
      }

      return {
        data: vendor,
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

  async updateVendor(
    id: string,
    updateVendorData: UpdateVendorDto,
  ) {
    try {
      const vendorExists = await this.prismaService.vendors.findUnique({
        where: { id },
        include: {
          address: true,
        },
      });
  
      if (!vendorExists) {
        throw new NotFoundException(`A vendor with ID ${id} does not exist.`);
      }
      
      if (updateVendorData.email) {
        const emailExists = await this.prismaService.vendors.findFirst({
          where: {
            email: updateVendorData.email,
            id: { not: id },
          },
        });
  
        if (emailExists) {
          throw new ConflictException(`The email '${updateVendorData.email}' is already in use by another vendor.`);
        }
      }

      const isResubmitting = vendorExists?.status === vendorStatus.RESUBMIT;

      const userDataToUpdate: any = {
        ...updateVendorData,
        ...(isResubmitting && { status: vendorStatus.PENDING }),
      };

      if(isResubmitting){
        const admin = await this.prismaService.admin.findUnique({
          where: { id: vendorExists.adminId, role: Role.ADMIN  }
        })
        const superAdmin = await this.prismaService.superAdmin.findUnique({
          where: { id: vendorExists.adminId }
        })
        if(admin || superAdmin){
          const emailContent = vendorReSubmittedProfileEmailForAdmin(
            vendorExists.firstName,
            vendorExists.lastName,
            vendorExists.id
          );
          await this.emailService.sendEmail(
            admin?.email || superAdmin?.email,
            `Vendor Profile Resubmission: ${vendorExists.firstName} ${vendorExists.lastName}`,
            emailContent
          );
        }
      }
      
      if (updateVendorData.address) {
        userDataToUpdate.address = {
          upsert: {
            where: {
              id: vendorExists.address ? vendorExists.address.id : undefined,
            },
            update: {
              ...updateVendorData.address,
              updatedAt: new Date(),
            },
            create: {
              streetAddress: updateVendorData.address.streetAddress || vendorExists.address.streetAddress,
              city: updateVendorData.address.city || vendorExists.address.city,
              state: updateVendorData.address.state || vendorExists.address.state,
              zipCode: updateVendorData.address.zipCode || vendorExists.address.zipCode,
              country: updateVendorData.address.country ? vendorExists.address.country : "US",
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          },
        };
      }
  
      const updatedVendor = await this.prismaService.vendors.update({
        where: {
          id,
        },
        include: {
          address: true,
        },
        data: userDataToUpdate,
      });
  
      return {
        data: updatedVendor,
        message: isResubmitting
        ? "Your vendor profile has been updated and resubmitted for approval."
        : "Vendor details updated successfully!",
      };
    } catch (error) {
      this.logger.error("Error updating vendor", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }
  

  async forgetPassword(email: string) {
    try {
      const isUserExist = await this.prismaService.vendors.findUnique({
        where: {
          email,
        },
      });
      if (!isUserExist) {
        throw new NotFoundException("No vendor found with this email");
      }
      const { access_token } = await this.generateToken(
        isUserExist.id,
        isUserExist.email,
        this.configService.get("JWT_RESET_PASS_EXPIRY_TIME"),
        isUserExist.role
      );

      const url = `${this.configService.get("HOST_VENDOR_URL")}/changePassword?id=${isUserExist.id}&token=${access_token}`;
      await this.emailService.sendEmail(
        isUserExist.email,
        "Reset Your Password - Dentistry99",
        getForgotPasswordEmailTemplate(isUserExist, url)
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
			const existingVendor = await this.prismaService.vendors.findUnique({
				where: {
					id: vendorId,
				}
			});
			if (!existingVendor) {
				throw new NotFoundException('Vendor not found');
			}

			const hash = await bcrypt.hash(dto.newPassword, 10);
      if(dto.newPassword !== dto.confirmNewPassword){
        throw new BadRequestException('The new password and confirmation password must match.');
      }
			await this.prismaService.vendors.update({
				where: {
					id: existingVendor.id,
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
			const existingVendor = await this.prismaService.vendors.findUnique({
				where: {
					id,
				}
			});

			if (!existingVendor) {
				throw new NotFoundException('Vendor not found');
			}

			const isPasswordMatch = await bcrypt.compare(dto.oldPassword, existingVendor.password);

			if (!isPasswordMatch)
				throw new NotFoundException('Unable to update password: The old password is incorrect');
      if(dto.newPassword !== dto.confirmNewPassword){
        throw new BadRequestException('The new password and confirmation password must match.');
      }
			const hash = await bcrypt.hash(dto.newPassword, 10);

			await this.prismaService.vendors.update({
				where: {
					id: existingVendor.id,
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

  async getVendorDashboardData(vendorId: string, startDate: Date, endDate: Date, timeFrame: string) {
    const vendorExists = await this.prismaService.vendors.findUnique({
      where: { id: vendorId }
    });
    
    if (!vendorExists) {
      throw new NotFoundException('Vendor not found');
    }

    let calculatedStartDate: Date;
    let calculatedEndDate: Date = endOfDay(new Date());

    switch ((timeFrame || 'overall').toLowerCase()) {
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

    const totalRevenueResult = await this.prismaService.orders.findMany({
      where: {
        products: {
          some: {
            variant: {
              product: {
                vendorId,
              },
            },
          },
        },
        createdAt: {
          gte: calculatedStartDate,
          lte: calculatedEndDate,
        },
      },
      select: {
        price: true,
      },
    });
    

    const totalRevenue = totalRevenueResult.reduce((acc, order) => acc + order.price, 0);

    const totalSalesResult = await this.prismaService.orderItems.findMany({
      where: {
        variant: {
          product: {
            vendorId,
          },
        },
        order: {
          createdAt: {
            gte: calculatedStartDate,
            lte: calculatedEndDate,
          },
        },
      },
      select: {
        quantity: true,
      },
    });

    const totalSales = totalSalesResult.reduce((acc, item) => acc + item.quantity, 0);

    const totalOrders = await this.prismaService.orders.count({
      where: {
        products: {
          some: {
            variant: {
              product: {
                vendorId,
              },
            },
          },
        },
        createdAt: {
          gte: calculatedStartDate,
          lte: calculatedEndDate,
        },
      },
    });

    const salesProgress = {
      percentage: totalRevenue ? (totalRevenue / 20000) * 100 : 0,
      target: 20000,
      todayRevenue: totalRevenue || 0,
    };

    const statistics = await this.prismaService.orders.groupBy({
      by: ['createdAt'],
      where: {
        products: {
          some: {
            variant: {
              product: {
                vendorId,
              },
            },
          },
        },
        createdAt: {
          gte: calculatedStartDate,
          lte: calculatedEndDate,
        },
      },
      _sum: {
        price: true,
      },
      _count: {
        _all: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return {
      totalRevenue: totalRevenue || 0,
      totalSales: totalSales || 0,
      totalOrders,
      salesProgress,
      statistics,
    };
  }

  async getVendorDashboard(vendorId: string, year: string) {
    const startOfYear = new Date(`${year}-01-01`);
    const endOfYear = new Date(`${year}-12-31`);
    const ordersAndRevenue = await this.prismaService.orders.groupBy({
      by: ['status'],
      where: {
        products: {
          some: {
            variant: {
              product: {
                vendorId,
              },
            },
          },
        },
        createdAt: {
          gte: new Date(startOfYear),
          lte: new Date(endOfYear),
        },
      },
      _count: {
        status: true, 
      },
      _sum: {
        price: true, 
      },
    });
    
    const orderVolume = await this.prismaService.orders.groupBy({
      by: ['createdAt'],
      where: {
        products: {
          some: {
            variant: {
              product: {
                vendorId,
              },
            },
          },
        },
        createdAt: {
          gte: startOfYear,
          lte: endOfYear,
        },
      },
      _count: {
        id: true,
      },
      _sum: {
        price: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  
    const customerVolume = await this.prismaService.user.groupBy({
      by: ['createdAt'],
      where: {
        orders: {
          some: {
            products: {
              some: {
                variant: {
                  product: {
                    vendorId,
                  },
                },
              },
            },
          },
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  
    return {
      ordersAndRevenue,
      orderVolume,
      customerVolume,
    };
  }
  
  async deactivateVendor(vendorId: string, deactivateVendorDto: DeactivateVendorDto) {
    try {
      const vendor = await this.prismaService.vendors.findUnique({
        where: { id: vendorId },
      });
  
      if (!vendor) {
        throw new NotFoundException('Vendor not found');
      }
      
      if(!deactivateVendorDto.reason){
        throw new BadRequestException('Please provide a reason for deactivation');
      }

      if (vendor.status === deactivateVendorDto.status) {
        throw new BadRequestException('Vendor is already deactivated');
      }

      await this.prismaService.vendors.update({
        where: { id: vendorId },
        data: {
          status: deactivateVendorDto.status,
          reason: deactivateVendorDto.reason,
        },
      });
      
      await this.emailService.sendEmail(
        vendor.email,
        'Account Deactivated',
        getVendorDeactivateEmailTemplate(vendor, deactivateVendorDto.reason)
      );

      return { message: 'Vendor has been deactivated successfully' };
    } catch (error) {
      this.logger.error('Error deactivating vendor:', error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async activateVendor(vendorId: string) {
    try {
      const vendor = await this.prismaService.vendors.findUnique({
        where: { id: vendorId },
      });
  
      if (!vendor) {
        throw new NotFoundException('Vendor not found');
      }
  
      await this.prismaService.vendors.update({
        where: { id: vendorId },
        data: {
          status: vendorStatus.APPROVE,
          reason: null
        },
      });

      await this.emailService.sendEmail(
        vendor.email,
        'Account Deactivated',
        getVendorActivationEmailTemplate(vendor)
      );
  
      return { message: 'Vendor has been reactivated successfully' };
    } catch (error) {
      this.logger.error('Error reactivating vendor:', error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async getVendorTransfers(filters: FilterOptions) {
    const {
      vendorId,
      status,
      search,
      page,
      limit,
    } = filters;

    try {
      const where: any = { vendorId };

      if (status) where.status = status;

      if (search?.trim()) {
        const s = search?.trim();
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (dateRegex.test(s)) {
          const start = new Date(s);
          const end = new Date(s);
          end.setUTCHours(23, 59, 59, 999);

          where.createdAt = {
            gte: start,
            lte: end,
          };
        } else {
          where.orderId = s;
        }
      }

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
