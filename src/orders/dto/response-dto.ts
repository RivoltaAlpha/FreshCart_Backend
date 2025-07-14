import { ApiProperty } from '@nestjs/swagger';

export class OrderItemResponseDto {
  @ApiProperty()
  item_id: number;

  @ApiProperty()
  product_id: number;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  unit_price: string;

  @ApiProperty()
  total_price: string;

  @ApiProperty()
  product_name: string;

  @ApiProperty()
  product_image: string;

  @ApiProperty()
  product_unit: string;
}

export class CustomerResponseDto {
  @ApiProperty()
  user_id: number;

  @ApiProperty()
  email: string;

  @ApiProperty()
  first_name: string;

  @ApiProperty()
  last_name: string;

  @ApiProperty()
  phone_number: string;
}

export class StoreResponseDto {
  @ApiProperty()
  store_id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  contact_info: string;

  @ApiProperty()
  delivery_fee: number;
}

export class OrderResponseDto {
  @ApiProperty()
  order_id: number;

  @ApiProperty()
  order_number: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  delivery_method: string;

  @ApiProperty()
  delivery_address: string;

  @ApiProperty()
  total_amount: string;

  @ApiProperty()
  delivery_fee: string;

  @ApiProperty()
  tax_amount: string;

  @ApiProperty()
  estimated_delivery_time: string;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  customer: CustomerResponseDto;

  @ApiProperty()
  store: StoreResponseDto;

  @ApiProperty({ type: [OrderItemResponseDto] })
  items: OrderItemResponseDto[];
}