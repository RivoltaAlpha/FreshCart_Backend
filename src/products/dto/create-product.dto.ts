import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsDate,
  IsNumber,
  IsOptional,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty()
  @IsOptional()
  @IsNumber()
  product_id: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  store_id: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  price: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  stock_quantity: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  category_id: number;

  @ApiProperty()
  @IsOptional()
  @IsString()
  image_url?: string;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  weight?: number;

  @ApiProperty()
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  rating?: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  review_count: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  discount?: number;

  // Initial inventory data
  @ApiProperty()
  @IsOptional()
  @IsNumber()
  initial_quantity?: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  reorder_level?: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  cost_price?: number;

  @ApiProperty()
  @IsOptional()
  @IsDate()
  created_at: Date;

  @ApiProperty()
  @IsOptional()
  @IsDate()
  updated_at: Date;
}
