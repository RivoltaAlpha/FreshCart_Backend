import { Injectable } from '@nestjs/common';
import { CreateOrderItemDto } from './dto/create-order-item.dto';
import { UpdateOrderItemDto } from './dto/update-order-item.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { OrderItem } from './entities/order-item.entity';
import { In, Repository } from 'typeorm';
import { Product } from 'src/products/entities/product.entity';

@Injectable()
export class OrderItemService {
  constructor(
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  create(createOrderItemDto: CreateOrderItemDto) {
    const orderItem = this.orderItemRepository.create(createOrderItemDto);
    return this.orderItemRepository.save(orderItem);
  }

  findAll() {
    return this.orderItemRepository.find();
  }

  findOne(id: number) {
    return this.orderItemRepository.findOne({ where: { item_id: id } });
  }

  update(id: number, updateOrderItemDto: UpdateOrderItemDto) {
    return this.orderItemRepository.update(id, updateOrderItemDto);
  }

  remove(id: number) {
    return this.orderItemRepository.delete(id);
  }

  // get 10 of the most ordered products
async findTop10Products() {
  const topProducts = await this.orderItemRepository
    .createQueryBuilder('orderItem')
    .select('orderItem.product_id', 'product_id')
    .addSelect('SUM(orderItem.quantity)', 'totalQuantity')
    .groupBy('orderItem.product_id')
    .orderBy('"totalQuantity"', 'DESC')
    .limit(10)
    .getRawMany();

  const productIds = topProducts.map(p => p.product_id);

  if (productIds.length === 0) return [];

  const products = await this.productRepository.find({
    where: { product_id: In(productIds) },
    select: ['product_id', 'name', 'image_url', 'price'],
  });

  return products.map(product => {
    const stats = topProducts.find(p => p.product_id === product.product_id);
    return {
      ...product,
      totalQuantity: stats?.totalQuantity ?? 0,
    };
  });
}
}
