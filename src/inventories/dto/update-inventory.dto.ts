import { PartialType } from '@nestjs/mapped-types';
import { CreateInventoryDto } from './create-inventory.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { InventoryAction } from '../entities/inventory.entity';

export class UpdateInventoryDto extends PartialType(CreateInventoryDto) {
  @ApiPropertyOptional()
  inventory_id: number;

  @ApiPropertyOptional()
  cost_price: number;

  @ApiPropertyOptional()
  store_id?: number;

  @ApiPropertyOptional()
  quantity_change: number;

  @ApiPropertyOptional()
  product_id?: number;

  @ApiPropertyOptional()
  stock_qty?: number;

  @ApiPropertyOptional()
  quantity_reserved?: number;

  @ApiPropertyOptional()
  reorder_level?: number;

  @ApiPropertyOptional()
  max_stock_level?: number;

  @ApiPropertyOptional()
  created_at?: Date;

  @ApiPropertyOptional()
  last_restocked?: Date;

  @ApiPropertyOptional()
  last_action: InventoryAction;
}
