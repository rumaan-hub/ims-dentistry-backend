import { Module } from '@nestjs/common';
import { TransferController } from './transfer.controller';
import { TransferService } from './transfer.service';
import { PrismaModule } from '../prisma/prisma.module';
import { SystemActivityModule } from '../system-activity/system-activity.module';

@Module({
    imports: [PrismaModule, SystemActivityModule],
    controllers: [TransferController],
    providers: [TransferService],
    exports: [TransferService],
})
export class TransferModule { }
