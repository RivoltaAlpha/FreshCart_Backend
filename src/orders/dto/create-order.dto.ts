import { ApiProperty } from '@nestjs/swagger';
import {
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export enum OrderStatus {
  pending = 'pending',
  shipped = 'shipped',
  in_transit = 'in_transit',
  cancelled = 'cancelled',
  delivered = 'delivered',
}

export class CreateOrderDto {
  order_id: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  user_id: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  store_id: number;

  @ApiProperty({ enum: OrderStatus })
  @IsNotEmpty()
  @IsString()
  status: OrderStatus;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  total_amount: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  delivery_address: string;

  @ApiProperty()
  @IsOptional()
  @IsDate()
  created_at: Date;

  @ApiProperty({ type: [Number] })
  @IsNotEmpty()
  products: { product_id: number }[];
}
