import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SystemActivityService } from '../system-activity/system-activity.service';
import { ImsNotificationService } from '../ims-notification/ims-notification.service';
import { CreateImsDemoDto } from './dto/create-ims-demo.dto';
import { UpdateImsDemoDto } from './dto/update-ims-demo.dto';
import { als } from '../prisma/als';

@Injectable()
export class ImsDemoService {
    constructor(
        private prisma: PrismaService,
        private activityService: SystemActivityService,
        private notificationService: ImsNotificationService,
    ) { }

    async schedule(dto: CreateImsDemoDto) {
        const scheduledDate = new Date(dto.scheduled_at);
        if (scheduledDate <= new Date()) {
            throw new BadRequestException('scheduled_at must be a future date');
        }

        // Slot availability: one demo per 30-minute slot (global).
        // Reject if any active booking already occupies this slot window.
        const slotStart = scheduledDate;
        const slotEnd = new Date(slotStart.getTime() + ImsDemoService.SLOT_MINUTES * 60_000);
        const slotTaken = await this.prisma.imsUserDetail.findFirst({
            where: {
                demo_date: { gte: slotStart, lt: slotEnd },
                demo_status: { notIn: ['CANCELLED', 'FAILED'] },
            },
        });
        if (slotTaken) {
            throw new ConflictException('This time slot is no longer available. Please pick another slot.');
        }

        // Duplicate check: email (skip deleted users)
        const existingDemoByEmail = await this.prisma.imsUserDetail.findFirst({
            where: {
                user: { email: dto.email.toLowerCase().trim(), is_deleted: false },
                demo_status: { notIn: ['CANCELLED', 'FAILED'] },
            },
        });
        if (existingDemoByEmail) {
            throw new ConflictException('A demo is already booked with this email. Please contact support to reschedule.');
        }

        // Duplicate check: company name (case-insensitive, skip deleted users)
        if (dto.company_name) {
            const existingDemoByCompany = await this.prisma.imsUserDetail.findFirst({
                where: {
                    user: {
                        company_name: { equals: dto.company_name, mode: 'insensitive' },
                        is_deleted: false,
                    },
                    demo_status: { notIn: ['CANCELLED', 'FAILED'] },
                },
            });
            if (existingDemoByCompany) {
                throw new ConflictException('A demo is already booked for this company. Please contact support to reschedule.');
            }
        }

        // If client_id provided, verify client exists
        let clientId = dto.client_id;
        if (clientId) {
            const client = await this.prisma.imsUser.findUnique({
                where: { client_id: clientId },
            });
            if (!client) throw new NotFoundException('Client (ImsUser) not found');
        }

        // If no client_id, create a temporary ImsUser record for the prospect
        if (!clientId) {
            const existingUser = await this.prisma.imsUser.findUnique({
                where: { email: dto.email.toLowerCase().trim() },
            });

            if (existingUser && existingUser.is_deleted) {
                // Deleted user → save restore request instead of creating demo
                await this.prisma.imsUser.update({
                    where: { client_id: existingUser.client_id },
                    data: {
                        restore_requested: true,
                        restore_requested_at: new Date(),
                        restore_request_data: {
                            first_name: dto.full_name.split(' ')[0] || dto.full_name,
                            last_name: dto.full_name.split(' ').slice(1).join(' ') || '',
                            company_name: dto.company_name || existingUser.company_name,
                            contact_number: dto.phone || null,
                        },
                    },
                });
                await this.notificationService.create(
                    'Restore Request',
                    `${dto.full_name} requested account restore`,
                    'RESTORE_REQUEST',
                    '/system-admin/users',
                );
                return { message: 'Restore request sent. Admin will review your request.' };
            } else if (existingUser) {
                clientId = existingUser.client_id;
            } else {
                const newUser = await this.prisma.imsUser.create({
                    data: {
                        company_name: dto.company_name || 'N/A',
                        first_name: dto.full_name.split(' ')[0] || dto.full_name,
                        last_name: dto.full_name.split(' ').slice(1).join(' ') || '',
                        email: dto.email.toLowerCase().trim(),
                        agree_to_terms: false,
                    },
                });
                clientId = newUser.client_id;
            }
        }

        const demo = await this.prisma.imsUserDetail.create({
            data: {
                client_id: clientId,
                demo_date: scheduledDate,
                status: dto.demo_type || 'DEMO_REQUEST',
                remarks: dto.notes || null,
                demo_status: 'PENDING',
            },
            include: {
                user: {
                    select: {
                        client_id: true,
                        first_name: true,
                        last_name: true,
                        email: true,
                        company_name: true,
                    },
                },
            },
        });

        await this.activityService.create({
            action: `Demo scheduled for ${dto.email}`,
            user: dto.full_name,
            client_id: clientId,
        });

        this.notificationService.create(
            'New Registration',
            `${demo.user.first_name} ${demo.user.last_name} from ${demo.user.company_name} registered`,
            'NEW_REGISTRATION',
            '/system-admin/users',
        );

        return demo;
    }

