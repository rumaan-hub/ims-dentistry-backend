import {
    Injectable,
    Logger,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadFileService } from '../upload-file/upload-file.service';
import { SystemActivityService } from '../system-activity/system-activity.service';
import { UpdateAgreementDto } from './dto/update-agreement.dto';

@Injectable()
export class ImsAgreementService {
    private readonly logger = new Logger(ImsAgreementService.name);

    constructor(
        private prisma: PrismaService,
        private uploadFileService: UploadFileService,
        private activityService: SystemActivityService,
    ) { }

    async uploadPdf(file: any) {
        if (!file) throw new BadRequestException('No file provided');
        if (file.mimetype !== 'application/pdf') throw new BadRequestException('Only PDF files allowed');

        const result = await this.uploadFileService.uploadFile(file);
        return { url: result.Location };
    }

    async createAgreement(clientId: string, dto: UpdateAgreementDto, requestUser: any) {
        if (!requestUser?.is_system_admin) throw new ForbiddenException('System admin access required');

        const client = await this.prisma.imsUser.findUnique({ where: { client_id: clientId } });
        if (!client) throw new NotFoundException('Client not found');

        const agreement = await this.prisma.agreement.create({
            data: {
                client_id: clientId,
                admin_id: requestUser.client_id,
                created_by: requestUser.client_id,
                status: (dto.status as any) || 'PENDING',
                remarks: dto.remarks || null,
                signed_file: dto.signed_file || null,
            },
        });

        this.activityService.create({
            action: `Agreement created with status ${dto.status}`,
            user: requestUser?.email || 'system',
            client_id: clientId,
        });

        return agreement;
    }

    async updateStatus(id: string, dto: UpdateAgreementDto, requestUser: any) {
        if (!requestUser?.is_system_admin) throw new ForbiddenException('System admin access required');

        const agreement = await this.prisma.agreement.findUnique({
            where: { agreement_id: id },
        });
        if (!agreement) throw new NotFoundException('Agreement not found');

        const updateData: any = {
            status: dto.status as any,
            remarks: dto.remarks !== undefined ? dto.remarks : agreement.remarks,
        };
        if (dto.signed_file) {
            updateData.signed_file = dto.signed_file;
        }

        const updated = await this.prisma.agreement.update({
            where: { agreement_id: id },
            data: updateData,
        });

        this.activityService.create({
            action: `Agreement status updated to ${dto.status}`,
            user: requestUser?.email || 'system',
            client_id: agreement.client_id,
        });

        return updated;
    }

    async findByClient(clientId: string, requestUser: any) {
        if (!requestUser?.is_system_admin) throw new ForbiddenException('System admin access required');

        const agreement = await this.prisma.agreement.findFirst({
            where: { client_id: clientId },
            orderBy: { updated_at: 'desc' },
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
        return agreement ?? null;
    }
}
