import { Feedback } from 'src/feedback/entities/feedback.entity';
import { Order } from 'src/orders/entities/order.entity';
import { Payment } from 'src/payments/entities/payment.entity';
import { Profile } from 'src/profile/entities/profile.entity';
import { Store } from 'src/store/entities/store.entity';
import { Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

export enum Role {
  Admin = 'Admin',
  Customer = 'Customer',
  Store = 'Store',
  Driver = 'Driver',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  user_id: number;

  @Column({ type: 'int', unique: true })
  profile_id: number;

  @Column({ unique: true, type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ type: 'enum', enum: Role })
  role: Role;

  @Column({ type: 'varchar', length: 255, nullable: true })
  hashedRefreshToken?: string | null;

  @Column({ type: 'boolean', default: true })
  is_active?: boolean;

  @Column({ type: 'boolean', default: true })
  is_available?: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updated_at: Date;

  @OneToMany(() => Order, (order) => order.user, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  orders: Order[];

  @OneToOne(() => Profile, (profile) => profile.user)
  @JoinColumn({ name: 'profile_id'})
  profile: Profile;

  @OneToMany(() => Store, (store) => store.owner, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  stores: Store[];

  @OneToMany(() => Payment, (payment) => payment.user, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  payments: Payment[];

  // feedback
  @OneToMany(() => Feedback, (feedback) => feedback.user, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  feedbacks: Feedback[];
}
