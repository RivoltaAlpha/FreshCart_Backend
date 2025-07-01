import { PartialType } from '@nestjs/mapped-types';
import { CreateCategoryDto } from './create-category.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {
      @ApiPropertyOptional()
      supplier_id: number;

      @ApiPropertyOptional()
      name: string;

      @ApiPropertyOptional()
      description: string;

      @ApiPropertyOptional()
      created_at: Date;

}
