import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ImsNotificationService {
    private readonly logger = new Logger(ImsNotificationService.name);

    constructor(private prisma: PrismaService) { }

    async create(title: string, message: string, type: string, link?: string) {
        try {
            return await this.prisma.imsNotification.create({
                data: { title, message, type, link: link || null },
            });
        } catch (e) {
            this.logger.error('Failed to create notification', e);
        }
    }

    async findAll() {
        const [notifications, unreadCount] = await Promise.all([
            this.prisma.imsNotification.findMany({
                orderBy: { created_at: 'desc' },
                take: 50,
            }),
            this.prisma.imsNotification.count({ where: { is_read: false } }),
        ]);
        return { notifications, unreadCount };
    }

    async markAsRead(id: string) {
        const notif = await this.prisma.imsNotification.findUnique({ where: { id } });
        if (!notif) throw new NotFoundException('Notification not found');
        return this.prisma.imsNotification.update({
            where: { id },
            data: { is_read: true },
        });
    }

    async markAllAsRead() {
        return this.prisma.imsNotification.updateMany({
            where: { is_read: false },
            data: { is_read: true },
        });
    }
}
