import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';


@Entity()
export class Transfer {
  @PrimaryGeneratedColumn()
  transfer_id: number;

  @Column()
  amount: number;

  @Column()
  currency: 'KES';

  @Column()
  recipient_type: 'store' | 'driver';

  @Column()
  recipient_id: string;

  @Column()
  recipient_name: string;

  @Column()
  recipient_account: string;

  @Column()
  recipient_bank_code: string;

  @Column({ nullable: true })
  reference: string;

  @Column({ nullable: true })
  status: 'pending' | 'success' | 'failed';

  @Column({ nullable: true })
  reason: string;

  @Column({ nullable: true })
  order_id: number;

  @Column({ nullable: true })
  delivery_id: number;

  @CreateDateColumn()
  created_at: Date;
}