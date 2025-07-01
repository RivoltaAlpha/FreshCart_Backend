import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsDate, IsNumber, IsOptional } from 'class-validator';

export class CreateInventoryDto {
  @ApiProperty()
  @IsOptional()
  @IsNumber()
  inventory_id: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  products: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  store_id: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  stock_qty: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsOptional()
  @IsDate()
  created_at: Date;
}
