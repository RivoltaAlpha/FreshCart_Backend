import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import {
  CreatePaymentDto,
  FetchTransactionResponse,
  VerifyResponse,
} from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Payment,
  PaymentMethod,
  PaymentStatus,
  PaymentGateway,
} from './entities/payment.entity';
import axios from 'axios';
import { OrdersService } from 'src/orders/orders.service';
import { Order, OrderStatus } from 'src/orders/entities/order.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    private ordersService: OrdersService,
    // private eventEmitter: EventEmitter2,
  ) {}

  async initializePayment(createPaymentDto: CreatePaymentDto) {
    try {
      const paymentReference = `PAY_${Date.now()}_${createPaymentDto.user_id}`;

      const payload = {
        email: createPaymentDto.email,
        amount: Math.round(createPaymentDto.amount * 100), // Convert KES to cents
        currency: 'KES', // Specify Kenyan Shillings
        callback_url: createPaymentDto.callback_url,
        reference: paymentReference,
        metadata: {
          user_id: createPaymentDto.user_id,
          order_id: createPaymentDto.order_id,
          custom_fields: [
            {
              display_name: 'Order ID',
              variable_name: 'order_id',
              value: createPaymentDto.order_id,
            },
          ],
        },
      };

      const response = await axios.post(
        'https://api.paystack.co/transaction/initialize',
        payload,
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.data.status) {
        throw new BadRequestException(
          'Failed to initialize payment with Paystack',
        );
      }

      const paymentNumber = await this.generatePaymentNumber();

      const payment = this.paymentsRepository.create({
        user_id: createPaymentDto.user_id,
        payment_number: paymentNumber,
        order_id: createPaymentDto.order_id,
        email: createPaymentDto.email,
        amount: createPaymentDto.amount,
        currency: 'KES',
        payment_method: PaymentMethod.CARD,
        gateway: PaymentGateway.PAYSTACK, // Fixed: was MPESA, should be PAYSTACK
        status: PaymentStatus.PENDING,
        transaction_id: response.data.data.reference,
        payment_reference: response.data.data.reference, // Add this line
        authorization_url: response.data.data.authorization_url,
      });

      const savedPayment = await this.paymentsRepository.save(payment);

      return {
        authorization_url: response.data.data.authorization_url,
        payment_reference: response.data.data.reference,
        payment_id: savedPayment.payment_id,
        access_code: response.data.data.access_code,
        amount: createPaymentDto.amount,
        currency: 'KES',
      };
    } catch (error) {
      this.logger.error('Error initializing payment', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to initialize payment');
    }
  }

  async verifyTransaction(reference: string): Promise<VerifyResponse> {
    try {
      const response = await axios.get(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          },
        },
      );

      if (!response.data.status) {
        throw new BadRequestException('Transaction verification failed');
      }

      // Update payment status in database
      const payment = await this.paymentsRepository.findOne({
        where: { payment_reference: reference },
      });

      if (payment) {
        const transactionData = response.data.data;

        payment.status =
          transactionData.status === 'success'
            ? PaymentStatus.COMPLETED
            : PaymentStatus.FAILED;

        // Store only essential gateway response data
        payment.gateway_response = {
          status: transactionData.status,
          gateway_response: transactionData.gateway_response,
          channel: transactionData.channel,
          fees: transactionData.fees,
          paid_at: transactionData.paid_at,
          receipt_number: transactionData.receipt_number,
        };

        if (transactionData.status !== 'success') {
          payment.failed_at = new Date();
          payment.failure_reason = transactionData.gateway_response;
        }

        // Only confirm order if payment was just completed (not already completed)
        if (
          payment.status === PaymentStatus.COMPLETED &&
          transactionData.status === 'success'
        ) {
          // Check if order is not already confirmed before attempting to confirm
          const order = await this.ordersRepository.findOne({
            where: { order_id: payment.order_id },
          });

          // get order delivery address
         const deliveryAddress = order?.delivery_address;
          
          if (order && order.status !== OrderStatus.CONFIRMED) {
            await this.ordersService.confirmOrderAfterPayment(payment.order_id);
          }
        }
        // Clear authorization_url after completion as it's no longer needed
        payment.authorization_url = undefined;
        
        await this.paymentsRepository.save(payment);
        
        // // Only emit after save is complete
        // if (
        //   payment.status === PaymentStatus.COMPLETED &&
        //   transactionData.status === 'success'
        // ) {
        //   // ... emit event ...
        //   this.eventEmitter.emit('payment.completed', {
        //     orderId: payment.order_id,
        //     paymentId: payment.payment_id,
        //     userId: payment.user_id,
        //     amount: payment.amount,
        //     currency: payment.currency,
        //     transactionId: payment.transaction_id,
        //     paymentReference: payment.payment_reference,
        //     completed_at: new Date(),
        //   });

        //   this.logger.log(
        //     `Payment completed event emitted for order ${payment.order_id}`,
        //   );
        // }
      }

      return response.data;
    } catch (error) {
      this.logger.error('Error verifying transaction', error);
      throw new BadRequestException('Failed to verify transaction');
    }
  }

  async fetchTransaction(
    transactionId: string,
  ): Promise<FetchTransactionResponse> {
    try {
      const response = await axios.get(
        `https://api.paystack.co/transaction/${transactionId}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          },
        },
      );

      if (!response.data.status) {
        throw new BadRequestException('Failed to fetch transaction');
      }

      return response.data;
    } catch (error) {
      this.logger.error('Error fetching transaction', error);
      throw new BadRequestException('Failed to fetch transaction');
    }
  }

  create(createPaymentDto: CreatePaymentDto) {
    const payment = this.paymentsRepository.create({
      ...createPaymentDto,
      payment_method: createPaymentDto.payment_method as PaymentMethod,
    });
    return this.paymentsRepository.save(payment);
  }

  findAll() {
    return this.paymentsRepository.find();
  }

  findOne(payment_id: number) {
    return this.paymentsRepository.findOne({ where: { payment_id } });
  }

  update(payment_id: number, updatePaymentDto: UpdatePaymentDto) {
    // Ensure payment_method is cast to PaymentMethod enum if present
    const updateData: any = { ...updatePaymentDto };
    if (updatePaymentDto.payment_method) {
      updateData.payment_method =
        updatePaymentDto.payment_method as PaymentMethod;
    }
    return this.paymentsRepository.update(payment_id, updateData);
  }

  remove(payment_id: number) {
    return this.paymentsRepository.delete(payment_id);
  }

  private async generatePaymentNumber(): Promise<string> {
    const date = new Date();
    const prefix = `PAY${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}`;

    const lastPayment = await this.paymentsRepository
      .createQueryBuilder('payment')
      .where('payment.payment_number LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('payment.payment_number', 'DESC')
      .getOne();

    let sequence = 1;
    if (lastPayment) {
      const lastSequence = parseInt(lastPayment.payment_number.slice(-4));
      sequence = lastSequence + 1;
    }

    return `${prefix}${sequence.toString().padStart(4, '0')}`;
  }
}

export type { VerifyResponse, FetchTransactionResponse };
