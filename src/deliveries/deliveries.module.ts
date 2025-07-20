import { Module } from '@nestjs/common';
import { DeliveriesService } from './deliveries.service';
import { DeliveriesController } from './deliveries.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Delivery } from './entities/delivery.entity';
import { User } from 'src/users/entities/user.entity';
import { Store } from 'src/store/entities/store.entity';
import { Payment } from 'src/payments/entities/payment.entity';
import { Profile } from 'src/profile/entities/profile.entity';
import { Address } from 'src/addresses/entities/address.entity';
import { Order } from 'src/orders/entities/order.entity';
import { PaymentEventListener } from './listeners/payment.listeners';
import { OrderEventListener } from 'src/orders/listeners/otder.listeners';
import { PaystackTransferService } from 'src/payments/paystack-transfer.service';

@Module({
  imports: [TypeOrmModule.forFeature([Delivery, User, Store, Payment, Profile, Address, Order])],
  controllers: [DeliveriesController],
  providers: [DeliveriesService, PaymentEventListener, OrderEventListener, PaystackTransferService], // <-- Add here
  exports: [DeliveriesService, PaystackTransferService],
})
export class DeliveriesModule {}
