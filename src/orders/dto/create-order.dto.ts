import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsEnum, IsArray, ValidateNested, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { DeliveryMethod, OrderStatus } from '../entities/order.entity';

export class OrderItemDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  product_id: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @ApiProperty()
  @IsOptional()
  @IsString()
  special_instructions?: string;
}

export class CreateOrderDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  user_id: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  store_id: number;

  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  delivery_address: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  delivery_instructions?: string;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  delivery_latitude?: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  delivery_longitude?: number;

  @ApiProperty()
  @IsOptional()
  @IsString()
  delivery_phone?: string;

  @ApiProperty()
  @IsOptional()
  @IsEnum(DeliveryMethod)
  delivery_method?: DeliveryMethod;

  @ApiProperty()
  @IsOptional()
  @IsDateString()
  estimated_delivery_time?: Date;

  @ApiProperty()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  discount_code?: string;
}

export class UpdateOrderStatusDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @ApiProperty()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  cancellation_reason?: string;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  driver_id?: number;
}

export class RateOrderDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  rating: number; // 1-5

  @ApiProperty()
  @IsOptional()
  @IsString()
  review?: string;
}
