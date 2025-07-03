import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Cart {
    @PrimaryGeneratedColumn()
    cart_id: number;

    @Column({type: 'int'})
    user_id: number;

    @Column({type: 'int'})
    product_id: number;

    @Column({type: 'int'})
    quantity: number;
}
