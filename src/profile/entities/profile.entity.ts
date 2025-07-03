import { Address } from 'src/addresses/entities/address.entity';
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Profile {
  @PrimaryGeneratedColumn()
  profile_id: number;

  @Column({ type: 'varchar', length: 255 })
  first_name: string;

  @Column({ type: 'varchar', length: 255 })
  last_name: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone_number?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  town?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  county?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  country?: string | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

    @OneToOne(() => User, (user) => user.profile, {
        cascade: true,
        onDelete: 'CASCADE',
    })
    user: User;

    @OneToMany(() => Address, (address) => address.profile, {
        cascade: true,
        onDelete: 'CASCADE',
    })
    addresses: Address[];
}
