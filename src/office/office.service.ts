import { Injectable, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOfficeDto } from './dto/create-office.dto';
import { Prisma } from '@prisma/client';
import { SystemActivityService } from '../system-activity/system-activity.service';

@Injectable()
export class OfficeService {
    constructor(
        private prisma: PrismaService,
        private activityService: SystemActivityService,
    ) { }

    /**
     * Create an office, strictly linked to an IMS User (client_id).
     */
    async create(dto: CreateOfficeDto) {
        let clientId = dto.client_id;

        if (!clientId) {
            const activeClient = await this.prisma.imsUser.findFirst({
                select: { client_id: true },
                orderBy: { created_at: 'asc' },
            });
            if (!activeClient) {
                throw new NotFoundException(
                    'No IMS User found. Cannot create an office without a linked client.',
                );
            }
            clientId = activeClient.client_id;
        } else {
            const exists = await this.prisma.imsUser.findUnique({
                where: { client_id: clientId },
                select: { client_id: true },
            });
            if (!exists) throw new NotFoundException('IMS User (client_id) not found');
        }

        try {
            const result = await this.prisma.office.create({
                data: {
                    office_name: dto.office_name,
                    address: dto.address,
                    client_id: clientId,
                },
            });

            this.activityService.create({
                action: 'Office created',
                office: result.office_name,
                client_id: result.client_id,
            });

            return result;
        } catch (e) {
            if (
                e instanceof Prisma.PrismaClientKnownRequestError &&
                e.code === 'P2002'           // unique constraint violation
            ) {
                throw new ConflictException(
                    `An office named "${dto.office_name}" already exists for this client.`,
                );
            }
            console.error('[OfficeService.create] Unexpected error:', e);
            throw new InternalServerErrorException('Failed to create office.');
        }
    }

    /** Full office list with nested user — reserved for admin detail/audit views */
    async findAll() {
        return this.prisma.office.findMany({ include: { user: true } });
    }

    /**
     * Lightweight office list — only essential fields, zero joins.
     */
    async findAllLight(search: string = '') {
        const where: Prisma.OfficeWhereInput = {};

        if (search?.trim()) {
            where.OR = [
                { office_name: { contains: search.trim(), mode: 'insensitive' } },
                { address: { contains: search.trim(), mode: 'insensitive' } },
            ];
        }

        const offices = await this.prisma.office.findMany({
            where,
            orderBy: { office_name: 'asc' },
            select: {
                office_id: true,
                office_name: true,
                address: true,
                client_id: true,
            },
        });

        const officeMap: Record<string, (typeof offices)[0]> = {};
        for (const o of offices) officeMap[o.office_id] = o;

        return { data: offices, officeMap, total: offices.length };
    }

    /** Update office_name and/or address */
    async update(id: string, dto: Partial<CreateOfficeDto>) {
        const office = await this.prisma.office.findUnique({ where: { office_id: id } });
        if (!office) throw new NotFoundException('Office not found');

        try {
            const result = await this.prisma.office.update({
                where: { office_id: id },
                data: {
                    ...(dto.office_name && { office_name: dto.office_name }),
                    ...(dto.address && { address: dto.address }),
                },
            });

            this.activityService.create({
                action: 'Office updated',
                office: result.office_name,
                client_id: result.client_id,
            });

            return result;
        } catch (e) {
            if (
                e instanceof Prisma.PrismaClientKnownRequestError &&
                e.code === 'P2002'
            ) {
                throw new ConflictException(
                    `An office named "${dto.office_name}" already exists for this client.`,
                );
            }
            throw new InternalServerErrorException('Failed to update office.');
        }
    }

    /** Delete an office */
    async remove(id: string) {
        const office = await this.prisma.office.findUnique({ where: { office_id: id } });
        if (!office) throw new NotFoundException('Office not found');

        await this.prisma.office.delete({ where: { office_id: id } });

        this.activityService.create({
            action: 'Office removed',
            office: office.office_name,
            client_id: office.client_id,
        });

        return { message: 'Office deleted successfully' };
    }
}