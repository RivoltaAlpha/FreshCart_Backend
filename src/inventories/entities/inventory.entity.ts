import { Product } from 'src/products/entities/product.entity';
import { Store } from 'src/store/entities/store.entity';
import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum InventoryAction {
  RESTOCK = 'restock',
  SALE = 'sale',
  ADJUSTMENT = 'adjustment',
  EXPIRED = 'expired',
  DAMAGED = 'damaged',
}

@Entity()
export class Inventory {
  @PrimaryGeneratedColumn()
  inventory_id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'int' })
  store_id: number;

  @Column({ type: 'int', default: 0 })
  stock_qty: number;

  @Column({ type: 'int', default: 0 })
  quantity_reserved: number;

  @Column({ type: 'int', default: 5 })
  reorder_level: number; 

  @Column({ type: 'int', default: 100 })
  max_stock_level: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  cost_price?: number; 

  @Column({ type: 'date', nullable: true })
  last_restocked?: Date;

  @Column({
    type: 'enum',
    enum: InventoryAction,
    default: InventoryAction.RESTOCK,
  })
  last_action: InventoryAction;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;


  @ManyToMany(() => Product, (product) => product.inventory)
  @JoinTable({
    name: 'inventory_products',
    joinColumn: {
      name: 'inventory_id',
      referencedColumnName: 'inventory_id',
    },
    inverseJoinColumn: {
      name: 'product_id',
      referencedColumnName: 'product_id',
    },
  })
  products: Product[];

  @ManyToOne(() => Store, (store) => store.inventories, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'store_id' })
  store: Store;

  // Computed properties
  get total_quantity(): number {
    return this.stock_qty + this.quantity_reserved;
  }

  get is_low_stock(): boolean {
    return this.stock_qty <= this.reorder_level;
  }

  get is_out_of_stock(): boolean {
    return this.stock_qty === 0;
  }
}
