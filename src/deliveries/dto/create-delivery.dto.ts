import { IsNotEmpty, IsNumber, IsString, IsOptional, IsEnum } from 'class-validator';
import { DeliveryStatus } from '../entities/delivery.entity';

export class CreateDeliveryDto {
  @IsNumber()
  @IsNotEmpty()
  order_id: number;

  @IsNumber()
  @IsNotEmpty()
  user_id: number;

  @IsNumber()
  @IsNotEmpty()
  store_id: number;

  @IsNumber()
  @IsOptional()
  driver_id?: number;

  @IsString()
  @IsNotEmpty()
  delivery_address: string;

  @IsEnum(DeliveryStatus)
  @IsOptional()
  delivery_status?: DeliveryStatus;

  @IsNumber()
  @IsOptional()
  delivery_fee?: number;

  @IsOptional()
  estimated_delivery_time?: Date;
}