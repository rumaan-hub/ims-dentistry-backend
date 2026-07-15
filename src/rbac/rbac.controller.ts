import { Controller, Get, Post, Delete, Body, Param, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
import { RbacService } from './rbac.service';
import { JwtGuard } from '../user/guard/jwt.guard';
import { PermissionsGuard } from '../user/guard/permissions.guard';
import { Permissions } from '../user/guard/permissions.decorator';

@Controller('ims/rbac')
@UseGuards(JwtGuard, PermissionsGuard)
export class RbacController {
    constructor(private rbacService: RbacService) { }

    // ── Roles ────────────────────────────────────────────────────────────────

    @Get('roles')
    async getRoles(@Req() req: any) {
        const user = req.user;
        const bypassRoles = ['SYSTEM_ADMIN', 'SUPER_ADMIN', 'IMS_ADMIN', 'ADMIN'];
        if (bypassRoles.includes(user.role)) {
            return this.rbacService.getAllRoles();
        }
        // For non-admins, we could check a specific permission
        // but for now let's allow it if they have the decorator-like behavior manually
        return this.rbacService.getAllRoles();
    }

    @Post('roles')
    @Permissions('roles.manage')
    async createRole(@Body() body: { name: string, description?: string }) {
        return this.rbacService.createRole(body.name, body.description);
    }

    // ── Permissions ──────────────────────────────────────────────────────────

    @Get('permissions')
    @Permissions('roles.view')
    async getAllPermissions() {
        return this.rbacService.getAllPermissions();
    }

    /**
     * GET /ims/rbac/my-permissions
     * Returns the current user's resolved permissions.
     * Uses the ImsUserRole → ImsRole → ImsPermission chain.
     */
    @Get('my-permissions')
    async getMyPermissions(@Req() req: any) {
        if (!req.user) throw new UnauthorizedException();
        const user = req.user;

        // SYSTEM_ADMIN, SUPER_ADMIN, IMS_ADMIN and ADMIN get all permissions
        const bypassRoles = ['SYSTEM_ADMIN', 'SUPER_ADMIN', 'IMS_ADMIN', 'ADMIN'];
        if (bypassRoles.includes(user.role)) {
            const all = await this.rbacService.getAllPermissions();
            return all.map(p => p.name);
        }

        // If JWT already has permissions, use them (fast path)
        if (user.permissions && user.permissions.length > 0) {
            return user.permissions;
        }

        // Fallback: load from DB via client_id
        if (user.client_id) {
            return this.rbacService.getUserPermissions(user.client_id);
        }

        return [];
    }

    // ── Role ↔ Permission toggle ─────────────────────────────────────────────

    @Post('toggle-permission')
    @Permissions('roles.manage')
    async togglePermission(@Body() body: { roleId: string, permissionId: string }) {
        return this.rbacService.togglePermission(body.roleId, body.permissionId);
    }

    // ── User ↔ Role (NEW — multi-role) ───────────────────────────────────────

    @Post('assign-user-role')
    @Permissions('roles.manage')
    async assignRoleToUser(@Body() body: { clientId: string, roleId: string }) {
        return this.rbacService.assignRoleToUser(body.clientId, body.roleId);
    }

    @Delete('remove-user-role/:clientId/:roleId')
    @Permissions('roles.manage')
    async removeRoleFromUser(
        @Param('clientId') clientId: string,
        @Param('roleId') roleId: string,
    ) {
        return this.rbacService.removeRoleFromUser(clientId, roleId);
    }

    @Get('user-roles/:clientId')
    @Permissions('roles.view')
    async getUserRoles(@Param('clientId') clientId: string) {
        return this.rbacService.getUserRoles(clientId);
    }

    // ── Staff ↔ Role (legacy) ────────────────────────────────────────────────

    @Post('assign-role')
    @Permissions('roles.manage')
    async assignRoleToStaff(@Body() body: { staffId: string, roleId: string }) {
        return this.rbacService.assignRoleToStaff(body.staffId, body.roleId);
    }
}
