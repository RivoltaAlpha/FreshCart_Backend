import { Address } from 'src/addresses/entities/address.entity';
import { Inventory } from 'src/inventories/entities/inventory.entity';
import { Order } from 'src/orders/entities/order.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Store {
  @PrimaryGeneratedColumn()
  store_id: number;

  @Column({ type: 'int', unique: true })
  owner_id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  description: string;

  @Column({ type: 'varchar', length: 255 })
  contact_info: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  image_url?: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating?: number;

  @Column({ type: 'int', default: 0 })
  total_reviews?: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  store_code: string;

  @Column({ type: 'int', default: 0 })
  delivery_fee: number;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'boolean', default: false })
  is_verified: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updated_at: Date;

  @ManyToOne(() => User, (user) => user.stores)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @OneToMany(() => Order, (order) => order.store)
  orders: Order[];

  @OneToMany(() => Inventory, (inventory) => inventory.store)
  inventories: Inventory[];

  getProducts?(): Promise<any[]> {
    return Promise.resolve([]);
  }
  @OneToOne(() => Address, (address) => address.store, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'address_id' })
  address?: Address;
}
