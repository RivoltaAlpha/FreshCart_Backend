import { Category } from 'src/categories/entities/category.entity';
import { Inventory } from 'src/inventories/entities/inventory.entity';
import { Order } from 'src/orders/entities/order.entity';
import { Column, Entity, JoinColumn, ManyToMany, ManyToOne, PrimaryGeneratedColumn, Relation } from 'typeorm';

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  product_id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'varchar', length: 255 })
  stock_quantity: number;

  @Column({ type: 'varchar', length: 255 })
  image_url: string;

  @Column({ type: 'varchar', length: 255 })
  store_id: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

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

  @ManyToOne(() => Inventory, (inventory) => inventory.product)
  inventories: Inventory[];

  @ManyToMany(() => Order, (order) => order.products)
  orders: Relation<Order[]>;
}
