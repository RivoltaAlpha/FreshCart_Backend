// payments/services/paystack-transfer.service.ts
import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

// DTOs for type safety
export class CreateTransferRecipientDto {
  type: 'nuban' | 'mobile_money' | 'basa';
  name: string;
  account_number: string;
  bank_code: string;
  currency?: string;
  description?: string;
  authorization_code?: string;
  metadata?: Record<string, any>;
}

export class BulkCreateTransferRecipientDto {
  batch: CreateTransferRecipientDto[];
}

export class InitiateTransferDto {
  source: 'balance';
  amount: number;
  recipient: string;
  reason?: string;
  currency?: string;
  reference?: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface VendorPaymentData {
  name: string;
  accountNumber: string;
  bankCode: string;
  amount: number;
}

export interface DoctorPaymentData {
  name: string;
  accountNumber: string;
  bankCode: string;
  amount: number;
}

@Injectable()
export class PaystackTransferService {
  private readonly logger = new Logger(PaystackTransferService.name);
  private readonly baseUrl = 'https://api.paystack.co';
  private readonly secretKey: string;

  constructor(private readonly configService: ConfigService) {
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

  async createTransferRecipient(
    recipientData: CreateTransferRecipientDto,
  ): Promise<TransferRecipient> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/transferrecipient`,
        recipientData,
        { headers: this.headers },
      );

      const result: PaystackResponse<TransferRecipient> = response.data;

      if (!result.status) {
        throw new HttpException(
          result.message || 'Failed to create transfer recipient',
          HttpStatus.BAD_REQUEST,
        );
      }

      this.logger.log(
        `Transfer recipient created: ${result.data.recipient_code}`,
      );
      return result.data;
    } catch (error) {
      this.logger.error(
        'Error creating transfer recipient:',
        error.response?.data || error.message,
      );
      throw new HttpException(
        error.response?.data?.message || 'Failed to create transfer recipient',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async bulkCreateTransferRecipients(
    recipientsData: BulkCreateTransferRecipientDto,
  ): Promise<{ success: TransferRecipient[]; errors: any[] }> {
    try {
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

      this.logger.log(
        `Bulk transfer recipients created: ${result.data.success.length} successful, ${result.data.errors.length} errors`,
      );
      return result.data;
    } catch (error) {
      this.logger.error(
        'Error bulk creating transfer recipients:',
        error.response?.data || error.message,
      );
      throw new HttpException(
        error.response?.data?.message ||
          'Failed to bulk create transfer recipients',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async initiateBulkTransfer(bulkTransferData: BulkTransferDto): Promise<any> {
    try {
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
        `Bulk transfer initiated: ${bulkTransferData.transfers.length} transfers`,
      );
      return result.data;
    } catch (error) {
      this.logger.error(
        'Error initiating bulk transfer:',
        error.response?.data || error.message,
      );
      throw new HttpException(
        error.response?.data?.message || 'Failed to initiate bulk transfer',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async verifyTransfer(reference: string): Promise<any> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/transfer/verify/${reference}`,
        { headers: this.headers },
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        'Error verifying transfer:',
        error.response?.data || error.message,
      );
      throw new HttpException(
        error.response?.data?.message || 'Failed to verify transfer',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async processDeliveryPayments(
    vendorData: VendorPaymentData,
    doctorData: DoctorPaymentData,
    orderId: string,
    deliveryId?: string,
  ): Promise<{
    vendorTransfer: any;
    doctorTransfer: any;
    totalAmount: number;
    references: { vendor: string; doctor: string };
  }> {
    try {
      this.logger.log(`Processing delivery payments for order ${orderId}`);

      // Step 1: Create transfer recipients using bulk API
      const recipients = await this.bulkCreateTransferRecipients({
        batch: [
          {
            type: 'mobile_money',
            name: vendorData.name,
            account_number: vendorData.accountNumber,
            bank_code: vendorData.bankCode,
            currency: 'KES',
            description: `Vendor payment for order ${orderId}`,
            metadata: {
              order_id: orderId,
              delivery_id: deliveryId,
              recipient_type: 'vendor',
            },
          },
          {
            type: 'mobile_money',
            name: doctorData.name,
            account_number: doctorData.accountNumber,
            bank_code: doctorData.bankCode,
            currency: 'KES',
            description: `Doctor payment for order ${orderId}`,
            metadata: {
              order_id: orderId,
              delivery_id: deliveryId,
              recipient_type: 'doctor',
            },
          },
        ],
      });

      // Handle recipient codes (both new and existing)
      const successfulRecipients = recipients.success;
      if (successfulRecipients.length < 2) {
        throw new HttpException(
          'Failed to create required transfer recipients',
          HttpStatus.BAD_REQUEST,
        );
      }

      const vendorRecipientCode = successfulRecipients[0].recipient_code;
      const doctorRecipientCode = successfulRecipients[1].recipient_code;

      // Generate unique references
      const vendorReference = `vendor_${orderId}_${Date.now()}`;
      const doctorReference = `doctor_${orderId}_${Date.now()}`;

      // Step 2: Initiate bulk transfer
      const transfers = await this.initiateBulkTransfer({
        currency: 'KES',
        source: 'balance',
        transfers: [
          {
            amount: vendorData.amount * 100, // Convert to kobo/cents
            recipient: vendorRecipientCode,
            reason: `Vendor payment for order ${orderId}`,
            reference: vendorReference,
          },
          {
            amount: doctorData.amount * 100, // Convert to kobo/cents
            recipient: doctorRecipientCode,
            reason: `Doctor payment for order ${orderId}`,
            reference: doctorReference,
          },
        ],
      });

      const totalAmount = vendorData.amount + doctorData.amount;

      this.logger.log(
        `Delivery payments processed successfully for order ${orderId}. Total: KES ${totalAmount}`,
      );

      return {
        vendorTransfer: transfers[0],
        doctorTransfer: transfers[1],
        totalAmount,
        references: {
          vendor: vendorReference,
          doctor: doctorReference,
        },
      };
    } catch (error) {
      this.logger.error(
        `Error processing delivery payments for order ${orderId}:`,
        error,
      );
      throw error;
    }
  }

  async finalizeTransfer(transferCode: string, otp: string): Promise<any> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/transfer/finalize_transfer`,
        {
          transfer_code: transferCode,
          otp: otp,
        },
        { headers: this.headers },
      );

      const result: PaystackResponse = response.data;

      if (!result.status) {
        throw new HttpException(
          result.message || 'Failed to finalize transfer',
          HttpStatus.BAD_REQUEST,
        );
      }

      return result.data;
    } catch (error) {
      this.logger.error(
        'Error finalizing transfer:',
        error.response?.data || error.message,
      );
      throw new HttpException(
        error.response?.data?.message || 'Failed to finalize transfer',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getTransferStatus(reference: string): Promise<{
    status: 'success' | 'failed' | 'pending';
    amount: number;
    recipient: string;
    reason: string;
    currency: string;
  }> {
    try {
      const response = await this.verifyTransfer(reference);

      return {
        status: response.data.status,
        amount: response.data.amount / 100, // Convert from kobo/cents
        recipient: response.data.recipient.name,
        reason: response.data.reason,
        currency: response.data.currency,
      };
    } catch (error) {
      this.logger.error(
        `Error getting transfer status for reference ${reference}:`,
        error,
      );
      throw error;
    }
  }

  async payVendorAndDriver(
    vendorData: VendorPaymentData,
    driverData: VendorPaymentData,
    orderId: string,
    deliveryId?: string,
  ): Promise<{
    vendorTransfer: any;
    driverTransfer: any;
    totalAmount: number;
    references: { vendor: string; driver: string };
  }> {
    try {
      this.logger.log(
        `Processing vendor and driver payments for order ${orderId}`,
      );

      // Step 1: Create transfer recipients using bulk API
      const recipients = await this.bulkCreateTransferRecipients({
        batch: [
          {
            type: 'mobile_money',
            name: vendorData.name,
            account_number: vendorData.accountNumber,
            bank_code: vendorData.bankCode,
            currency: 'KES',
            description: `Vendor payment for order ${orderId}`,
            metadata: {
              order_id: orderId,
              delivery_id: deliveryId,
              recipient_type: 'vendor',
            },
          },
          {
            type: 'mobile_money',
            name: driverData.name,
            account_number: driverData.accountNumber,
            bank_code: driverData.bankCode,
            currency: 'KES',
            description: `Driver payment for order ${orderId}`,
            metadata: {
              order_id: orderId,
              delivery_id: deliveryId,
              recipient_type: 'driver',
            },
          },
        ],
      });

      // Handle recipient codes (both new and existing)
      const successfulRecipients = recipients.success;
      if (successfulRecipients.length < 2) {
        throw new HttpException(
          'Failed to create required transfer recipients',
          HttpStatus.BAD_REQUEST,
        );
      }

      const vendorRecipientCode = successfulRecipients[0].recipient_code;
      const driverRecipientCode = successfulRecipients[1].recipient_code;

      // Generate unique references
      const vendorReference = `vendor_${orderId}_${Date.now()}`;
      const driverReference = `driver_${orderId}_${Date.now()}`;

      // Step 2: Initiate bulk transfer
      const transfers = await this.initiateBulkTransfer({
        currency: 'KES',
        source: 'balance',
        transfers: [
          {
            amount: vendorData.amount * 100, // Convert to kobo/cents
            recipient: vendorRecipientCode,
            reason: `Vendor payment for order ${orderId}`,
            reference: vendorReference,
          },
          {
            amount: driverData.amount * 100, // Convert to kobo/cents
            recipient: driverRecipientCode,
            reason: `Driver payment for order ${orderId}`,
            reference: driverReference,
          },
        ],
      });
      const totalAmount = vendorData.amount + driverData.amount;
      this.logger.log(
        `Vendor and driver payments processed successfully for order ${orderId}. Total: KES ${totalAmount}`,
      );
      return {
        vendorTransfer: transfers[0],
        driverTransfer: transfers[1],
        totalAmount,
        references: {
          vendor: vendorReference,
          driver: driverReference,
        },
      };
    } catch (error) {
      this.logger.error(
        `Error processing vendor and driver payments for order ${orderId}:`,
        error,
      );
      throw error;
    }
  }
}
