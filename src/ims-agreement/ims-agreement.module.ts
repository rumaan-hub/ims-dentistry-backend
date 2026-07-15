import { Module } from '@nestjs/common';
import { ImsAgreementController } from './ims-agreement.controller';
import { ImsAgreementService } from './ims-agreement.service';
import { PrismaModule } from '../prisma/prisma.module';
import { SystemActivityModule } from '../system-activity/system-activity.module';
import { UploadFileModule } from '../upload-file/upload-file.module';

@Module({
    imports: [PrismaModule, SystemActivityModule, UploadFileModule],
    controllers: [ImsAgreementController],
    providers: [ImsAgreementService],
    exports: [ImsAgreementService],
})
export class ImsAgreementModule { }
