import { Module } from '@nestjs/common';
import { ImsCustomProductController } from './ims-custom-product.controller';
import { ImsCustomProductService } from './ims-custom-product.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ImsCustomProductController],
  providers: [ImsCustomProductService],
})
export class ImsCustomProductModule {}
