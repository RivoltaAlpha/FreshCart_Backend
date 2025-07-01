import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { OrderStatus } from "../dto/create-order.dto";

@Entity()
export class Order {
  @PrimaryGeneratedColumn()
  order_id: number;

  @Column({ type: 'int' })
  user_id: number;

  @Column({ type: 'int' })
  store_id: number;

  @Column({ type: 'enum', enum: OrderStatus })
  status: OrderStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total_amount: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'varchar', length: 255 })
  delivery_address: string;
}
