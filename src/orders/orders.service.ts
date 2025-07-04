import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { Product } from 'src/products/entities/product.entity';
import { Store } from 'src/store/entities/store.entity';
import { User } from 'src/users/entities/user.entity';
import {
  CreateOrderDto,
  UpdateOrderStatusDto,
  RateOrderDto,
} from './dto/create-order.dto';
import { InventoriesService } from 'src/inventories/inventories.service';
import { OrderItem } from 'src/order-item/entities/order-item.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,

    @InjectRepository(OrderItem)
    private orderItemsRepository: Repository<OrderItem>,

    @InjectRepository(Product)
    private productsRepository: Repository<Product>,

    @InjectRepository(Store)
    private storeRepository: Repository<Store>,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    private inventoriesService: InventoriesService,
    private dataSource: DataSource,
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const [user, store] = await Promise.all([
        this.userRepository.findOne({
          where: { user_id: createOrderDto.user_id },
        }),
        this.storeRepository.findOne({
          where: { store_id: createOrderDto.store_id },
        }),
      ]);

      if (!user) {
        throw new NotFoundException(
          `User with ID ${createOrderDto.user_id} not found`,
        );
      }
      if (!store) {
        throw new NotFoundException(
          `Store with ID ${createOrderDto.store_id} not found`,
        );
      }

      let subtotal = 0;
      const orderItems: Array<{
        product_id: number;
        quantity: number;
        unit_price: number;
        total_price: number;
      }> = [];

      for (const item of createOrderDto.items) {
        // First, check if product exists
        const product = await this.productsRepository.findOne({
          where: { product_id: item.product_id },
        });

        if (!product) {
          throw new NotFoundException(
            `Product with ID ${item.product_id} not found`,
          );
        }
        // Check if product exists in the store's inventory
        const inventories =
          await this.inventoriesService.findInventoriesByProduct(
            item.product_id,
            createOrderDto.store_id,
          );
        if (!inventories || inventories.length === 0) {
          throw new NotFoundException(
            `Product with ID ${item.product_id} not found in store`,
          );
        }
        // Calculate total available stock across all inventories for this product in this store
        const totalStock = inventories.reduce(
          (total, inv) => total + inv.stock_qty,
          0,
        );
        if (totalStock < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for product: ${product.name}. Available: ${totalStock}, Requested: ${item.quantity}`,
          );
        }

        const itemTotal = product.price * item.quantity;
        subtotal += itemTotal;

        orderItems.push({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: product.price,
          total_price: itemTotal,
        });

        // Reserve stock for the product in this store
        await this.inventoriesService.reserveStockForProduct(
          item.product_id,
          item.quantity,
          createOrderDto.store_id,
        );
      }

      // Calculate delivery fee and total
      const deliveryFee =
        createOrderDto.delivery_method === 'pickup' ? 0 : store.delivery_fee;
      const taxAmount = subtotal * 0.16;
      const totalAmount = subtotal + deliveryFee + taxAmount;

      // Generate order number
      const orderNumber = await this.generateOrderNumber();

      // Create order
      const order = this.ordersRepository.create({
        order_number: orderNumber,
        user_id: createOrderDto.user_id,
        store_id: createOrderDto.store_id,
        delivery_method: createOrderDto.delivery_method,
        delivery_fee: deliveryFee,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        delivery_address: createOrderDto.delivery_address,
        estimated_delivery_time: createOrderDto.estimated_delivery_time,
        status: OrderStatus.PENDING,
      });

      const savedOrder = await queryRunner.manager.save(order);

      // Create order items
      for (const itemData of orderItems) {
        const orderItem = this.orderItemsRepository.create({
          order_id: savedOrder.order_id,
          ...(itemData as object),
        });
        await queryRunner.manager.save(orderItem);
      }

      await queryRunner.commitTransaction();

      // Return complete order with relationships
      return await this.findOne(savedOrder.order_id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async confirmOrder(id: number): Promise<Order> {
    const order = await this.findOne(id);

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException(
        'Order can only be confirmed from pending status',
      );
    }

    // Confirm stock reservations become actual sales
    for (const item of order.items) {
      // Use the store-specific inventory method
      const inventory =
        await this.inventoriesService.getInventoryWithProductInStore(
          item.product_id,
          order.store_id,
        );

      if (inventory) {
        await this.inventoriesService.confirmSale(
          inventory.inventory_id,
          item.quantity,
        );
      }
    }

    return await this.updateStatus(id, { status: OrderStatus.CONFIRMED });
  }

  private async releaseOrderStock(order: Order): Promise<void> {
    for (const item of order.items) {
      try {
        // Release stock for the specific product in the specific store
        await this.inventoriesService.reserveStockForProduct(
          item.product_id,
          -item.quantity, // Negative quantity to release
          order.store_id,
        );
      } catch (error) {
        // Log error but don't fail the cancellation
        console.error(
          `Failed to release stock for product ${item.product_id}:`,
          error,
        );
      }
    }
  }

  async findAll(
    page: number = 1,
    limit: number = 20,
    status?: OrderStatus,
    storeId?: number,
  ): Promise<{ orders: Order[]; total: number; pages: number }> {
    const queryBuilder = this.ordersRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoinAndSelect('order.store', 'store')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .orderBy('order.created_at', 'DESC');

    if (status) {
      queryBuilder.andWhere('order.status = :status', { status });
    }

    if (storeId) {
      queryBuilder.andWhere('order.store_id = :storeId', { storeId });
    }

    queryBuilder.skip((page - 1) * limit).take(limit);

    const [orders, total] = await queryBuilder.getManyAndCount();

    return {
      orders,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number): Promise<Order> {
    const order = await this.ordersRepository.findOne({
      where: { order_id: id },
      relations: [
        'user',
        'user.profile',
        'store',
        'store.owner',
        'items',
        'items.product',
        'payments',
        'driver',
      ],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }

  async findByUser(
    userId: number,
    page: number = 1,
    limit: number = 20,
    status?: OrderStatus,
  ): Promise<{ orders: Order[]; total: number; pages: number }> {
    const queryBuilder = this.ordersRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.store', 'store')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('order.payments', 'payments')
      .where('order.user_id = :userId', { userId })
      .orderBy('order.created_at', 'DESC');

    if (status) {
      queryBuilder.andWhere('order.status = :status', { status });
    }

    queryBuilder.skip((page - 1) * limit).take(limit);

    const [orders, total] = await queryBuilder.getManyAndCount();

    return {
      orders,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  async findByStore(
    storeId: number,
    page: number = 1,
    limit: number = 20,
    status?: OrderStatus,
  ): Promise<{ orders: Order[]; total: number; pages: number }> {
    const queryBuilder = this.ordersRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('order.payments', 'payments')
      .where('order.store_id = :storeId', { storeId })
      .orderBy('order.created_at', 'DESC');

    if (status) {
      queryBuilder.andWhere('order.status = :status', { status });
    }

    queryBuilder.skip((page - 1) * limit).take(limit);

    const [orders, total] = await queryBuilder.getManyAndCount();

    return {
      orders,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  async updateStatus(
    id: number,
    updateStatusDto: UpdateOrderStatusDto,
    userId?: number,
  ): Promise<Order> {
    const order = await this.findOne(id);

    // Check permissions
    if (userId && order.store.owner.user_id !== userId) {
      throw new ForbiddenException(
        'You can only update orders for your own store',
      );
    }

    // Validate status transition
    this.validateStatusTransition(order.status, updateStatusDto.status);

    // Update status with timestamps
    const updateData: Partial<Order> = {
      status: updateStatusDto.status,
    };

    switch (updateStatusDto.status) {
      case OrderStatus.CONFIRMED:
        updateData.confirmed_at = new Date();
        break;
      case OrderStatus.PREPARING:
        updateData.prepared_at = new Date();
        break;
      case OrderStatus.IN_TRANSIT:
        updateData.picked_up_at = new Date();
        updateData.driver_id = updateStatusDto.driver_id;
        break;
      case OrderStatus.DELIVERED:
        updateData.delivered_at = new Date();
        break;
      case OrderStatus.CANCELLED:
        updateData.cancelled_at = new Date();
        updateData.cancellation_reason = updateStatusDto.cancellation_reason;
        // Release reserved stock
        await this.releaseOrderStock(order);
        break;
    }

    await this.ordersRepository.update(id, updateData);
    return await this.findOne(id);
  }

  async cancelOrder(
    id: number,
    reason: string,
    userId?: number,
  ): Promise<Order> {
    const order = await this.findOne(id);

    // Check if cancellation is allowed
    if ([OrderStatus.DELIVERED, OrderStatus.CANCELLED].includes(order.status)) {
      throw new BadRequestException('Cannot cancel this order');
    }

    // Check permissions for customers (can only cancel their own orders)
    if (userId && order.user_id !== userId) {
      throw new ForbiddenException('You can only cancel your own orders');
    }

    return await this.updateStatus(id, {
      status: OrderStatus.CANCELLED,
      cancellation_reason: reason,
    });
  }

  async rateOrder(
    id: number,
    rateOrderDto: RateOrderDto,
    userId: number,
  ): Promise<Order> {
    const order = await this.findOne(id);

    if (order.user_id !== userId) {
      throw new ForbiddenException('You can only rate your own orders');
    }

    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException('You can only rate delivered orders');
    }

    await this.ordersRepository.update(id, {
      rating: rateOrderDto.rating,
      review: rateOrderDto.review,
    });

    return await this.findOne(id);
  }

  async getOrderStats(storeId?: number): Promise<any> {
    const queryBuilder = this.ordersRepository.createQueryBuilder('order');

    if (storeId) {
      queryBuilder.where('order.store_id = :storeId', { storeId });
    }

    const [
      totalOrders,
      pendingOrders,
      confirmedOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue,
    ] = await Promise.all([
      queryBuilder.getCount(),
      queryBuilder
        .clone()
        .andWhere('order.status = :status', { status: OrderStatus.PENDING })
        .getCount(),
      queryBuilder
        .clone()
        .andWhere('order.status = :status', { status: OrderStatus.CONFIRMED })
        .getCount(),
      queryBuilder
        .clone()
        .andWhere('order.status = :status', { status: OrderStatus.DELIVERED })
        .getCount(),
      queryBuilder
        .clone()
        .andWhere('order.status = :status', { status: OrderStatus.CANCELLED })
        .getCount(),
      queryBuilder
        .clone()
        .select('SUM(order.total_amount)', 'total')
        .andWhere('order.status = :status', { status: OrderStatus.DELIVERED })
        .getRawOne(),
    ]);

    return {
      total_orders: totalOrders,
      pending_orders: pendingOrders,
      confirmed_orders: confirmedOrders,
      delivered_orders: deliveredOrders,
      cancelled_orders: cancelledOrders,
      total_revenue: parseFloat(totalRevenue?.total || '0'),
      completion_rate:
        totalOrders > 0 ? (deliveredOrders / totalOrders) * 100 : 0,
      cancellation_rate:
        totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0,
    };
  }

  private async generateOrderNumber(): Promise<string> {
    const date = new Date();
    const prefix = `ORD${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}`;

    const lastOrder = await this.ordersRepository
      .createQueryBuilder('order')
      .where('order.order_number LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('order.order_number', 'DESC')
      .getOne();

    let sequence = 1;
    if (lastOrder) {
      const lastSequence = parseInt(lastOrder.order_number.slice(-4));
      sequence = lastSequence + 1;
    }

    return `${prefix}${sequence.toString().padStart(4, '0')}`;
  }

  private validateStatusTransition(
    currentStatus: OrderStatus,
    newStatus: OrderStatus,
  ): void {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
      [OrderStatus.PREPARING]: [
        OrderStatus.READY_FOR_PICKUP,
        OrderStatus.CANCELLED,
      ],
      [OrderStatus.READY_FOR_PICKUP]: [
        OrderStatus.IN_TRANSIT,
        OrderStatus.CANCELLED,
      ],
      [OrderStatus.IN_TRANSIT]: [OrderStatus.DELIVERED],
      [OrderStatus.DELIVERED]: [], // No transitions from delivered
      [OrderStatus.CANCELLED]: [], // No transitions from cancelled
      [OrderStatus.REFUNDED]: [], // No transitions from refunded
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
      );
    }
  }

  async remove(id: number): Promise<void> {
    const order = await this.findOne(id);

    if (
      ![OrderStatus.CANCELLED, OrderStatus.DELIVERED].includes(order.status)
    ) {
      throw new BadRequestException(
        'Can only delete cancelled or delivered orders',
      );
    }

    await this.ordersRepository.remove(order);
  }
}
