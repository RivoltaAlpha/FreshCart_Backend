import { PartialType } from '@nestjs/mapped-types';
import { CreateDeliveryDto } from './create-delivery.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { DeliveryStatus } from '../entities/delivery.entity';

export class UpdateDeliveryDto extends PartialType(CreateDeliveryDto) {
  @IsEnum(DeliveryStatus)
  @IsOptional()
  delivery_status?: DeliveryStatus;

  @IsOptional()
  delivered_at?: Date;
}