import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsDate,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { InventoryAction } from '../entities/inventory.entity';

export class CreateInventoryDto {
  @ApiProperty()
  @IsOptional()
  @IsNumber()
  inventory_id: number;

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
  @IsNumber()
  stock_qty: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  quantity_reserved?: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  reorder_level?: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  max_stock_level?: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  cost_price?: number;

  @ApiProperty()
  @IsOptional()
  last_restocked?: Date;

  @ApiProperty({ enum: InventoryAction, default: InventoryAction.RESTOCK })
  @IsOptional()
  @IsNotEmpty()
  last_action: InventoryAction;

  @ApiProperty({ type: [Number], required: false })
  @IsOptional()
  @IsNumber({}, { each: true })
  products?: number[];

  @ApiProperty()
  @IsNotEmpty()
  @IsOptional()
  @IsDate()
  created_at: Date;
}
