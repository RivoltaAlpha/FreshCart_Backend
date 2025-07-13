import { Profile } from 'src/profile/entities/profile.entity';
import { Store } from 'src/store/entities/store.entity';
import {
  Column,
  Entity,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Address {
  @PrimaryGeneratedColumn()
  address_id: number;

  @Column({ type: 'varchar', length: 100 })
  area: string;

  @Column({ type: 'varchar', length: 100 })
  town: string;

  @Column({ type: 'varchar', length: 100 })
  county: string;

  @Column({ type: 'varchar', length: 100, default: 'Kenya' })
  country?: string;

  @Column({ type: 'enum', enum: ['home', 'work', 'store'], default: 'home' })
  type?: string;

  @Column({ type: 'float', nullable: true })
  latitude?: number;

  @Column({ type: 'float', nullable: true })
  longitude?: number;

  @Column({ type: 'boolean', default: false })
  isDefault: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updated_at: Date;

  @ManyToOne(() => Profile, (profile) => profile.addresses, {
    onDelete: 'CASCADE',
  })
  profile: Profile;

  @OneToOne(() => Store, (store) => store.address, {
    nullable: true,
  })
  store?: Store;
}
