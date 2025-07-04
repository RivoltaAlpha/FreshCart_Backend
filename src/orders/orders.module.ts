import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { Product } from 'src/products/entities/product.entity';
import { User } from 'src/users/entities/user.entity';
import { Store } from 'src/store/entities/store.entity';
import { OrderItem } from 'src/order-item/entities/order-item.entity';
import { Inventory } from 'src/inventories/entities/inventory.entity';
import { InventoriesModule } from 'src/inventories/inventories.module';

@Module({
  imports: [TypeOrmModule.forFeature([Order, Product, User, Store, OrderItem, Inventory]),
  InventoriesModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
