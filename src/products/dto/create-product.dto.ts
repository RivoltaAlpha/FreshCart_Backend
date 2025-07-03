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
  @IsNotEmpty()
  @IsString()
  image_url: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  inventory_id: number;

  @ApiProperty()
  @IsOptional()
  @IsDate()
  created_at: Date;

  @ApiProperty()
  @IsOptional()
  @IsDate()
  updated_at: Date;
}