    // ── Demo booking slot configuration ──────────────────────────────
    // Business hours: Monday–Friday, 9:00 AM – 5:00 PM, US Eastern time.
    // 30-minute slots → 9:00, 9:30, … 4:30 PM (last slot ends 5:00 PM).
    static readonly SLOT_TIMEZONE = 'America/New_York';
    static readonly SLOT_MINUTES = 30;
    static readonly SLOT_OPEN_MINUTES = 9 * 60;   // 09:00
    static readonly SLOT_CLOSE_MINUTES = 17 * 60;  // 17:00 (exclusive → last start 16:30)

    /**
     * Convert a wall-clock time in a given IANA timezone to the correct UTC
     * instant, accounting for DST. Dependency-free (uses Intl via toLocaleString).
     */
    private zonedWallTimeToUtc(
        year: number, month: number, day: number,
        hour: number, minute: number,
        timeZone = ImsDemoService.SLOT_TIMEZONE,
    ): Date {
        const asUTC = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
        const tzWall = new Date(new Date(asUTC).toLocaleString('en-US', { timeZone }));
        const utcWall = new Date(new Date(asUTC).toLocaleString('en-US', { timeZone: 'UTC' }));
        const offset = tzWall.getTime() - utcWall.getTime();
        return new Date(asUTC - offset);
    }

    private formatSlotLabel(hour: number, minute: number): string {
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const h12 = hour % 12 === 0 ? 12 : hour % 12;
        return `${h12}:${String(minute).padStart(2, '0')} ${ampm}`;
    }

