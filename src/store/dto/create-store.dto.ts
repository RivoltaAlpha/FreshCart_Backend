import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
} from 'class-validator';
export class CreateStoreDto {

    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    store_id: number;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    location: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    owner: number; // user_id of the store owner

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    description: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    contact_info: string;

    @ApiProperty()
    @IsOptional()
    @IsString()
    image_url?: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    address: string;

    @ApiProperty()
    @IsOptional()
    @IsDate()
    created_at: Date;

    @ApiProperty()
    @IsOptional()
    @IsDate()
    updated_at: Date;
    
}
