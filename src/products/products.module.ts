import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product } from './entities/product.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inventory } from 'src/inventories/entities/inventory.entity';
import { Category } from 'src/categories/entities/category.entity';
import { Store } from 'src/store/entities/store.entity';
import { CategoriesService } from 'src/categories/categories.service';
import { OrderItem } from 'src/order-item/entities/order-item.entity';


@Module({
  imports: [TypeOrmModule.forFeature([Product, Inventory, Category, Store, OrderItem])],
  controllers: [ProductsController],
  providers: [ProductsService, CategoriesService],
  exports: [ProductsService],
})
export class ProductsModule {}
