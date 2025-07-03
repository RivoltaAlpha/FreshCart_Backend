import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateAddressDto {
    @ApiProperty()
  profile_id: number;

  @ApiProperty()
  @IsNotEmpty()
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
  latitude?: number;

  @ApiProperty()
  @IsOptional()
  longitude?: number;

  @ApiProperty()
  @IsOptional()
  isDefault?: boolean;

  @ApiProperty()
  @IsOptional()
  createdAt?: Date;

  @ApiProperty()
  @IsOptional()
  updatedAt?: Date;
}
