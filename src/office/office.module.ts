import { Module } from '@nestjs/common';
import { OfficeService } from './office.service';
import { OfficeController } from './office.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SystemActivityModule } from '../system-activity/system-activity.module';

@Module({
    imports: [PrismaModule, SystemActivityModule],
    controllers: [OfficeController],
    providers: [OfficeService],
    exports: [OfficeService],
})
export class OfficeModule { }
