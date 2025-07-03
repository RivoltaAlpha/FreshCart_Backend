import { Injectable } from '@nestjs/common';
import { CreateOrderDto, OrderStatus } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order } from './entities/order.entity';
import { Product } from 'src/products/entities/product.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    private readonly dataSource: DataSource,
  ) {}

  async create(createOrderDto: CreateOrderDto) {
    const order = this.ordersRepository.create({
      ...createOrderDto,
      user: { user_id: createOrderDto.user_id },
      products: createOrderDto.products.map((p) => ({
        product_id: p.product_id,
      })),
    });
    const savedOrder = await this.ordersRepository.save(order);

    return this.ordersRepository.findOne({
      where: { order_id: savedOrder.order_id },
      relations: ['user', 'products'],
      select: {
        order_id: true,
        total_amount: true,
        status: true,
        user: {
          user_id: true,
          email: true,
          profile: {
            profile_id: true,
            first_name: true,
            last_name: true,
            phone_number: true,
          },
        },
        products: {
          product_id: true,
          name: true,
          price: true,
        },
      },
    });
  }

  async processOrder(product_id: number, createOrderDto: CreateOrderDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const productExists = await this.productsRepository.findOne({
        where: { product_id: product_id },
        select: ['product_id'],
      });

      if (!productExists) {
        throw new Error(`Product with ID ${product_id} does not exist.`);
      }

      // Process the order
      const savedOrder = await queryRunner.manager.save(Order, {
        ...createOrderDto,
        user: { user_id: createOrderDto.user_id },
        products: createOrderDto.products.map((p) => ({
          product_id: p.product_id,
        })),
      });

      await queryRunner.commitTransaction();

      // Fetch and return the saved order with relations
      return this.ordersRepository.findOne({
        where: { order_id: savedOrder.order_id },
        relations: ['user', 'products'],
        select: {
          order_id: true,
          total_amount: true,
          status: true,
          user: {
            user_id: true,
            email: true,
            profile: {
              profile_id: true,
              first_name: true,
              last_name: true,
              phone_number: true,
            },
          },
          products: {
            product_id: true,
            name: true,
            price: true,
          },
        },
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    }
  }

  async pickupOrder(id: number, updateOrderDto: UpdateOrderDto) {
    await this.ordersRepository.update(id, {
      ...updateOrderDto,
      status: OrderStatus.in_transit,
    });

    // Fetch and return the updated order with relations
    return this.ordersRepository.findOne({
      where: { order_id: id },
      relations: ['user', 'products'],
      select: {
        order_id: true,
        total_amount: true,
        status: true,
        user: {
          user_id: true,
          email: true,
          profile: {
            profile_id: true,
            first_name: true,
            last_name: true,
            phone_number: true,
          },
        },
        products: {
          product_id: true,
          name: true,
          price: true,
        },
      },
    });
  }

  async cancelOrder(id: number, updateOrderDto: UpdateOrderDto) {
    await this.ordersRepository.update(id, {
      ...updateOrderDto,
      status: OrderStatus.cancelled,
    });

    // Fetch and return the updated order with relations
    return this.ordersRepository.findOne({
      where: { order_id: id },
      relations: ['user', 'products'],
      select: {
        order_id: true,
        total_amount: true,
        status: true,
        user: {
          user_id: true,
          email: true,
          profile: {
            profile_id: true,
            first_name: true,
            last_name: true,
            phone_number: true,
          },
        },
        products: {
          product_id: true,
          name: true,
          price: true,
        },
      },
    });
  }

  async orderDelivered(id: number, updateOrderDto: UpdateOrderDto) {
    await this.ordersRepository.update(id, {
      ...updateOrderDto,
      status: OrderStatus.delivered,
    });

    // Fetch and return the updated order with relations
    return this.ordersRepository.findOne({
      where: { order_id: id },
      relations: ['user', 'products'],
      select: {
        order_id: true,
        total_amount: true,
        status: true,
        user: {
          user_id: true,
          email: true,
          profile: {
            profile_id: true,
            first_name: true,
            last_name: true,
            phone_number: true,
          },
        },
        products: {
          product_id: true,
          name: true,
          price: true,
        },
      },
    });
  }

  async findAll() {
    return this.ordersRepository.find({
      relations: ['user', 'products'],
      select: {
        order_id: true,
        total_amount: true,
        status: true,
        user: {
          user_id: true,
          email: true,
          profile: {
            profile_id: true,
            first_name: true,
            last_name: true,
            phone_number: true,
          },
        },
        products: {
          product_id: true,
          name: true,
          price: true,
        },
      },
    });
  }

  async findOne(id: number) {
    return this.ordersRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .select([
        'order',
        'user.user_id',
        'user.first_name',
        'user.last_name',
        'user.email',
      ])
      .leftJoinAndSelect('order.products', 'product')
      .leftJoinAndSelect('order.shipping', 'shipping')
      .leftJoinAndSelect('order.returnEntity', 'returnEntity')
      .where('order.order_id = :id', { id })
      .getOne();
  }

  async update(id: number, updateOrderDto: UpdateOrderDto) {
    const order = await this.ordersRepository.findOne({
      where: { order_id: id },
    });
    if (!order) {
      throw new Error(`Order with id ${id} not found`);
    }

    await this.ordersRepository.update(id, updateOrderDto);

    return this.ordersRepository.findOne({ where: { order_id: id } });
  }

  remove(id: number) {
    return this.ordersRepository.delete(id);
  }

  // user orders
  async findByUser(userId: number) {
    return this.ordersRepository.find({
      where: { user: { user_id: userId } },
      relations: ['user', 'products'],
      select: {
        order_id: true,
        total_amount: true,
        status: true,
        user: {
          user_id: true,
          email: true,
          profile: {
            profile_id: true,
            first_name: true,
            last_name: true,
            phone_number: true,
          },
        },
        products: {
          product_id: true,
          name: true,
          price: true,
        },
      },
    });
  }

  // filter order with status
  async getStatus(productStatus: string) {
    return this.ordersRepository.find({
      where: { status: productStatus as Order['status'] },
      relations: ['user', 'products'],
      select: {
        order_id: true,
        total_amount: true,
        status: true,
        user: {
          user_id: true,
          email: true,
          profile: {
            profile_id: true,
            first_name: true,
            last_name: true,
            phone_number: true,
          },
        },
        products: {
          product_id: true,
          name: true,
          price: true,
        },
      },
    });
  }

  async ship(id: number, updateOrderDto: UpdateOrderDto) {
    await this.ordersRepository.update(id, {
      ...updateOrderDto,
      status: OrderStatus.shipped,
    });

    // Fetch and return the updated order with relations
    return this.ordersRepository.findOne({
      where: { order_id: id },
      relations: ['user', 'products'],
      select: {
        order_id: true,
        total_amount: true,
        status: true,
        user: {
          user_id: true,
          email: true,
          profile: {
            profile_id: true,
            first_name: true,
            last_name: true,
            phone_number: true,
          },
        },
        products: {
          product_id: true,
          name: true,
          price: true,
        },
      },
    });
  }
}
