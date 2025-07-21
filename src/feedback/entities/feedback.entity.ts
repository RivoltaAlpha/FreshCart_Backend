import { Order } from "src/orders/entities/order.entity";
import { User } from "src/users/entities/user.entity";
import { Column, JoinColumn, ManyToOne, OneToMany } from "typeorm";

export class Feedback {

    @Column({ type: 'int', primary: true, generated: true })
    feedback_id: number;

    @Column({ type: 'text' })
    comment: string;

    @Column({ type: 'int' })
    rating: number;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updated_at: Date;

    // relationships
    @ManyToOne(() => User, user => user.feedbacks)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => Order, order => order.feedbacks)
    @JoinColumn({ name: 'order_id' })
    order: Order;


}
