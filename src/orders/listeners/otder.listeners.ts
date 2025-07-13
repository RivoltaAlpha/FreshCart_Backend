import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DeliveriesService } from 'src/deliveries/deliveries.service';

@Injectable()
export class OrderEventListener {
  private readonly logger = new Logger(OrderEventListener.name);

  constructor(
    private readonly deliveriesService: DeliveriesService,
  ) {}

  @OnEvent('order.readyForPickup')
  async handleOrderReadyForPickup(payload: { orderId: number }) {
    this.logger.log(`Handling order ready for pickup event for order ${payload.orderId}`);

    try {
      // Create delivery workflow
      const deliveryResult = await this.deliveriesService.createDeliveryWorkflow(payload.orderId);

      this.logger.log(`Delivery workflow initiated for order ${payload.orderId}`, {
        delivery_id: deliveryResult.delivery?.delivery_id,
        driver_id: deliveryResult.driver?.id,
        estimated_delivery_time: deliveryResult.estimatedDeliveryTime,
      });

      this.logger.log(`Delivery reference ${deliveryResult.delivery?.delivery_id} updated for order ${payload.orderId}`);

    } catch (deliveryError) {
      this.logger.error(`Failed to initiate delivery for order ${payload.orderId}:`, deliveryError);
    }
  }
}