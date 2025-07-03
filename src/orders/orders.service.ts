import { Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
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

    // Fetch with relations
    return this.ordersRepository.findOne({
      where: { order_id: savedOrder.order_id },
      relations: ['user', 'products'],
      select: {
        order_id: true,
        total_amount: true,
        status: true,
        user: {
          user_id: true,
          first_name: true,
          last_name: true,
          email: true,
        },
        products: {
          product_id: true,
          name: true,
          price: true,
        },
      },
    });
  }

  processOrder(createOrderDto: CreateOrderDto) {
    // Check if the product exists
    const productExists = this.checkIfProductExists(createOrderDto.product_id);
    if (!productExists) {
      throw new Error(`Product with ID ${createOrderDto.product_id} does not exist.`);
    }

    // Process the order
    return `Order for product ID ${createOrderDto.product_id} has been processed.`;
  }

  pickupOrder(id: number) {
    return `This action picks up a #${id} order`;
  }

  orderDelivered(id: number) {
    return `This action marks a #${id} order as delivered`;
  }

  async create(createOrderDto: CreateOrderDto) {
    const order = this.ordersRepository.create({
      ...createOrderDto,
      user: { user_id: createOrderDto.user_id },
      products: createOrderDto.products.map((p) => ({
        product_id: p.product_id,
      })),
    });
    const savedOrder = await this.ordersRepository.save(order);

    // Fetch with relations
    return this.ordersRepository.findOne({
      where: { order_id: savedOrder.order_id },
      relations: ['user', 'products'],
      select: {
        order_id: true,
        total_amount: true,
        status: true,
        user: {
          user_id: true,
          first_name: true,
          last_name: true,
          email: true,
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
          first_name: true,
          last_name: true,
          email: true,
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
    const order = await this.ordersRepository.findOne({ where: { order_id: id } });
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
          first_name: true,
          last_name: true,
          email: true,
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
          first_name: true,
          last_name: true,
          email: true,
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
  // Update the order's status to 'Shipped' and any other fields
  await this.ordersRepository.update(id, { ...updateOrderDto, status: OrderStatus.Shipped });

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
        first_name: true,
        last_name: true,
        email: true,
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
}
