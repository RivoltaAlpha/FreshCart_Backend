import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { Transfer } from './entities/transfer.entity';
import { Store } from 'src/store/entities/store.entity';
import { User } from 'src/users/entities/user.entity';

// DTOs for type safety
export class CreateTransferRecipientDto {
  type: 'mobile_money';
  name: string;
  account_number: string;
  bank_code: 'MPesa'; // Correct bank code for M-Pesa Kenya
  currency?: 'KES';
  authorization_code?: string;
  metadata?: Record<string, any>;
}

export class BulkTransferDto {
  currency: string;
  source: 'balance';
  transfers: {
    amount: number;
    recipient: string;
    reference?: string;
    reason?: string;
  }[];
}

// Event payload interface
export interface OrderPaymentTransferEvent {
  order_id: number;
  delivery_id: number;
  store_id: number;
  driver_id: number;
  store_amount: number;
  driver_amount: number;
}

// Payment participant interface
export interface PaymentParticipant {
  id: string;
  name: string;
  account_number: string;
  amount: number;
  participantType: 'store' | 'driver';
}

// Response interfaces
export interface PaystackResponse<T = any> {
  status: boolean;
  message: string;
  data: T;
}

export interface TransferRecipient {
  id: number;
  domain: string;
  type: string;
  currency: string;
  name: string;
  details: {
    authorization_code?: string;
    account_number: string;
    account_name: string;
    bank_code: string;
    bank_name: string;
  };
  metadata: Record<string, any>;
  recipient_code: string;
  active: boolean;
  email: string;
  description: string;
  created_at: string;
  updated_at: string;
}

