import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { SystemActivityService } from '../system-activity/system-activity.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class StaffService {
    constructor(
        private prisma: PrismaService,
        private activityService: SystemActivityService,
    ) { }

    async create(dto: CreateStaffDto) {
        // Verify client exists only if client_id is provided
        if (dto.client_id) {
            const client = await this.prisma.imsUser.findUnique({
                where: { client_id: dto.client_id },
            });
            if (!client) throw new NotFoundException('Client (ImsUser) not found');
        }

        // Verify office exists if provided
        if (dto.officeOffice_id) {
            const office = await this.prisma.office.findUnique({
                where: { office_id: dto.officeOffice_id },
            });
            if (!office) throw new NotFoundException('Office not found');
        }

        // Check for duplicate email (globally)
        const lowEmail = dto.email.toLowerCase().trim();
        const existingStaff = await this.prisma.staff.findUnique({
            where: { email: lowEmail },
        });
        if (existingStaff) {
            throw new ConflictException('Staff with this email already exists');
        }

        // IMPORTANT: Prevent creating staff with an email that is already an ADMIN in imsUser
        const existingAdmin = await this.prisma.imsUser.findUnique({
            where: { email: lowEmail },
            include: { userRoles: { include: { role: true } } }
        });
        
        if (existingAdmin) {
            const adminRoles = existingAdmin.userRoles.map(ur => ur.role.role_name);
            if (adminRoles.includes('SYSTEM_ADMIN') || adminRoles.includes('ADMIN') || adminRoles.includes('IMS_ADMIN')) {
                throw new ConflictException('This email belongs to an Administrator and cannot be used for a Staff account.');
            }
        }

        const { password, ...staffData } = dto;
        staffData.email = lowEmail;

        const result = await this.prisma.$transaction(async (tx) => {
            // 1. Create Staff record
            const staff = await tx.staff.create({
                data: staffData as any,
                include: {
                    office: true,
                },
            });

            // 2. Ensure ImsUser exists for this email WITH password for IMS login
            const lowEmail = dto.email.toLowerCase();
            const passwordToHash = password || 'Staff@123';
            const hashedPassword = await bcrypt.hash(passwordToHash, 10);

            // Check if user exists first to avoid blind upsert/overwrite
            let imsUser = await tx.imsUser.findUnique({
                where: { email: lowEmail }
            });

            if (!imsUser) {
                imsUser = await tx.imsUser.create({
                    data: {
                        email: lowEmail,
                        first_name: dto.first_name,
                        last_name: dto.last_name,
                        company_name: 'Staff - ' + dto.designation,
                        agree_to_terms: true,
                        password: hashedPassword,
                        ims_role: 'STAFF', // Set legacy role field
                    },
                });
            } else {
                console.log(`[StaffSync] ImsUser already exists for ${lowEmail}, skipping password overwrite in create.`);
            }

            // 3. Assign STAFF role via ImsUserRole junction table
            const staffRole = await tx.imsRole.findFirst({
                where: { role_name: 'STAFF' },
            });
            if (staffRole) {
                await tx.imsUserRole.upsert({
                    where: {
                        client_id_role_id: {
                            client_id: imsUser.client_id,
                            role_id: staffRole.role_id,
                        },
                    },
                    create: {
                        client_id: imsUser.client_id,
                        role_id: staffRole.role_id,
                    },
                    update: {},
                });
            }

            // NOTE: We do NOT write to the User table anymore.
            // IMS authentication is handled entirely by ImsUser.

            return staff;
        });

        this.activityService.create({
            action: 'Staff member added',
            user: `${result.first_name} ${result.last_name}`,
            office: result.office?.office_name,
            client_id: result.client_id,
        });

        return result;
    }

    async findAll(user?: any) {
        const where: any = {};
        if (user && !user.is_system_admin && user.client_id) {
            where.client_id = user.client_id;
        }
        return this.prisma.staff.findMany({
            where,
            include: {
                user: true,
                office: true,
            },
            orderBy: {
                created_at: 'desc',
            },
        });
    }

    async findOne(id: string) {
        const staff = await this.prisma.staff.findUnique({
            where: { staff_id: id },
            include: {
                user: true,
                office: true,
            },
        });
        if (!staff) throw new NotFoundException('Staff not found');
        return staff;
    }

    async findByClient(client_id: string) {
        return this.prisma.staff.findMany({
            where: { client_id },
            include: {
                user: true,
                office: true,
            },
            orderBy: {
                created_at: 'desc',
            },
        });
    }

    async update(id: string, dto: UpdateStaffDto) {
        // Verify staff exists
        const staff = await this.prisma.staff.findUnique({
            where: { staff_id: id },
        });
        if (!staff) throw new NotFoundException('Staff not found');

        // Verify office exists if provided
        if (dto.officeOffice_id) {
            const office = await this.prisma.office.findUnique({
                where: { office_id: dto.officeOffice_id },
            });
            if (!office) throw new NotFoundException('Office not found');
        }

        // Check for duplicate email if email is being updated
        if (dto.email && dto.email !== staff.email) {
            const existingStaff = await this.prisma.staff.findFirst({
                where: {
                    client_id: staff.client_id,
                    email: dto.email,
                    staff_id: { not: id },
                },
            });
            if (existingStaff) {
                throw new ConflictException('Staff with this email already exists for this client');
            }
        }

        const { password, ...updateData } = dto;
        
        // 1. Sync login credentials with ImsUser table
        if (password || updateData.email) {
            const currentStaff = await this.prisma.staff.findUnique({ where: { staff_id: id } });
            if (currentStaff) {
                const imsUpdate: any = {};
                if (password) imsUpdate.password = await bcrypt.hash(password, 10);
                
                const normalizedOldEmail = currentStaff.email.toLowerCase().trim();
                const normalizedNewEmail = updateData.email?.toLowerCase().trim();

                if (normalizedNewEmail && normalizedNewEmail !== normalizedOldEmail) {
                    imsUpdate.email = normalizedNewEmail;
                }

                if (Object.keys(imsUpdate).length > 0) {
                    // Sync specifically by email
                    const targetUser = await this.prisma.imsUser.findUnique({
                        where: { email: normalizedOldEmail },
                        include: { userRoles: { include: { role: true } } }
                    });

                    if (targetUser) {
                        // ❌ CRITICAL PROTECTION: Never sync for these specific accounts
                        const PROTECTED_EMAILS = ['admin@dentistry99.com', 'superadmin@dentistry99.com', 'admin@dentistry.com', 'superadmin@dentistry.com'];
                        const isProtectedEmail = PROTECTED_EMAILS.includes(targetUser.email.toLowerCase());
                        
                        const roles = targetUser.userRoles.map(ur => ur.role.role_name);
                        const isPrivileged = roles.some(r => ['SYSTEM_ADMIN', 'ADMIN', 'IMS_ADMIN'].includes(r));
                        const isAnyAdmin = isPrivileged || targetUser.is_system_admin || isProtectedEmail;

                        if (isAnyAdmin) {
                            console.warn(`[StaffSync] SECURITY ALERT: Blocked sync attempt for privileged account: ${targetUser.email}`);
                            // Do NOTHING for these accounts. Just return.
                            return;
                        }

                        // ✅ Safe to sync for regular staff
                        await this.prisma.imsUser.update({
                            where: { client_id: targetUser.client_id },
                            data: imsUpdate
                        });
                        console.log(`[StaffSync] Sync for ${targetUser.email} successful.`);
                    } else {
                        console.warn(`[StaffSync] No ImsUser found for email: ${normalizedOldEmail}`);
                    }
                }
            }
        }

        // 2. Update Staff record
        const result = await this.prisma.staff.update({
            where: { staff_id: id },
            data: updateData,
            include: {
                user: true,
                office: true,
            },
        });

        this.activityService.create({
            action: 'Staff member updated',
            user: `${result.first_name} ${result.last_name}`,
            office: result.office?.office_name,
            client_id: result.client_id,
        });

        return result;
    }

    async remove(id: string) {
        const staff = await this.prisma.staff.findUnique({
            where: { staff_id: id },
            include: { office: true },
        });
        if (!staff) throw new NotFoundException('Staff not found');

        const result = await this.prisma.$transaction([
            this.prisma.inventory.deleteMany({
                where: { staff_id: id },
            }),
            this.prisma.staff.delete({
                where: { staff_id: id },
            }),
        ]);

        this.activityService.create({
            action: 'Staff member removed',
            user: `${staff.first_name} ${staff.last_name}`,
            office: staff.office?.office_name,
            client_id: staff.client_id,
        });

        return result;
        // const result = await this.prisma.$transaction([
        //     this.prisma.inventory.deleteMany({
        //         where: { staff_id: id },
        //     }),
        //     this.prisma.staff.delete({
        //         where: { staff_id: id },
        //     }),
        // ]);

        // this.activityService.create({
        //     action: 'Staff member removed',
        //     user: `${staff.first_name} ${staff.last_name}`,
        //     office: staff.office?.office_name,
        //     client_id: staff.client_id,
        // });

        // return result;
    }
}
