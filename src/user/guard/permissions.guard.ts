import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { PERMISSIONS_KEY } from './permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private prisma: PrismaService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredPermissions || requiredPermissions.length === 0) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        // Bypass for system admins (from JWT is_system_admin flag)
        if (user?.is_system_admin) {
            return true;
        }

        // Bypass for Full Access Admin / SYSTEM_ADMIN / SUPER_ADMIN / ADMIN roles (from JWT roles array)
        const userRoles: string[] = user?.roles || [];
        const bypassRoleNames = ['Full Access Admin', 'SYSTEM_ADMIN', 'SUPER_ADMIN', 'ADMIN'];
        if (userRoles.some((r: string) => bypassRoleNames.includes(r))) {
            return true;
        }

        if (!user) {
            throw new UnauthorizedException('User not found in request');
        }

        // ──────────────────────────────────────────────────────────────
        // 1. SYSTEM_ADMIN / SUPER_ADMIN / IMS_ADMIN / ADMIN bypass — full access
        // ──────────────────────────────────────────────────────────────
        const bypassRoles = ['SYSTEM_ADMIN', 'SUPER_ADMIN', 'IMS_ADMIN', 'ADMIN'];
        if (bypassRoles.includes(user.role)) {
            return true;
        }

        // ──────────────────────────────────────────────────────────────
        // 2. If JWT already has permissions[] (from IMS auth), use them
        //    This is the fast path — no extra DB queries.
        // ──────────────────────────────────────────────────────────────
        if (user.permissions && Array.isArray(user.permissions) && user.permissions.length > 0) {
            const hasPermission = requiredPermissions.every((p: string) =>
                user.permissions.includes(p),
            );
            if (!hasPermission) {
                throw new ForbiddenException('You do not have the required permissions to perform this action');
            }
            return true;
        }

        // ──────────────────────────────────────────────────────────────
        // 3. Fallback: Load permissions from DB via ImsUserRole chain
        //    ImsUser → ImsUserRole → ImsRole → ImsRolePermission → ImsPermission
        // ──────────────────────────────────────────────────────────────
        let permissions: string[] = [];

        // Path A: IMS token with client_id → query ImsUserRole directly
        if (user.client_id) {
            const userRoles = await this.prisma.imsUserRole.findMany({
                where: { client_id: user.client_id },
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

            permissions = userRoles.flatMap(ur =>
                ur.role.permissions.map(rp => rp.permission.name)
            );
        }

        // Path B: Legacy — find Staff by email, then ImsStaffRole chain
        if (permissions.length === 0 && user.email) {
            const staff = await this.prisma.staff.findFirst({
                where: { email: user.email },
            });

            if (staff) {
                const staffRoles = await this.prisma.imsStaffRole.findMany({
                    where: { staff_id: staff.staff_id },
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

                permissions = staffRoles.flatMap(sr =>
                    sr.role.permissions.map(rp => rp.permission.name)
                );
            }

            // Path C: Also check ImsUserRole by email (find ImsUser first)
            if (permissions.length === 0) {
                const imsUser = await this.prisma.imsUser.findUnique({
                    where: { email: user.email },
                });
                if (imsUser) {
                    const userRoles = await this.prisma.imsUserRole.findMany({
                        where: { client_id: imsUser.client_id },
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

                    permissions = userRoles.flatMap(ur =>
                        ur.role.permissions.map(rp => rp.permission.name)
                    );
                }
            }
        }

        if (permissions.length === 0) {
            throw new ForbiddenException('No permissions found for this user account');
        }

        const hasPermission = requiredPermissions.every((p: string) =>
            permissions.includes(p),
        );

        if (!hasPermission) {
            throw new ForbiddenException('You do not have the required permissions to perform this action');
        }

        return true;
    }
}
