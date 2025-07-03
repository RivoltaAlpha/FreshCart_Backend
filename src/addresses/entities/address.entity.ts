import { Profile } from 'src/profile/entities/profile.entity';
import { Column, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

export class Address {
  @PrimaryGeneratedColumn()
  address_id: number;

  @Column({ type: 'varchar', length: 100 })
  street: string;

  @Column({ type: 'varchar', length: 100 })
  city: string;

  @Column({ type: 'varchar', length: 100 })
  state: string;

  @Column({ type: 'varchar', length: 20 })
  postal_code: string;

  @Column({ type: 'varchar', length: 100 })
  country: string;
  
  @Column({ type: 'enum', enum: ['home', 'work', 'other'], default: 'home' })
  type: string;
  
  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude?: number | null;
  
  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude?: number | null;
  
  @Column({ type: 'boolean', default: false })
  isDefault: boolean;
  
    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  profileId: number;
  @ManyToOne(() => Profile, (profile) => profile.addresses)
  @JoinColumn({ name: 'profile_id', referencedColumnName: 'profile_id' })
  profile: Profile;
}
