import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { AuditRetentionService } from './audit-retention.service';

@Module({
  providers: [PrismaService, AuditRetentionService],
  exports: [PrismaService],
})
export class PrismaModule {}
