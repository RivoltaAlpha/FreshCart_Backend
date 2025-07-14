import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DeliveriesService } from '../deliveries.service';
import { PaymentCompletedEvent, PaymentFailedEvent } from 'src/payments/events/payment.event';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from 'src/payments/entities/payment.entity';

@Injectable()
export class PaymentEventListener {
  private readonly logger = new Logger(PaymentEventListener.name);

  constructor(
    private readonly deliveriesService: DeliveriesService,
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
  ) {}

  @OnEvent('payment.completed')
  async handlePaymentCompleted(event: PaymentCompletedEvent) {
    this.logger.log(`Handling payment completed event for order ${event.orderId}`);

    try {
      // Create delivery workflow
      const deliveryResult = await this.deliveriesService.createDeliveryWorkflow(event.orderId);

      this.logger.log(`Delivery workflow initiated for order ${event.orderId}`, {
        delivery_id: deliveryResult.delivery?.delivery_id,
        driver_id: deliveryResult.driver?.id,
        estimated_delivery_time: deliveryResult.estimatedDeliveryTime,
      });

      // Update payment record with delivery info
      await this.paymentsRepository.update(event.paymentId, {
        delivery_initiated: true,
        delivery_reference: deliveryResult.delivery?.delivery_id,
      });

      this.logger.log(`Payment ${event.paymentId} updated with delivery reference ${deliveryResult.delivery?.delivery_id}`);

    } catch (deliveryError) {
      this.logger.error(`Failed to initiate delivery for order ${event.orderId}:`, deliveryError);

      // Update payment record with error info
      await this.paymentsRepository.update(event.paymentId, {
        delivery_initiated: false,
        delivery_error: deliveryError.message,
      });
    }
  }

  @OnEvent('payment.failed')
  async handlePaymentFailed(event: PaymentFailedEvent) {
    this.logger.log(`Handling payment failed event for order ${event.orderId}`);
    
    // Handle payment failure logic here if needed
    // For example, restore inventory, send notification emails, etc.
  }
}