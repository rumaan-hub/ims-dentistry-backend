import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { PrismaService } from "../../prisma/prisma.service";
import { Role } from "../role/role.enum";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(
    config: ConfigService,
    private prismaService: PrismaService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get("JWT_SECRET"),
    });
  }

  async validate(payload) {
    const { role } = payload;

    switch (role) {
      case Role.SUPER_ADMIN: {
        let admin = await this.prismaService.superAdmin.findUnique({
          where: {
            id: payload.id || payload.adminId,
            role: Role.SUPER_ADMIN,
          },
        });
        if (!admin) {
          admin = await this.prismaService.user.findUnique({
            where: {
              id: payload.id || payload.adminId,
              role: Role.SUPER_ADMIN,
            },
          }) as any;
        }
        // Fallback: check ImsUser for IMS-issued SUPER_ADMIN tokens
        if (!admin) {
          const imsUser = await this.prismaService.imsUser.findUnique({
            where: { client_id: payload.id },
          });
          if (imsUser) {
            return {
              id: imsUser.client_id,
              client_id: imsUser.client_id,
              email: imsUser.email,
              role: 'SYSTEM_ADMIN',
              roles: payload.roles || ['SYSTEM_ADMIN'],
              permissions: payload.permissions || [],
              first_name: imsUser.first_name,
              last_name: imsUser.last_name,
              is_system_admin: imsUser.is_system_admin,
            };
          }
        }
        if (!admin)
          throw new UnauthorizedException("Admin does not exist");
        return admin;
      }
      case Role.ADMIN: {
        let admin = await this.prismaService.admin.findUnique({
          where: {
            id: payload.id || payload.adminId,
            role: Role.ADMIN,
          },
        });
        if (!admin) {
          admin = await this.prismaService.user.findUnique({
            where: {
              id: payload.id || payload.adminId,
              role: Role.ADMIN,
            },
          }) as any;
        }
        if (!admin)
          throw new UnauthorizedException("Admin does not exist");
        return admin;
      }
      case Role.VENDOR: {
        const user = await this.prismaService.vendors.findUnique({
          where: {
            id: payload.id || payload.adminId,
            role: Role.VENDOR,
          },
        });
        if (!user) throw new UnauthorizedException("user does not exist");
        return user;
      }
      case Role.USER: {
        const user = await this.prismaService.user.findUnique({
          where: {
            id: payload.id || payload.adminId,
            role: Role.USER,
          },
        });
        if (!user) throw new UnauthorizedException("user does not exist");
        return user;
      }
      case 'SYSTEM_ADMIN':
      case 'IMS_ADMIN':
      case 'ADMIN':
      case 'IMS_STAFF': {
        // IMS tokens use client_id as the id field
        const imsUser = await this.prismaService.imsUser.findUnique({
          where: { client_id: payload.id },
        });
        if (!imsUser) throw new UnauthorizedException("IMS user does not exist");
        return {
          id: imsUser.client_id,
          client_id: imsUser.client_id,
          email: imsUser.email,
          role: payload.role,
          roles: payload.roles || [],
          permissions: payload.permissions || [],
          first_name: imsUser.first_name,
          last_name: imsUser.last_name,
          is_system_admin: imsUser.is_system_admin,
        };
      }
      default: {
        return "DEFAULT";
      }
    }
  }
}
