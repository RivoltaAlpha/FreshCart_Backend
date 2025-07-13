import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Order } from 'src/orders/entities/order.entity';
import { User } from 'src/users/entities/user.entity';

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

export enum PaymentMethod {
  CARD = 'card',
  MOBILE_MONEY = 'mobile_money',
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer',
}

export enum PaymentGateway {
  STRIPE = 'stripe',
  PAYSTACK = 'paystack',
  MPESA = 'mpesa',
  PAYPAL = 'paypal',
  FLUTTERWAVE = 'flutterwave',
  CASH = 'cash',
}

@Entity()
export class Payment {
  @PrimaryGeneratedColumn()
  payment_id: number;

  @Column({ type: 'varchar', length: 20, unique: true })
  payment_number: string;

  @Column({ type: 'int' })
  order_id: number;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ nullable: true })
  authorization_url?: string;

  @Column({ type: 'int' })
  user_id: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 3, default: 'KES' })
  currency: string;

  @Column({ type: 'enum', enum: PaymentMethod })
  payment_method: PaymentMethod;

  @Column({ type: 'enum', enum: PaymentGateway })
  gateway: PaymentGateway;

  @Column({ type: 'varchar', length: 255, unique: true })
  payment_reference: string;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  transaction_id?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  gateway_reference?: string;

  @Column({ type: 'json', nullable: true })
  gateway_response?: any;

  @Column({ type: 'text', nullable: true })
  failure_reason?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  refunded_amount: number;

  @Column({
    type: 'timestamp',
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP',
  })
  processed_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  failed_at?: Date;

  @Column({ type: 'boolean', default: false })
  delivery_initiated: boolean;

  @Column({ type: 'int', nullable: true })
  delivery_reference?: number;

  @Column({ type: 'text', nullable: true })
  delivery_error?: string;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updated_at: Date;

  @ManyToOne(() => Order, (order) => order.payments)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}

export interface PaymentCompletedEvent {
  orderId: number;
  paymentId: number;
  userId: number;
  completed_at: Date;
}

export interface PaymentFailedEvent {
  orderId: number;
  paymentId: number;
  userId: number;
  failure_reason: string;
  failed_at: Date;
}