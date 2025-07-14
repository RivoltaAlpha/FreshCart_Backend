import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
} from 'class-validator';

export class CreateStoreDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  owner_id: number;

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
  @IsString()
  contact_info: string;

  // Address fields
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  area: string;

  @ApiProperty()
  @IsString()
  country: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  town: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  county: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  image_url?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  rating?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  total_reviews?: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  delivery_fee: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  store_code?: string;
}