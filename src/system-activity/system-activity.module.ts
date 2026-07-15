import { Module } from '@nestjs/common';
import { SystemActivityService } from './system-activity.service';
import { SystemActivityController } from './system-activity.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [SystemActivityController],
    providers: [SystemActivityService],
    exports: [SystemActivityService],
})
export class SystemActivityModule { }
