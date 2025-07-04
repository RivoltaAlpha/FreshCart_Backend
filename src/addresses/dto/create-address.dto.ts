import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateAddressDto {
  @ApiProperty()
  address_id: number;

  @ApiProperty()
  profile_id: number;

  @ApiProperty()
  @IsOptional()
  street: string;

  @ApiProperty()
  @IsNotEmpty()
  town: string;

  @ApiProperty()
  @IsNotEmpty()
  county: string;

  @ApiProperty()
  @IsNotEmpty()
  postal_code: string;

  @ApiProperty()
  @IsOptional()
  country?: string;

  @ApiProperty()
  @IsOptional()
  @IsEnum(['home', 'work', 'other'])
  type?: 'home' | 'work' | 'other';

  @ApiProperty()
  @IsOptional()
  isDefault?: boolean;

  @ApiProperty()
  @IsOptional()
  created_at?: Date;

  @ApiProperty()
  @IsOptional()
  updated_at?: Date;
}
