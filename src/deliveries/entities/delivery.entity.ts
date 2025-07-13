import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Order } from 'src/orders/entities/order.entity';
import { User } from 'src/users/entities/user.entity';
import { Store } from 'src/store/entities/store.entity';

export enum DeliveryStatus {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

@Entity()
export class Delivery {
  @PrimaryGeneratedColumn()
  delivery_id: number;

  @Column()
  order_id: number;

  @Column()
  driver_id: number;

  @Column()
  user_id: number;

  @Column()
  store_id: number;

  @Column({ type: 'varchar', length: 500 })
  delivery_address: string;

  @Column({ type: 'enum', enum: DeliveryStatus, default: DeliveryStatus.PENDING })
  delivery_status: DeliveryStatus;

  @Column({ type: 'timestamp', nullable: true })
  estimated_delivery_time?: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  delivery_fee: number;

  @Column({ type: 'int', nullable: true })
  route_distance?: number; // in meters

  @Column({ type: 'int', nullable: true })
  route_duration?: number; // in seconds

  @Column({ type: 'text', nullable: true })
  route_coordinates?: string; // JSON string

  @Column({ type: 'text', nullable: true })
  route_geometry?: string; // JSON string

  @Column({ type: 'timestamp', nullable: true })
  delivered_at?: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  // Relationships
  @ManyToOne(() => Order)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'driver_id' })
  driver: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Store)
  @JoinColumn({ name: 'store_id' })
  store: Store;
}