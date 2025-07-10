import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';
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

interface PaymentResponse {
  status: string;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface VerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    domain: string;
    status: string;
    reference: string;
    amount: number;
    gateway_response: string;
    created_at: string;
    channel: string;
    currency: string;
    fees: number;
    customer: {
      id: number;
      first_name: string | null;
      last_name: string | null;
      email: string;
      customer_code: string;
    };
    order_id: number | null;
    paidAt: string;
    createdAt: string;
    requested_amount: number;
    transaction_date: string;
  };
}

interface FetchTransactionResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    status: string;
    reference: string;
    receipt_number: string | null;
    amount: number;
    gateway_response: string;
    created_at: string;
    channel: string;
    currency: string;
    fees_split: any | null;
    authorization: {
      channel: string;
      card_type: string;
    };
    order_id: number | null;
    paidAt: string;
    createdAt: string;
    requested_amount: number;
  };
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
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
        // Clear authorization_url after completion as it's no longer needed
        payment.authorization_url = undefined;
        
        await this.paymentsRepository.save(payment);
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