    /**
     * Return the bookable 30-minute slots for a given calendar date
     * (YYYY-MM-DD, interpreted in US Eastern). Weekends are closed.
     * A slot is `available` when it is in the future and not already booked.
     * No personal data of other bookers is exposed.
     */
    async getAvailableSlots(dateStr: string) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr || '')) {
            throw new BadRequestException('date query param must be in YYYY-MM-DD format');
        }
        const [year, month, day] = dateStr.split('-').map(Number);
        const timezone = ImsDemoService.SLOT_TIMEZONE;

        // Day-of-week of the calendar date (noon UTC avoids any edge ambiguity).
        const weekday = new Date(Date.UTC(year, month - 1, day, 12)).getUTCDay(); // 0=Sun … 6=Sat
        if (weekday === 0 || weekday === 6) {
            return { date: dateStr, timezone, closed: true, reason: 'weekend', slots: [] };
        }

        // Fetch active bookings within this day's open window (UTC bounds).
        const windowStart = this.zonedWallTimeToUtc(year, month, day, 9, 0);
        const windowEnd = this.zonedWallTimeToUtc(year, month, day, 17, 0);
        const bookings = await this.prisma.imsUserDetail.findMany({
            where: {
                demo_date: { gte: windowStart, lt: windowEnd },
                demo_status: { notIn: ['CANCELLED', 'FAILED'] },
            },
            select: { demo_date: true },
        });
        const bookedTimes = bookings
            .map((b) => b.demo_date?.getTime())
            .filter((t): t is number => typeof t === 'number');

        const now = Date.now();
        const slots: { value: string; label: string; available: boolean }[] = [];
        for (
            let mins = ImsDemoService.SLOT_OPEN_MINUTES;
            mins < ImsDemoService.SLOT_CLOSE_MINUTES;
            mins += ImsDemoService.SLOT_MINUTES
        ) {
            const hh = Math.floor(mins / 60);
            const mm = mins % 60;
            const slotUtc = this.zonedWallTimeToUtc(year, month, day, hh, mm);
            const slotStartMs = slotUtc.getTime();
            const slotEndMs = slotStartMs + ImsDemoService.SLOT_MINUTES * 60_000;
            const isPast = slotStartMs <= now;
            const isBooked = bookedTimes.some((t) => t >= slotStartMs && t < slotEndMs);
            slots.push({
                value: slotUtc.toISOString(),
                label: this.formatSlotLabel(hh, mm),
                available: !isPast && !isBooked,
            });
        }

        return { date: dateStr, timezone, closed: false, slots };
    }

    async findAll(includeDeleted = false) {
        return this.prisma.imsUserDetail.findMany({
            where: includeDeleted ? {} : { user: { is_deleted: false } },
            orderBy: { demo_date: 'desc' },
            include: {
                user: {
                    select: {
                        client_id: true,
                        first_name: true,
                        last_name: true,
                        email: true,
                        company_name: true,
                        contact_number: true,
                        is_deleted: true,
                    },
                },
                system_admin: {
                    select: {
                        client_id: true,
                        first_name: true,
                        last_name: true,
                        email: true,
                    },
                },
            },
        });
    }

    async findByClient(clientId: string, requestUser: any) {
        // Non-admin users can only view their own demos
        const isSystemAdmin = requestUser?.is_system_admin === true
            || requestUser?.role === 'SYSTEM_ADMIN';

        if (!isSystemAdmin && requestUser?.client_id !== clientId) {
            throw new ForbiddenException('You can only view your own demos');
        }

        const client = await this.prisma.imsUser.findUnique({
            where: { client_id: clientId },
        });
        if (!client) throw new NotFoundException('Client not found');

        return this.prisma.imsUserDetail.findMany({
            where: { client_id: clientId },
            orderBy: { demo_date: 'desc' },
            include: {
                user: {
                    select: {
                        client_id: true,
                        first_name: true,
                        last_name: true,
                        email: true,
                        company_name: true,
                    },
                },
                system_admin: {
                    select: {
                        client_id: true,
                        first_name: true,
                        last_name: true,
                        email: true,
                    },
                },
            },
        });
    }

    async updateStatus(id: string, dto: UpdateImsDemoDto, requestUser: any) {
        const demo = await this.prisma.imsUserDetail.findUnique({
            where: { id },
        });
        if (!demo) throw new NotFoundException('Demo not found');

        const adminId = requestUser?.client_id || null;
        const existingLog = (demo.remarks_log as any[]) || [];
        const newEntry = {
            date: new Date().toISOString(),
            status: dto.demo_status,
            remark: dto.remarks || null,
            demo_date: dto.demo_date || null,
            changed_by: adminId,
        };
        const updatedLog = [...existingLog, newEntry];

        const updated = await this.prisma.imsUserDetail.update({
            where: { id },
            data: {
                demo_status: dto.demo_status as any,
                demo_date: dto.demo_date ? new Date(dto.demo_date) : demo.demo_date,
                remarks: dto.remarks,
                remarks_log: updatedLog,
                admin_id: adminId,
            },
            include: {
                user: {
                    select: {
                        client_id: true,
                        first_name: true,
                        last_name: true,
                        email: true,
                    },
                },
            },
        });

        await this.activityService.create({
            action: `Demo status updated to ${dto.demo_status} for ${updated.user.email}`,
            user: requestUser?.email || 'system',
            client_id: demo.client_id,
        });

        const userName = `${updated.user.first_name} ${updated.user.last_name}`;
        switch (dto.demo_status) {
            case 'SCHEDULED':
                await this.notificationService.create('Demo Scheduled', `Demo scheduled for ${userName}`, 'DEMO_SCHEDULED', '/system-admin/users');
                break;
            case 'SUCCESSFUL':
                await this.notificationService.create('Demo Successful', `Demo completed successfully for ${userName}`, 'DEMO_SUCCESSFUL', '/system-admin/users');
                break;
            case 'FAILED':
                await this.notificationService.create('Demo Failed', `Demo failed for ${userName}`, 'DEMO_FAILED', '/system-admin/users');
                break;
            case 'CANCELLED':
                await this.notificationService.create('Demo Cancelled', `Demo cancelled for ${userName}`, 'DEMO_CANCELLED', '/system-admin/users');
                break;
            case 'RESCHEDULED':
                await this.notificationService.create('Demo Rescheduled', `Demo rescheduled for ${userName}`, 'DEMO_RESCHEDULED', '/system-admin/users');
                break;
        }

        return updated;
    }

    async getRestoreRequests(requestUser: any) {
        if (!requestUser?.is_system_admin) throw new ForbiddenException('System admin access required');

        return this.prisma.imsUser.findMany({
            where: { is_deleted: true, restore_requested: true },
            select: {
                client_id: true,
                email: true,
                first_name: true,
                last_name: true,
                company_name: true,
                restore_requested_at: true,
                restore_request_data: true,
            },
            orderBy: { restore_requested_at: 'desc' },
        });
    }

    async restoreAllow(clientId: string, requestUser: any) {
        if (!requestUser?.is_system_admin) throw new ForbiddenException('System admin access required');

        const user = await this.prisma.imsUser.findUnique({ where: { client_id: clientId } });
        if (!user) throw new NotFoundException('User not found');

        const data = (user.restore_request_data as any) || {};

        await this.prisma.imsUser.update({
            where: { client_id: clientId },
            data: {
                is_deleted: false,
                deleted_at: null,
                restore_requested: false,
                restore_request_data: null,
                restore_requested_at: null,
                first_name: data.first_name || user.first_name,
                last_name: data.last_name || user.last_name,
                company_name: data.company_name || user.company_name,
                contact_number: data.contact_number || user.contact_number,
                permanent_address: data.permanent_address || user.permanent_address,
                city: data.city || user.city,
                state: data.state || user.state,
                zip_code: data.zip_code || user.zip_code,
            },
        });

        await this.activityService.create({
            action: `User account restored: ${user.email}`,
            user: requestUser?.email || 'system',
            client_id: clientId,
        });

        return { success: true };
    }

    async restoreReject(clientId: string, requestUser: any) {
        if (!requestUser?.is_system_admin) throw new ForbiddenException('System admin access required');

        const user = await this.prisma.imsUser.findUnique({ where: { client_id: clientId } });
        if (!user) throw new NotFoundException('User not found');

        await this.prisma.imsUser.update({
            where: { client_id: clientId },
            data: {
                restore_requested: false,
                restore_request_data: null,
                restore_requested_at: null,
            },
        });

        return { success: true };
    }

    async remove(id: string, requestUser: any) {
        const demo = await this.prisma.imsUserDetail.findUnique({
            where: { id },
            include: { user: { select: { email: true, client_id: true } } },
        });
        if (!demo) throw new NotFoundException('Demo not found');

        const clientId = demo.client_id;

        await this.prisma.imsUser.update({
            where: { client_id: clientId },
            data: {
                is_deleted: true,
                deleted_at: new Date(),
            },
        });

        await this.activityService.create({
            action: `User soft-deleted: ${demo.user.email}`,
            user: requestUser?.email || 'system',
            client_id: clientId,
        });

        return { success: true, message: `User ${demo.user.email} marked as deleted` };
    }
}
