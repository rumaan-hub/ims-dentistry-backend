import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    UnauthorizedException,
    ConflictException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { MailerService } from '../mailer/mailer.service';
import { ImsNotificationService } from '../ims-notification/ims-notification.service';
import { getForgotPasswordEmailTemplate } from '../utils/email-templates';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class ImsAuthService {
    private readonly logger = new Logger(ImsAuthService.name);

    constructor(
        private prisma: PrismaService,
        private jwt: JwtService,
        private config: ConfigService,
        private mailer: MailerService,
        private notificationService: ImsNotificationService,
    ) { }

    /**
     * IMS-specific login — authenticates against ImsUser table ONLY.
     * Loads roles and permissions from the RBAC chain:
     *   ImsUser → ImsUserRole → ImsRole → ImsRolePermission → ImsPermission
     */
    async login(email: string, password: string, req?: any) {
        const normalizedEmail = email.toLowerCase().trim();

        // Fetch user + full RBAC chain
        const imsUser = await this.prisma.imsUser.findUnique({
            where: { email: normalizedEmail },
            include: {
                userRoles: {
                    include: {
                        role: {
                            include: {
                                permissions: {
                                    include: { permission: true }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!imsUser) {
            throw new NotFoundException('No IMS user found with this email');
        }

        if (imsUser.is_deleted) {
            throw new UnauthorizedException(
                'This account has been deleted. Contact administrator.',
            );
        }

        if (!imsUser.password) {
            throw new ForbiddenException(
                'This account has not been set up for IMS login. Please contact your administrator.',
            );
        }

        const isPasswordMatch = await bcrypt.compare(password, imsUser.password);
        if (!isPasswordMatch) {
            throw new ForbiddenException('Incorrect Credentials');
        }

        // Block login for deactivated clients (system admins always pass)
        if (!imsUser.is_system_admin) {
            const anySub = await this.prisma.clientSubscription.findFirst({
                where: { client_id: imsUser.client_id },
            });
            if (anySub) {
                const activeSub = await this.prisma.clientSubscription.findFirst({
                    where: { client_id: imsUser.client_id, active: true },
                });
                if (!activeSub) {
                    throw new UnauthorizedException(
                        'Your account has been deactivated. Contact administrator.',
                    );
                }
            }
        }

        // Extract roles and permissions from RBAC chain
        const roles = imsUser.userRoles.map(ur => ur.role.role_name);
        const permissions = [
            ...new Set(
                imsUser.userRoles.flatMap(ur =>
                    ur.role.permissions.map(rp => rp.permission.name)
                )
            )
        ];

        // Determine the primary display role for JWT
        let primaryRole = 'IMS_STAFF';
        if (imsUser.is_system_admin || roles.includes('SYSTEM_ADMIN') || roles.includes('SUPER_ADMIN')) {
            primaryRole = 'SYSTEM_ADMIN';
        } else if (roles.includes('ADMIN')) {
            primaryRole = 'IMS_ADMIN';
        }

        const token = await this.generateToken(
            imsUser.client_id,
            imsUser.email,
            primaryRole,
            roles,
            permissions,
            imsUser.is_system_admin,
        );

        // Save login history
        try {
            const ip = req?.ip || req?.headers?.['x-forwarded-for'] || null;
            const ua = req?.headers?.['user-agent'] || null;
            await this.prisma.imsLoginHistory.create({
                data: {
                    client_id: imsUser.client_id,
                    ip_address: typeof ip === 'string' ? ip.substring(0, 200) : null,
                    browser: typeof ua === 'string' ? ua.substring(0, 200) : null,
                    device: 'Web',
                },
            });
        } catch (e) {
            this.logger.warn('Failed to save login history', e);
        }

        // Return user data (without password) + token
        const { password: _, userRoles: __, ...userData } = imsUser;
        return {
            data: {
                ...userData,
                role: primaryRole,
                roles,
                permissions,
            },
            token,
        };
    }

    /**
     * Returns the IMS user for the currently logged in session.
     * Includes roles and permissions.
     */
    async getMe(reqUser: any) {
        if (!reqUser || (!reqUser.client_id && !reqUser.email)) {
            throw new UnauthorizedException('Invalid token');
        }
        const whereClause = reqUser.client_id
            ? { client_id: reqUser.client_id }
            : { email: reqUser.email };

        const imsUser = await this.prisma.imsUser.findUnique({
            where: whereClause,
            include: {
                userRoles: {
                    include: {
                        role: {
                            include: {
                                permissions: {
                                    include: { permission: true }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!imsUser) throw new NotFoundException('IMS User not found');

        const roles = imsUser.userRoles.map(ur => ur.role.role_name);
        const permissions = [
            ...new Set(
                imsUser.userRoles.flatMap(ur =>
                    ur.role.permissions.map(rp => rp.permission.name)
                )
            )
        ];

        const { password: _, userRoles: __, ...userData } = imsUser;
        return {
            data: {
                ...userData,
                roles,
                permissions,
            },
        };
    }

    /**
     * Get permissions for a specific user by client_id.
     * Used by the PermissionsGuard.
     */
    async getUserPermissions(clientId: string): Promise<string[]> {
        const userRoles = await this.prisma.imsUserRole.findMany({
            where: { client_id: clientId },
            include: {
                role: {
                    include: {
                        permissions: {
                            include: { permission: true }
                        }
                    }
                }
            }
        });

        return [
            ...new Set(
                userRoles.flatMap(ur =>
                    ur.role.permissions.map(rp => rp.permission.name)
                )
            )
        ];
    }

    /**
     * Get roles for a specific user by client_id.
     */
    async getUserRoles(clientId: string): Promise<string[]> {
        const userRoles = await this.prisma.imsUserRole.findMany({
            where: { client_id: clientId },
            include: { role: true }
        });
        return userRoles.map(ur => ur.role.role_name);
    }

    /**
     * Public registration — creates an ImsUser without a password.
     * Password is set later during account activation by the system admin.
     */
    async register(dto: {
        email: string;
        first_name: string;
        last_name: string;
        company_name?: string;
        contact_number?: string;
        permanent_address?: string;
        city?: string;
        state?: string;
        zip_code?: string;
    }) {
        const normalizedEmail = dto.email.toLowerCase().trim();

        const existing = await this.prisma.imsUser.findUnique({
            where: { email: normalizedEmail },
        });

        if (existing && !existing.is_deleted) {
            throw new ConflictException('This email is already registered.');
        }

        // Deleted user → save restore request
        if (existing && existing.is_deleted) {
            await this.prisma.imsUser.update({
                where: { client_id: existing.client_id },
                data: {
                    restore_requested: true,
                    restore_requested_at: new Date(),
                    restore_request_data: {
                        first_name: dto.first_name,
                        last_name: dto.last_name,
                        company_name: dto.company_name || existing.company_name,
                        contact_number: dto.contact_number || null,
                        permanent_address: dto.permanent_address || null,
                        city: dto.city || null,
                        state: dto.state || null,
                        zip_code: dto.zip_code || null,
                    },
                },
            });
            await this.notificationService.create(
                'Restore Request',
                `${dto.first_name} ${dto.last_name} requested account restore`,
                'RESTORE_REQUEST',
                '/system-admin/users',
            );
            return { message: 'Restore request sent. Admin will review your request.' };
        }

        const user = await this.prisma.imsUser.create({
            data: {
                email: normalizedEmail,
                first_name: dto.first_name,
                last_name: dto.last_name,
                company_name: dto.company_name || '',
                contact_number: dto.contact_number || null,
                permanent_address: dto.permanent_address || null,
                city: dto.city || null,
                state: dto.state || null,
                zip_code: dto.zip_code || null,
                agree_to_terms: true,
            },
        });

        // Find Full Access Admin role (global)
        const fullAccessRole = await this.prisma.imsRole.findFirst({
            where: {
                role_name: 'Full Access Admin',
                is_global: true,
            },
        });

        if (fullAccessRole) {
            await this.prisma.imsUserRole.create({
                data: {
                    client_id: user.client_id,
                    role_id: fullAccessRole.role_id,
                },
            });
        }

        return { client_id: user.client_id };
    }

    /**
     * Returns the last 10 login history records for a client.
     */
    async getLoginHistory(clientId: string) {
        return this.prisma.imsLoginHistory.findMany({
            where: { client_id: clientId },
            orderBy: { created_at: 'desc' },
            take: 10,
            select: {
                id: true,
                ip_address: true,
                browser: true,
                device: true,
                created_at: true,
            },
        });
    }

    /**
     * Forgot password — generates a reset token and emails it.
     */
    async forgotPassword(email: string) {
        const normalizedEmail = email.toLowerCase().trim();
        const user = await this.prisma.imsUser.findUnique({
            where: { email: normalizedEmail },
        });
        if (!user) {
            // Don't reveal whether the email exists
            return { message: 'If the email exists, a reset link has been sent.' };
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await this.prisma.imsUser.update({
            where: { client_id: user.client_id },
            data: { reset_token: token, reset_token_expiry: expiry },
        });

        const dashboardUrl = this.config.get('IMS_DASHBOARD_URL');
        const resetUrl = `${dashboardUrl}/reset-password?token=${token}`;
        const html = getForgotPasswordEmailTemplate(
            { firstName: user.first_name, lastName: user.last_name },
            resetUrl,
        );

        try {
            await this.mailer.sendEmail(user.email, 'Password Reset — Dentistry99', html);
        } catch (e) {
            this.logger.error('Failed to send reset email', e);
        }

        return { message: 'If the email exists, a reset link has been sent.' };
    }

    /**
     * Reset password — verifies token and updates password.
     */
    async resetPassword(token: string, newPassword: string) {
        const user = await this.prisma.imsUser.findFirst({
            where: { reset_token: token },
        });

        if (!user || !user.reset_token_expiry || user.reset_token_expiry < new Date()) {
            throw new BadRequestException('Invalid or expired reset token.');
        }

        const hashed = await bcrypt.hash(newPassword, 10);
        await this.prisma.imsUser.update({
            where: { client_id: user.client_id },
            data: {
                password: hashed,
                reset_token: null,
                reset_token_expiry: null,
            },
        });

        return { message: 'Password reset successfully.' };
    }

    /**
     * Change password — requires current password verification.
     */
    async changePassword(clientId: string, currentPassword: string, newPassword: string) {
        const user = await this.prisma.imsUser.findUnique({
            where: { client_id: clientId },
        });
        if (!user || !user.password) {
            throw new NotFoundException('User not found');
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            throw new ForbiddenException('Current password is incorrect');
        }

        const hashed = await bcrypt.hash(newPassword, 10);
        await this.prisma.imsUser.update({
            where: { client_id: clientId },
            data: { password: hashed },
        });

        return { message: 'Password changed successfully.' };
    }

    private async generateToken(
        id: string,
        email: string,
        role: string,
        roles: string[],
        permissions: string[],
        is_system_admin: boolean,
    ) {
        const payload = { id, client_id: id, email, role, roles, permissions, is_system_admin };
        const secret = this.config.get('JWT_SECRET');
        const expiresIn = this.config.get('JWT_EXPIRY_TIME');

        const access_token = await this.jwt.signAsync(payload, {
            expiresIn,
            secret,
        });

        return { access_token };
    }
}
