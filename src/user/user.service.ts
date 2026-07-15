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
import { CreateUserDto } from "./dto/create-user.dto";
import {
  exceptionHandler,
  handlePrismaError,
} from "src/utils/error-handler.util";
import { Role } from "./role/role.enum";
import { LoginDTO } from "./dto/login-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { RequestUser } from "./interface/user.interface";
import { BussinessType, HealthCareBusinessType, User } from "@prisma/client";
import { MailerService } from "src/mailer/mailer.service";
import { ResetPasswordDto } from "./dto/resetPassword.dto";
import { UpdatePasswordDto } from "./dto/updatePasswordDto.dto copy";
import { StripeService } from "src/payment/payment.service";
import { getForgotPasswordEmailTemplate, getVerifyEmailTemplate } from "src/utils/email-templates";
import { v4 as uuidv4 } from 'uuid';
import { UserFilter } from "./dto/filter.option.dto";
import { OAuth2Client } from "google-auth-library";

@Injectable()
export class UserService {
  private readonly logger: Logger = new Logger(UserService.name);
  private readonly googleClient: OAuth2Client = new OAuth2Client();

  constructor(
    private prismaService: PrismaService,
    private configService: ConfigService,
    private emailService: MailerService,
    private stripeService: StripeService,
    private jwt: JwtService
  ) { }

