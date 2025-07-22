import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Product } from 'src/products/entities/product.entity';
import { Store } from 'src/store/entities/store.entity';
import { Payment } from 'src/payments/entities/payment.entity';
import { OrderItem } from 'src/order-item/entities/order-item.entity';
import { Feedback } from 'src/feedback/entities/feedback.entity';

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  READY_FOR_PICKUP = 'ready_for_pickup',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum DeliveryMethod {
  PICKUP = 'pickup',
  STANDARD_DELIVERY = 'standard_delivery',
  EXPRESS_DELIVERY = 'express_delivery',
}

@Entity()
export class Order {
  @PrimaryGeneratedColumn()
  order_id: number;

  @Column({ type: 'varchar', length: 20, unique: true })
  order_number: string;

  @Column({ type: 'int' })
  user_id: number;

  @Column({ type: 'int' })
  store_id: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  delivery_fee: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount_amount: number;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column({
    type: 'enum',
    enum: DeliveryMethod,
    default: DeliveryMethod.STANDARD_DELIVERY,
  })
  delivery_method: DeliveryMethod;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total_amount: number;

  @Column({ type: 'int', nullable: true })
  estimated_delivery_time?: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'varchar', length: 255 })
  delivery_address: string;

  @Column({ type: 'text', nullable: true })
  tax_amount: number

  @Column({ type: 'int', nullable: true })
  driver_id?: number;

  @Column({ type: 'timestamp', nullable: true })
  confirmed_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  prepared_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  finished_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  picked_up_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  delivered_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  cancelled_at?: Date;

  @Column({ type: 'text', nullable: true })
  cancellation_reason?: string;

  @Column({ type: 'text', nullable: true })
  review?: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  rating?: number;

  @ManyToOne(() => User, (user) => user.orders)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToMany(() => Product, (product) => product.orders)
  @JoinTable({
    name: 'order_items',
    joinColumn: { name: 'order_id', referencedColumnName: 'order_id' },
    inverseJoinColumn: {
      name: 'product_id',
      referencedColumnName: 'product_id',
    },
  })
  products: Product[];

  @ManyToOne(() => Store, (store) => store.orders)
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @OneToMany(() => Payment, (payment) => payment.order)
  payments: Payment[];

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'driver_id' })
  driver?: User;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  items: OrderItem[];

  @OneToMany(() => Feedback, (feedback) => feedback.order)
  feedbacks: Feedback[];
}
