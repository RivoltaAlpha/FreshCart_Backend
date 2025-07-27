import { OnEvent } from '@nestjs/event-emitter';
import { Injectable, Logger } from '@nestjs/common';

import {
  OrderPaymentTransferEvent,
  TransfersService,
} from 'src/transfers/transfers.service';

export interface PaymentTransferOrderEvent {
  order_id: number;
  delivery_id?: number;
  store_id: number;
  driver_id: number;
  store_amount: number;
  driver_amount: number;
}

@Injectable()
export class TransfersListener {
  constructor(
    private readonly logger = new Logger(TransfersListener.name),
    private readonly transfersService: TransfersService,
  ) {}

  @OnEvent('order.payment.transfer')
  async handleOrderPaymentTransfer(payload: OrderPaymentTransferEvent) {
    try {
      this.logger.log(
        `Processing payment transfer for order ${payload.order_id}`,
      );

      // Get store and driver details
      const storeData = await this.transfersService.getStorePaymentDetails(
        payload.store_id,
      );
      const driverData = await this.transfersService.getDriverPaymentDetails(
        payload.driver_id,
      );

      // Process the payments
      await this.transfersService.processDeliveryPayments({
        orderId: payload.order_id,
        delivery_id: payload.delivery_id,
        store: {
          id: payload.store_id,
          email: storeData.email,
          account_number: storeData.account_number,
          amount: payload.store_amount,
          participantType: 'store',
        },
        driver: {
          id: payload.driver_id,
          name: driverData.name,
          account_number: driverData.account_number,
          amount: payload.driver_amount,
          participantType: 'driver',
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to process payment transfer for order ${payload.order_id}:`,
        error,
      );
      // You might want to emit a failure event or update order status
      throw error;
    }
  }
}