@Injectable()
export class TransfersService {
  private readonly logger = new Logger(TransfersService.name);
  private readonly baseUrl = 'https://api.paystack.co';
  private readonly secretKey: string;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Transfer)
    private readonly transferRepository: Repository<Transfer>,
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    const key = this.configService.get<string>('PAYSTACK_SECRET_KEY');
    if (!key) {
      throw new Error('PAYSTACK_SECRET_KEY is not configured');
    }
    this.secretKey = key;
  }

  private get headers() {
    return {
      Authorization: `Bearer ${this.secretKey}`,
      'Content-Type': 'application/json',
    };
  }

  private async saveTransferRecord(
    participant: PaymentParticipant,
    reference: string,
    order_id: number,
    delivery_id: number,
    status: 'pending' | 'success' | 'failed' = 'pending',
  ): Promise<Transfer> {
    const transfer = this.transferRepository.create({
      amount: participant.amount,
      currency: 'KES',
      recipient_type: participant.participantType,
      recipient_id: participant.id,
      recipient_name: participant.name,
      recipient_account: participant.account_number,
      recipient_bank_code: 'MPesa',
      reference: reference,
      status: status,
      reason: `${participant.participantType === 'store' ? 'Store' : 'Driver'} payment for order ${order_id}`,
      order_id: order_id,
      delivery_id: delivery_id,
    });

    return await this.transferRepository.save(transfer);
  }

  async updateTransferStatus(
    reference: string,
    status: 'pending' | 'success' | 'failed',
  ): Promise<void> {
    await this.transferRepository.update({ reference }, { status });
  }

  private async createTransferRecipients(
    store: PaymentParticipant,
    driver: PaymentParticipant,
    order_id: number,
    delivery_id: number,
  ): Promise<{ storeRecipientCode: string; driverRecipientCode: string }> {
    try {
      const recipientsData = {
        batch: [
          {
            type: 'mobile_money' as const,
            name: store.name,
            account_number: store.account_number,
            bank_code: 'MPesa' as const,
            currency: 'KES' as const,
            metadata: {
              order_id: order_id,
              delivery_id: delivery_id,
              recipient_type: 'store',
              recipient_id: store.id,
              phone_number: store.account_number,
            },
          },
          {
            type: 'mobile_money' as const,
            name: driver.name,
            account_number: driver.account_number,
            bank_code: 'MPesa' as const,
            currency: 'KES' as const,
            metadata: {
              order_id: order_id,
              delivery_id: delivery_id,
              recipient_type: 'driver',
              recipient_id: driver.id,
              phone_number: driver.account_number,
            },
          },
        ],
      };

      const response = await axios.post(
        `${this.baseUrl}/transferrecipient/bulk`,
        recipientsData,
        { headers: this.headers },
      );

      const result: PaystackResponse<{
        success: TransferRecipient[];
        errors: any[];
      }> = response.data;

      if (!result.status) {
        throw new HttpException(
          result.message || 'Failed to create transfer recipients',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Handle any errors in recipient creation
      if (result.data.errors?.length > 0) {
        this.logger.warn(
          'Some recipients failed to create:',
          result.data.errors,
        );
      }

      const successfulRecipients = result.data.success;
      if (successfulRecipients.length < 2) {
        throw new HttpException(
          `Only ${successfulRecipients.length} recipients created successfully. Need 2.`,
          HttpStatus.BAD_REQUEST,
        );
      }

      // Find store and driver recipients based on metadata
      const storeRecipient = successfulRecipients.find(
        (r) => r.metadata.recipient_type === 'store',
      );
      const driverRecipient = successfulRecipients.find(
        (r) => r.metadata.recipient_type === 'driver',
      );

      if (!storeRecipient || !driverRecipient) {
        throw new HttpException(
          'Could not identify store and driver recipients',
          HttpStatus.BAD_REQUEST,
        );
      }

      this.logger.log(
        `Transfer recipients created - Store: ${storeRecipient.recipient_code}, Driver: ${driverRecipient.recipient_code}`,
      );

      return {
        storeRecipientCode: storeRecipient.recipient_code,
        driverRecipientCode: driverRecipient.recipient_code,
      };
    } catch (error) {
      this.logger.error(
        'Error creating transfer recipients:',
        JSON.stringify(error.response?.data, null, 2) || error.message,
      );
      throw new HttpException(
        error.response?.data?.message || 'Failed to create transfer recipients',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async executeBulkTransfer(
    storeRecipientCode: string,
    driverRecipientCode: string,
    store: PaymentParticipant,
    driver: PaymentParticipant,
    order_id: number,
  ): Promise<{
    transfers: any;
    references: { store: string; driver: string };
  }> {
    try {
      // Generate unique references with timestamp
      const timestamp = Date.now();
      const storeReference = `store_${order_id}_${timestamp}`;
      const driverReference = `driver_${order_id}_${timestamp + 1}`; // Ensure uniqueness

      const bulkTransferData = {
        currency: 'KES',
        source: 'balance' as const,
        transfers: [
          {
            amount: Math.round(store.amount * 100), // Convert to cents and ensure integer
            recipient: storeRecipientCode,
            reason: `Store payment for order ${order_id}`,
            reference: storeReference,
          },
          {
            amount: Math.round(driver.amount * 100), // Convert to cents and ensure integer
            recipient: driverRecipientCode,
            reason: `Driver payment for order ${order_id}`,
            reference: driverReference,
          },
        ],
      };

      const response = await axios.post(
        `${this.baseUrl}/transfer/bulk`,
        bulkTransferData,
        { headers: this.headers },
      );

      const result: PaystackResponse = response.data;

      if (!result.status) {
        throw new HttpException(
          result.message || 'Failed to initiate bulk transfer',
          HttpStatus.BAD_REQUEST,
        );
      }

      this.logger.log(
        `Bulk transfer initiated for order ${order_id} - ${bulkTransferData.transfers.length} transfers`,
      );

      return {
        transfers: result.data,
        references: {
          store: storeReference,
          driver: driverReference,
        },
      };
    } catch (error) {
      this.logger.error(
        'Error creating transfer recipients:',
        JSON.stringify(error.response?.data, null, 2) || error.message,
      );
      throw new HttpException(
        error.response?.data?.message || 'Failed to execute bulk transfer',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async processDeliveryPayments(paymentRequest: {
    order_id: number;
    delivery_id: number;
    store: PaymentParticipant;
    driver: PaymentParticipant;
  }): Promise<{
    success: boolean;
    storeTransfer: Transfer;
    driverTransfer: Transfer;
    totalAmount: number;
    references: { store: string; driver: string };
    message: string;
  }> {
    try {
      const { order_id, delivery_id, store, driver } = paymentRequest;

      this.logger.log(`Processing delivery payments for order ${order_id}`);

      // Validate amounts
      if (store.amount <= 0 || driver.amount <= 0) {
        throw new HttpException(
          'Payment amounts must be greater than 0',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Step 1: Create transfer recipients
      const { storeRecipientCode, driverRecipientCode } =
        await this.createTransferRecipients(
          store,
          driver,
          order_id,
          delivery_id,
        );

      // Step 2: Execute bulk transfer
      const transferResult = await this.executeBulkTransfer(
        storeRecipientCode,
        driverRecipientCode,
        store,
        driver,
        order_id,
      );

      // Step 3: Save transfer records to database
      const storeTransferRecord = await this.saveTransferRecord(
        store,
        transferResult.references.store,
        order_id,
        delivery_id,
        'pending',
      );

      const driverTransferRecord = await this.saveTransferRecord(
        driver,
        transferResult.references.driver,
        order_id,
        delivery_id,
        'pending',
      );

      const totalAmount = store.amount + driver.amount;

      this.logger.log(
        `Delivery payments processed successfully for order ${order_id}. Total: KES ${totalAmount}`,
      );

      // Optionally, start a background job to check transfer status
      this.scheduleTransferStatusCheck(transferResult.references.store);
      this.scheduleTransferStatusCheck(transferResult.references.driver);

      return {
        success: true,
        storeTransfer: storeTransferRecord,
        driverTransfer: driverTransferRecord,
        totalAmount,
        references: transferResult.references,
        message: `Successfully processed payments for order ${order_id}`,
      };
    } catch (error) {
      this.logger.error(
        `Error processing delivery payments for order ${paymentRequest.order_id}:`,
        error,
      );

      // Update any saved transfer records to failed status
      try {
        await this.transferRepository.update(
          { order_id: paymentRequest.order_id, status: 'pending' },
          { status: 'failed' },
        );
      } catch (updateError) {
        this.logger.error(
          'Failed to update transfer status to failed:',
          updateError,
        );
      }

      throw error;
    }
  }

  private scheduleTransferStatusCheck(reference: string) {
    // TODO: Implement with a job queue to check status after a delay
    // For now, just log
    this.logger.log(`Scheduled status check for transfer: ${reference}`);
  }

  /**
   * Verify transfer status and update database
   */
  async verifyAndUpdateTransferStatus(reference: string): Promise<void> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/transfer/verify/${reference}`,
        { headers: this.headers },
      );

      const result: PaystackResponse = response.data;

      if (result.status && result.data) {
        const paystackStatus = result.data.status;
        let dbStatus: 'pending' | 'success' | 'failed';

        switch (paystackStatus) {
          case 'success':
            dbStatus = 'success';
            break;
          case 'failed':
            dbStatus = 'failed';
            break;
          default:
            dbStatus = 'pending';
        }

        await this.updateTransferStatus(reference, dbStatus);
        this.logger.log(`Transfer ${reference} status updated to: ${dbStatus}`);
      }
    } catch (error) {
      this.logger.error(`Error verifying transfer ${reference}:`, error);
    }
  }

  /**
   * Get transfer records by order ID
   */
  async getTransfersByOrder_id(order_id: number): Promise<Transfer[]> {
    return await this.transferRepository.find({
      where: { order_id: order_id },
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Get transfer records by delivery ID
   */
  async getTransfersByDelivery_id(delivery_id: number): Promise<Transfer[]> {
    return await this.transferRepository.find({
      where: { delivery_id: delivery_id },
      order: { created_at: 'DESC' },
    });
  }

  async getStorePaymentDetails(store_id: number): Promise<{
    name: string;
    email: string;
    account_number: string;
  }> {
    const store = await this.storeRepository.findOne({
      where: { store_id: store_id },
    });
    if (!store) {
      throw new Error('Store not found');
    }
    return {
      name: store.name,
      email: store.owner.email,
      account_number: store.account_number,
    };
  }

  async getDriverPaymentDetails(driver_id: number): Promise<{
    name: string;
    email: string;
    account_number: string;
  }> {
    const driver = await this.userRepository.findOne({
      where: { user_id: driver_id },
    });
    if (!driver) {
      throw new Error('Driver not found');
    }
    return {
      name: driver.profile.first_name + ' ' + driver.profile.last_name,
      email: driver.email,
      account_number: driver.account_number,
    };
  }
}
