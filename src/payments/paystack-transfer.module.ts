import { Module } from '@nestjs/common';
import { PaystackTransferService } from './paystack-transfer.service';
import { PaystackTransferController } from './paystack-transfer.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Delivery } from 'src/deliveries/entities/delivery.entity';
import { User } from 'src/users/entities/user.entity';
import { Store } from 'src/store/entities/store.entity';
import { Payment } from './entities/payment.entity';
import { Profile } from 'src/profile/entities/profile.entity';
import { Address } from 'src/addresses/entities/address.entity';
import { Order } from 'src/orders/entities/order.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Delivery,
      User,
      Store,
      Payment,
      Profile,
      Address,
      Order,
    ]),
    PaystackTransferModule, // <-- Import here
  ],
  controllers: [PaystackTransferController],
  providers: [PaystackTransferService],
  exports: [PaystackTransferService],
})
export class PaystackTransferModule {}
