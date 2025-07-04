import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString } from 'class-validator';
import {
  PaymentGateway,
  PaymentMethod,
  PaymentStatus,
} from '../entities/payment.entity';

export class CreatePaymentDto {
  @ApiProperty()
  @IsNumber()
  @IsOptional()
  user_id: number;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  order_id: number;

  @ApiProperty()
  @IsOptional()
  @IsString()
  email: string;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsOptional()
  @IsString()
  callback_url: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ enum: PaymentMethod })
  @IsOptional()
  payment_method?: PaymentMethod;

  @ApiProperty()
  @IsOptional()
  @IsString()
  reference: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  transaction_id?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  authorization_url?: string;

  @ApiProperty({ enum: PaymentGateway })
  @IsOptional()
  gateway_reference: PaymentGateway;

  @ApiProperty({ enum: PaymentStatus })
  @IsOptional()
  status: PaymentStatus;

  @ApiProperty()
  @IsString()
  @IsOptional()
  gateway_response?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  metadata?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  failure_reason?: string;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  refunded_amount: number;
}
