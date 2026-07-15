import { Module } from '@nestjs/common';
import { RbacService } from './rbac.service';
import { RbacController } from './rbac.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { UserModule } from '../user/user.module';

@Module({
    imports: [PrismaModule, UserModule],
    providers: [RbacService],
    controllers: [RbacController],
})
export class RbacModule { }
