import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RbacService {
    constructor(private prisma: PrismaService) { }

    // ── Roles ────────────────────────────────────────────────────────────────

    async getAllRoles() {
        return this.prisma.imsRole.findMany({
            include: {
                permissions: {
                    include: {
                        permission: true
                    }
                }
            }
        });
    }

    async createRole(name: string, description?: string) {
        return this.prisma.imsRole.create({
            data: {
                role_name: name,
                description,
            }
        });
    }

    // ── Permissions ──────────────────────────────────────────────────────────

    async getAllPermissions() {
        return this.prisma.imsPermission.findMany();
    }

    // ── Role ↔ Permission ────────────────────────────────────────────────────

    async assignPermissionToRole(roleId: string, permissionId: string) {
        return this.prisma.imsRolePermission.create({
            data: {
                role_id: roleId,
                permission_id: permissionId
            }
        });
    }

    async removePermissionFromRole(roleId: string, permissionId: string) {
        return this.prisma.imsRolePermission.delete({
            where: {
                role_id_permission_id: {
                    role_id: roleId,
                    permission_id: permissionId
                }
            }
        });
    }

    async togglePermission(roleId: string, permissionId: string) {
        const existing = await this.prisma.imsRolePermission.findUnique({
            where: {
                role_id_permission_id: {
                    role_id: roleId,
                    permission_id: permissionId
                }
            }
        });

        if (existing) {
            return this.removePermissionFromRole(roleId, permissionId);
        } else {
            return this.assignPermissionToRole(roleId, permissionId);
        }
    }

    // ── User ↔ Role (NEW — multi-role support) ──────────────────────────────

    async assignRoleToUser(clientId: string, roleId: string) {
        return this.prisma.imsUserRole.upsert({
            where: {
                client_id_role_id: {
                    client_id: clientId,
                    role_id: roleId,
                }
            },
            create: {
                client_id: clientId,
                role_id: roleId,
            },
            update: {},
        });
    }

    async removeRoleFromUser(clientId: string, roleId: string) {
        return this.prisma.imsUserRole.delete({
            where: {
                client_id_role_id: {
                    client_id: clientId,
                    role_id: roleId,
                }
            }
        });
    }

    async getUserRoles(clientId: string) {
        return this.prisma.imsUserRole.findMany({
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
    }

    async getUserPermissions(clientId: string): Promise<string[]> {
        const userRoles = await this.getUserRoles(clientId);
        return [
            ...new Set(
                userRoles.flatMap(ur =>
                    ur.role.permissions.map(rp => rp.permission.name)
                )
            )
        ];
    }

    // ── Staff ↔ Role (legacy, kept for backward compat) ─────────────────────

    async assignRoleToStaff(staffId: string, roleId: string) {
        return this.prisma.imsStaffRole.upsert({
            where: {
                staff_id_role_id: {
                    staff_id: staffId,
                    role_id: roleId,
                }
            },
            create: {
                staff_id: staffId,
                role_id: roleId,
            },
            update: {}
        });
    }
}
