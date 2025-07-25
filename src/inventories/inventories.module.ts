import { Module } from '@nestjs/common';
import { InventoriesService } from './inventories.service';
import { InventoriesController } from './inventories.controller';
import { DatabaseModule } from 'src/database/database.module';
import { Inventory } from './entities/inventory.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Product } from 'src/products/entities/product.entity';
import { Store } from 'src/store/entities/store.entity';

@Module({
  imports: [DatabaseModule, TypeOrmModule.forFeature([Inventory, User, Product, Store])],
  controllers: [InventoriesController],
  providers: [InventoriesService],
  exports: [InventoriesService], 
})
export class InventoriesModule {}
