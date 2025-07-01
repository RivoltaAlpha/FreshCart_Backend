import { PartialType } from '@nestjs/mapped-types';
import { CreateInventoryDto } from './create-inventory.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateInventoryDto extends PartialType(CreateInventoryDto) {
      @ApiPropertyOptional()
      inventory_id: number;

      @ApiPropertyOptional()
      products: number;

      @ApiPropertyOptional()
      warehouse_id: number;

      @ApiPropertyOptional()
      stock_qty: number;

      @ApiPropertyOptional()
      created_at: Date;
}
