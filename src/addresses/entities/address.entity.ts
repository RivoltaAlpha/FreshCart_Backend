import { Profile } from 'src/profile/entities/profile.entity';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Address {
  @PrimaryGeneratedColumn()
  address_id: number;
  
  @Column({ type: 'int' })
  profile_id: number;

  @Column({ type: 'varchar', length: 100 })
  street?: string;

  @Column({ type: 'varchar', length: 100 })
  town: string;

  @Column({ type: 'varchar', length: 100 })
  county: string;

  @Column({ type: 'varchar', length: 20 })
  postal_code: string;

  @Column({ type: 'varchar', length: 100,   default: 'Kenya' })
  country: string;
  
  @Column({ type: 'enum', enum: ['home', 'work', 'other'], default: 'home' })
  type: string;
  
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

  @ManyToOne(() => Profile, (profile) => profile.addresses,{
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'profile_id'})
  profile: Profile;
}