  async signupForClient(createClientDto: CreateUserDto) {
    try {
      const { email, role, address, ...data } = createClientDto;
      const existingUser = await this.prismaService.user.findUnique({
        where: {
          email: email.toLowerCase(),
          role,
        },
      });

      if (existingUser) {
        throw new BadRequestException("This user has already been registered");
      }

      const hash = await bcrypt.hash(data.password, 10);

      if (data.businessType === BussinessType.HEALTH_CARE) {
        if (!data.healthCareBusinessType) {
          throw new NotFoundException("healthCareBusinessType is required!");
        }

        const commonFields = [
          {
            field: "officeContactFirstName",
            message: "officeContactFirstName is required!",
          },
          {
            field: "officeContactLastName",
            message: "officeContactLastName is required!",
          },
          { field: "contactJobTitle", message: "contactJobTitle is required!" },
        ];

        const validateFields = (fields) => {
          fields.forEach(({ field, message }) => {
            if (field === "dentalOfficeSpeciality") {
              if (!data[field].length) {
                throw new NotFoundException(
                  "Speciality Array cannot be empty!"
                );
              }
            }
            if (!data[field]) {
              throw new NotFoundException(message);
            }
          });
        };

        switch (data.healthCareBusinessType) {
          case HealthCareBusinessType.DENTAL_PRACTICE:
            const dentalPracticeFields = [
              {
                field: "dentalOfficeSpeciality",
                message: "dentalOfficeSpeciality is required!",
              },
              { field: "noOfLocations", message: "noOfLocations is required!" },
              {
                field: "doctorFirstName",
                message: "doctorFirstName is required!",
              },
              {
                field: "doctorLastName",
                message: "doctorLastName is required!",
              },
              {
                field: "officePhoneNo",
                message: "officePhoneNo is required!",
              },
              ...commonFields,
            ];
            validateFields(dentalPracticeFields);
            break;

          case HealthCareBusinessType.DENTAL_SERVICE:
          case HealthCareBusinessType.EDUCATIONAL_OR_GOVERNMENT_DENTAL_FACILITY:
            const dentalServiceFields = [
              {
                field: "managerFirstName",
                message: "managerFirstName is required!",
              },
              {
                field: "managerLastName",
                message: "managerLastName is required!",
              },
              ...commonFields,
            ];
            validateFields(dentalServiceFields);
            break;

          case HealthCareBusinessType.OTHERS:
            validateFields(commonFields);
            break;

          default:
            throw new ConflictException("Invalid Health Care Business Type");
        }
      }

      // const resolvedBusinessType = createClientDto.businessType;
      const resolvedBusinessType =
        createClientDto.businessType ?? BussinessType.NON_HEALTH_CARE;
      // const resolvedHealthCareBusinessType = createClientDto?.healthCareBusinessType;
      const resolvedHealthCareBusinessType =
        resolvedBusinessType === BussinessType.HEALTH_CARE
          ? createClientDto?.healthCareBusinessType
          : null;

      // const customer = await this.stripeService.createCustomer(
      //   createClientDto.email,
      //   `${createClientDto.firstName} ${createClientDto.lastName}`
      // );
      const customer = await this.stripeService.createCustomer(
        createClientDto.email,
        `${createClientDto.firstName ?? ""} ${createClientDto.lastName ?? ""}`.trim() || createClientDto.email
      );

      if (!customer) {
        throw new ConflictException("Error creating customer of stripe");
      }

      const verificationToken = uuidv4();
      const verificationTokenExpiry = new Date();
      const expiryMinutes = parseInt(this.configService.get('VERIFICATION_TOKEN_EXPIRY_TIME') || '10', 10);
      verificationTokenExpiry.setMinutes(verificationTokenExpiry.getMinutes() + expiryMinutes);

      try {
        const newUser = await this.prismaService.user.create({
          data: {
            ...data,
            email,
            password: hash,
            noOfLocations: createClientDto.noOfLocations,
            firstName: createClientDto.firstName ?? "",
            lastName: createClientDto.lastName ?? "",
            isVerfied: false,
            isSubscribed: createClientDto.isSubscribed ?? false,
            // Legacy behavior preserved above; this relaxed default keeps minimal signup working.
            // businessType: createClientDto.businessType,
            businessType: resolvedBusinessType,
            // healthCareBusinessType: createClientDto?.healthCareBusinessType,
            healthCareBusinessType: resolvedHealthCareBusinessType,
            dentalOfficeSpeciality: createClientDto.dentalOfficeSpeciality,
            doctorFirstName: createClientDto.doctorFirstName,
            doctorLastName: createClientDto.doctorLastName,
            officeContactFirstName: createClientDto.officeContactFirstName,
            officeContactLastName: createClientDto.officeContactLastName,
            contactJobTitle: createClientDto.contactJobTitle,
            managerFirstName: createClientDto.managerFirstName,
            managerLastName: createClientDto.managerLastName,
            stripeCustomerId: customer.id ?? "",
            officePhoneNo: createClientDto.officePhoneNo ?? "",
            resetToken: verificationToken,
            resetTokenExp: verificationTokenExpiry,
            cart: {
              create: {},
            },
            wishlist: {
              create: {},
            },
          },
        });
        const { password, ...userData } = newUser;

        const verificationLink = this.configService.get("USER_VERIFY_URL");
        let verificationEmailSent = true;
        const isLocalEnv =
          (this.configService.get('Environment') || '').toLowerCase() === 'local' ||
          (process.env.NODE_ENV || '').toLowerCase() !== 'production';
        let localVerificationLink: string | null = null;

        // await this.emailService.sendEmail(
        //   email,
        //   'Verify your Email',
        //   getVerifyEmailTemplate(newUser, verificationLink, verificationToken)
        // );
        try {
          await this.emailService.sendEmail(
            email,
            'Verify your Email',
            getVerifyEmailTemplate(newUser, verificationLink, verificationToken)
          );
        } catch (mailError) {
          verificationEmailSent = false;
          if (isLocalEnv) {
            localVerificationLink = `${verificationLink}?token=${verificationToken}`;
          }
          this.logger.warn(
            `Account created but verification email failed for ${email}: ${mailError?.message || mailError}`
          );
        }

        return {
          data: userData,
          verificationLink: localVerificationLink,
          message: verificationEmailSent
            ? "Account has been created successfully! Please check your email to verify your account."
            : "Account has been created successfully! Verification email could not be sent right now. Please use resend verification.",
        };
      } catch (error) {
        throw exceptionHandler(error);
      }
    } catch (error) {
      this.logger.error("Error registering client", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async verifyUserEmail(token: string) {
    const user = await this.prismaService.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExp: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.prismaService.user.update({
      where: { id: user.id },
      data: {
        isVerfied: true,
        resetToken: null,
        resetTokenExp: null
      },
    });

    const access_token = await this.generateToken(
      user.id,
      user.email,
      this.configService.get('JWT_EXPIRY_TIME'),
      user.role
    );

    const { password, ...userData } = user;
    return { message: 'Your email has been successfully verified!', user: userData, access_token };
  }

  async resendVerificationEmail(email: string) {
    const user = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isVerfied) {
      throw new BadRequestException('User is already verified');
    }

    const newToken = uuidv4();
    const expiryMinutes = parseInt(this.configService.get('VERIFICATION_TOKEN_EXPIRY_TIME') || '10', 10);
    const resetTokenExp = new Date();
    resetTokenExp.setMinutes(resetTokenExp.getMinutes() + expiryMinutes);

    await this.prismaService.user.update({
      where: { id: user.id },
      data: {
        resetToken: newToken,
        resetTokenExp,
      },
    });

    const verificationLink = this.configService.get('USER_VERIFY_URL');

      let verificationEmailSent = true;
        const isLocalEnv =
          (this.configService.get('Environment') || '').toLowerCase() === 'local' ||
          (process.env.NODE_ENV || '').toLowerCase() !== 'production';
        let localVerificationLink: string | null = null;

      // await this.emailService.sendEmail(
      //   user.email,
      //   'Verify your Email',
      //   getVerifyEmailTemplate(user, verificationLink, newToken)
      // );
      try {
        await this.emailService.sendEmail(
          user.email,
          'Verify your Email',
          getVerifyEmailTemplate(user, verificationLink, newToken)
        );
      } catch (mailError) {
        verificationEmailSent = false;
        if (isLocalEnv) {
          localVerificationLink = `${verificationLink}?token=${newToken}`;
        }
        this.logger.warn(
          `Resend verification email failed for ${user.email}: ${mailError?.message || mailError}`
        );
      }

    return {
        verificationLink: localVerificationLink,
        message: verificationEmailSent
          ? 'Verification email has been resent. Please check your inbox.'
          : 'Verification email could not be sent right now. Please try again shortly.',
    };
  }


  async login(loginAdmin: LoginDTO) {
    try {
      const existingAdmin = await this.prismaService.user.findUnique({
        where: {
          email: loginAdmin.email,
          role: loginAdmin.role || Role.USER,
        },
        include: {
          address: true,
          license: true,
        },
      });

      if (!existingAdmin) {
        throw new NotFoundException("No User Found!");
      }

      if (!existingAdmin.isVerfied) {
        if (existingAdmin.resetTokenExp && existingAdmin.resetTokenExp > new Date()) {
          throw new ForbiddenException(
            'Please verify your email before logging in.'
          );
        } else {
          const verificationToken = uuidv4();
          const verificationTokenExpiry = new Date();
          const expiryMinutes = parseInt(this.configService.get('VERIFICATION_TOKEN_EXPIRY_TIME') || '10', 10);
          verificationTokenExpiry.setMinutes(verificationTokenExpiry.getMinutes() + expiryMinutes);

          await this.prismaService.user.update({
            where: { id: existingAdmin.id },
            data: {
              resetToken: verificationToken,
              resetTokenExp: verificationTokenExpiry,
            },
          });

          const verificationLink = this.configService.get('USER_VERIFY_URL');
          let verificationEmailSent = true;

          // await this.emailService.sendEmail(
          //   existingAdmin.email,
          //   'Verify your Email',
          //   getVerifyEmailTemplate(existingAdmin, verificationLink, verificationToken)
          // );
          try {
            await this.emailService.sendEmail(
              existingAdmin.email,
              'Verify your Email',
              getVerifyEmailTemplate(existingAdmin, verificationLink, verificationToken)
            );
          } catch (mailError) {
            verificationEmailSent = false;
            this.logger.warn(
              `Token refresh email failed for ${existingAdmin.email}: ${mailError?.message || mailError}`
            );
          }

          // throw new ForbiddenException(
          //   'Your verification token has expired. A new verification email has been sent. Please verify your email.'
          // );
          throw new ForbiddenException(
            verificationEmailSent
              ? 'Your verification token has expired. A new verification email has been sent. Please verify your email.'
              : 'Please verify your email before logging in. Verification email could not be sent right now. Please use resend verification later.'
          );
        }
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

  async googleAuthForClient(idToken: string) {
    try {
      if (!idToken) {
        throw new BadRequestException("Google credential is required.");
      }

      const googleClientId = this.configService.get<string>("GOOGLE_CLIENT_ID");
      if (!googleClientId) {
        throw new ConflictException("Google authentication is not configured on server.");
      }

      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: googleClientId,
      });

      const payload = ticket.getPayload();
      if (!payload?.email) {
        throw new BadRequestException("Unable to read Google account email.");
      }

      if (payload.email_verified === false) {
        throw new ForbiddenException("Google account email is not verified.");
      }

      const email = payload.email.toLowerCase();
      let existingUser = await this.prismaService.user.findUnique({
        where: { email },
        include: {
          address: true,
          license: true,
        },
      });

      if (!existingUser) {
        const firstName = payload.given_name || payload.name?.split(" ")[0] || "";
        const lastName = payload.family_name || payload.name?.split(" ").slice(1).join(" ") || "";

        const customer = await this.stripeService.createCustomer(
          email,
          `${firstName} ${lastName}`.trim() || email
        );

        if (!customer) {
          throw new ConflictException("Error creating customer of stripe");
        }

        const randomPassword = await bcrypt.hash(`${uuidv4()}-${Date.now()}`, 10);

        existingUser = await this.prismaService.user.create({
          data: {
            email,
            password: randomPassword,
            role: Role.USER,
            businessType: BussinessType.NON_HEALTH_CARE,
            isVerfied: true,
            firstName,
            lastName,
            profile: payload.picture || "",
            isSubscribed: false,
            stripeCustomerId: customer.id ?? "",
            cart: {
              create: {},
            },
            wishlist: {
              create: {},
            },
          },
          include: {
            address: true,
            license: true,
          },
        });
      } else {
        const updateData: any = {};

        if (!existingUser.isVerfied) {
          updateData.isVerfied = true;
          updateData.resetToken = null;
          updateData.resetTokenExp = null;
        }

        if (!existingUser.firstName && payload.given_name) {
          updateData.firstName = payload.given_name;
        }

        if (!existingUser.lastName && payload.family_name) {
          updateData.lastName = payload.family_name;
        }

        if (!existingUser.profile && payload.picture) {
          updateData.profile = payload.picture;
        }

        if (!existingUser.stripeCustomerId) {
          const customer = await this.stripeService.createCustomer(
            existingUser.email,
            `${existingUser.firstName || payload.given_name || ""} ${existingUser.lastName || payload.family_name || ""}`.trim() || existingUser.email
          );

          if (customer?.id) {
            updateData.stripeCustomerId = customer.id;
          }
        }

        if (Object.keys(updateData).length > 0) {
          existingUser = await this.prismaService.user.update({
            where: { id: existingUser.id },
            data: updateData,
            include: {
              address: true,
              license: true,
            },
          });
        }
      }

      const { password, ...userData } = existingUser;
      const token = await this.generateToken(
        existingUser.id,
        existingUser.email,
        this.configService.get("JWT_EXPIRY_TIME"),
        existingUser.role
      );

      return {
        data: userData,
        token,
        message: "Logged in with Google successfully.",
      };
    } catch (error) {
      this.logger.error("Error google auth", error);

      if (error?.response) {
        throw exceptionHandler(error);
      }

      if (
        error?.message?.toLowerCase()?.includes("token") ||
        error?.message?.toLowerCase()?.includes("audience") ||
        error?.message?.toLowerCase()?.includes("jwt")
      ) {
        throw new BadRequestException("Invalid Google credential.");
      }

      throw handlePrismaError(error);
    }
  }

  async verifyUser(id: string, isVerfied: boolean) {
    try {
      const updatedUser = await this.prismaService.user.update({
        where: {
          id,
        },
        data: {
          isVerfied,
        },
      });

      if (!updatedUser) {
        throw new NotFoundException("No User Found!");
      }
      return {
        data: updatedUser,
        message: "User has been verfied successfully!",
      };
    } catch (error) {
      this.logger.error("Error verify user", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async deleteUserByAdmin(adminId: string, id: string) {
    try {
      const isAdmin = await this.prismaService.user.findUnique({
        where: {
          id: adminId,
          role: Role.ADMIN,
        },
      });
      if (!isAdmin) {
        throw new ConflictException(
          "This action can only be performed by Admin!"
        );
      }

      const existingUser = await this.prismaService.user.findUnique({
        where: {
          id,
        },
      });
      if (!existingUser) {
        throw new ConflictException("No User Found");
      }
      await this.prismaService.user.delete({
        where: {
          id,
        },
      });
      return { message: "User has been deleted successfully!" };
    } catch (error) {
      this.logger.error("Error deleting user", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async updateUser(
    id: string,
    updateUserData: UpdateUserDto,
    loggedInUser: RequestUser
  ) {
    try {
      if (id !== loggedInUser.id && loggedInUser.role !== Role.USER) {
        throw new NotFoundException("You don't has access to update that user");
      }

      if (updateUserData?.email) {
        const userData = await this.prismaService.user.findUnique({
          where: {
            email: updateUserData.email,
          },
        });
        if (userData && userData.id !== id) {
          throw new ConflictException("This email is already registered!");
        }
      }
      if (updateUserData.businessType === "HEALTH_CARE") {
        updateUserData.firstName = null;
        updateUserData.lastName = null;
      } else if (updateUserData.businessType === "NON_HEALTH_CARE") {
        updateUserData.healthCareBusinessType = null;
        updateUserData.dentalOfficeSpeciality = [];
        updateUserData.doctorFirstName = null;
        updateUserData.doctorLastName = null;
        updateUserData.officeContactFirstName = null;
        updateUserData.officeContactLastName = null;
        updateUserData.contactJobTitle = null;
        updateUserData.managerFirstName = null;
        updateUserData.managerLastName = null;
      }
      const updatedUser = await this.prismaService.user.update({
        where: { id },
        data: updateUserData,
      });
      return {
        data: updatedUser,
        message: "User has been updated successfully!",
      };
    } catch (error) {
      this.logger.error("Error deleting user", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async deleteUser(id: string, loggedInUser: RequestUser) {
    try {
      if (id !== loggedInUser.id) {
        throw new NotFoundException("You don't has access to delete that user");
      }
      await this.prismaService.user.delete({
        where: {
          id,
        },
      });
      return {
        message: "User has been deleted successfully!",
      };
    } catch (error) {
      this.logger.error("Error deleting user", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async getUserByToken(req) {
    try {
      const user = await this.prismaService.user.findUnique({
        where: {
          id: req.user.id,
        },
        include: {
          address: true,
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

  async findUser(userId: string) {
    try {
      const user = await this.prismaService.user.findUnique({
        where: {
          id: userId,
        },
        include: {
          address: true,
          license: true
        },
      });
      if (!user) {
        throw new ConflictException("No User Found");
      }

      let paymentMethod: any = [];
      if (user?.stripeCustomerId) {
        const cards = await this.stripeService.getPaymentMethods(user.stripeCustomerId);
        paymentMethod = cards?.data || [];
      }

      return {
        data: user,
        paymentMethod
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

  async forgetPassword(email: string) {
    try {
      const isUserExist = await this.prismaService.user.findUnique({
        where: {
          email,
        },
      });
      if (!isUserExist) {
        throw new NotFoundException("No user found with this email");
      }
      const { access_token } = await this.generateToken(
        isUserExist.id,
        isUserExist.email,
        this.configService.get("JWT_RESET_PASS_EXPIRY_TIME"),
        isUserExist.role
      );
      const url = `${this.configService.get("HOST_USER_URL")}/change-password?id=${isUserExist.id}&token=${access_token}`;
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
      this.logger.error("Error verifying token:", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async updatePassword(userId: string, dto: UpdatePasswordDto) {
    try {
      const existingUser = await this.prismaService.user.findUnique({
        where: {
          id: userId,
        },
      });

      if (!existingUser) {
        throw new NotFoundException("User not found");
      }
      if (dto.newPassword !== dto.confirmNewPassword) {
        throw new BadRequestException("The new password and confirmation password must match.");
      }
      const hash = await bcrypt.hash(dto.newPassword, 10);

      await this.prismaService.user.update({
        where: {
          id: existingUser.id,
        },
        data: {
          password: hash,
        },
      });

      return { message: "Your password has been successfully updated." };
    } catch (error) {
      this.logger.error("Error updating password:", error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

  async resetPassword(id: string, dto: ResetPasswordDto) {
    try {
      const existingUser = await this.prismaService.user.findUnique({
        where: {
          id,
        },
      });

      if (!existingUser) {
        throw new NotFoundException("User not found");
      }

      const isPasswordMatch = await bcrypt.compare(
        dto.oldPassword,
        existingUser.password
      );

      if (!isPasswordMatch)
        throw new NotFoundException("Unable to update password: The old password is incorrect");
      if (dto.newPassword !== dto.confirmNewPassword) {
        throw new ConflictException("The new password and confirmation password must match.");
      }
      const hash = await bcrypt.hash(dto.newPassword, 10);

      const samePassword = await bcrypt.compare(dto.newPassword, existingUser.password);
      if (samePassword) {
        throw new ConflictException("New password cannot be the same as the old password.");
      }
      if (isPasswordMatch === hash) {
        throw new ConflictException("New password cannot be the same as the old password.");
      }

      await this.prismaService.user.update({
        where: {
          id: existingUser.id,
        },
        data: {
          password: hash,
        },
      });

      return { message: "Your password has been successfully updated." };
    } catch (error) {
      this.logger.error("Error resetting password:", error);
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

  async fetchAllUsers(filters: UserFilter) {
    const { search, page, limit } = filters;
    try {
      const where: any = {};

      if (search?.trim()) {
        const s = search?.trim();
        const tokens = s?.split(/\s+/).filter(Boolean);
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

        if (dateRegex.test(s)) {
          const start = new Date(s);
          const end = new Date(s);
          end.setUTCHours(23, 59, 59, 999);

          where.createdAt = {
            gte: start,
            lte: end,
          };
        } else if (uuidRegex.test(s)) {
          where.id = s;
        } else {
          where.OR = [
            { firstName: { contains: s, mode: 'insensitive' } },
            { lastName: { contains: s, mode: 'insensitive' } },
            { officeContactFirstName: { contains: s, mode: 'insensitive' } },
            { officeContactLastName: { contains: s, mode: 'insensitive' } }
          ];

          if (tokens.length >= 2) {
            const first = tokens[0];
            const last = tokens[tokens.length - 1];

            where.OR.push(
              {
                AND: [
                  { firstName: { contains: first, mode: "insensitive" } },
                  { lastName: { contains: last, mode: "insensitive" } },
                ],
              },
              {
                AND: [
                  { officeContactFirstName: { contains: first, mode: 'insensitive' } },
                  { officeContactLastName: { contains: last, mode: 'insensitive' } }
                ],
              },
              {
                AND: [
                  { firstName: { contains: last, mode: "insensitive" } },
                  { lastName: { contains: first, mode: "insensitive" } },
                ],
              },
              {
                AND: [
                  { officeContactFirstName: { contains: last, mode: 'insensitive' } },
                  { officeContactLastName: { contains: first, mode: 'insensitive' } }
                ],
              }
            );
          }
        }
      }

      const [data, total] = await Promise.all([
        this.prismaService.user.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            license: true,
            address: true
          },
        }),
        this.prismaService.user.count({ where }),
      ]);

      const enrichedUsers = await Promise.all(
        data.map(async (user) => {
          let paymentMethod: any = [];
          if (user.stripeCustomerId) {
            try {
              const cards = await this.stripeService.getPaymentMethods(user?.stripeCustomerId);
              paymentMethod = cards?.data || [];
            } catch (err) {
              this.logger.warn(`Failed to fetch payment methods for user ${user?.id}:`, err.message);
            }
          }
          return {
            ...user,
            paymentMethod,
          };
        })
      );

      return {
        currentPage: page,
        totalPromotions: total,
        totalPages: Math.ceil(total / limit),
        enrichedUsers,
      };
    } catch (error) {
      this.logger.error('Error fetching users data:', error);
      if (error?.response) {
        throw exceptionHandler(error);
      } else {
        throw handlePrismaError(error);
      }
    }
  }

}
