import { Category } from 'src/categories/entities/category.entity';
import { Inventory } from 'src/inventories/entities/inventory.entity';
import { Order } from 'src/orders/entities/order.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  product_id: number;

  @Column({ type: 'int' })
  category_id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'varchar', length: 255 })
  stock_quantity: number;

  @Column({ type: 'varchar', length: 255 })
  image_url?: string;

  @Column({ type: 'decimal', precision: 8, scale: 3, nullable: true })
  weight?: number; // in kg

  @Column({ type: 'varchar', length: 50, nullable: true })
  unit: string; // per kg, per piece, per liter, etc.

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ type: 'int', default: 0 })
  review_count: number;

  @Column({ type: 'int', default: 0 })
  discount: number;

  @Column({ type: 'date', nullable: true })
  expiry_date?: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @ManyToOne(() => Category, (category) => category.products, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @ManyToMany(() => Order, (order) => order.products)
  orders: Relation<Order[]>;

  
  @ManyToMany(() => Inventory, (inventory) => inventory.products)
  inventory: Inventory[];

  // Helper method to get stores that sell this product
  getStores?(): Promise<any[]> {
    return Promise.resolve([]);
  }
}
