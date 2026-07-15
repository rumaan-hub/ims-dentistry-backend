import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
// Adjust this path based on where your PrismaModule is located
// If prisma folder is inside 'src', use '../prisma/prisma.module'
import { PrismaModule } from '../prisma/prisma.module';
import { SystemActivityModule } from '../system-activity/system-activity.module';

@Module({
  // 1. Import PrismaModule so InventoryService can access the Database
  imports: [PrismaModule, SystemActivityModule],

  // 2. Declare the Controller to handle HTTP requests
  controllers: [InventoryController],

  // 3. Declare the Service to handle Business Logic
  providers: [InventoryService],

  // 4. Export the service if other modules (like Reports) need to use Inventory data
  exports: [InventoryService],
})
export class InventoryModule { }