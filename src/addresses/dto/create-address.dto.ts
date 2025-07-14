import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateAddressDto {
  @ApiProperty()
  address_id: number;

  @ApiProperty()
  profile_id: number;

  @ApiProperty()
  @IsOptional()
  area: string;

  @ApiProperty()
  @IsNotEmpty()
  town: string;

  @ApiProperty()
  @IsNotEmpty()
  county: string;

  @ApiProperty()
  @IsOptional()
  country?: string;

  @ApiProperty()
  @IsOptional()
  latitude?: number;

  @ApiProperty()
  @IsOptional()
  longitude?: number;

  @ApiProperty()
  @IsOptional()
  @IsEnum(['home', 'work', 'store'])
  type?: 'home' | 'work' | 'store';

  @ApiProperty()
  @IsOptional()
  isDefault?: boolean;
}
