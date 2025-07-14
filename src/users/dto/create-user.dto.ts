import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export enum Role {
  Admin = 'Admin',
  Customer = 'Customer',
  Store = 'Store',
  Driver = 'Driver',
}

export class CreateUserDto {
  @ApiProperty()
  @IsOptional()
  @IsNumber()
  user_id: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @IsEnum(Role)
  role: Role;

  @ApiProperty()
  @IsOptional()
  @IsString()
  hashedRefreshToken?: string;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  is_active: boolean = true;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  is_available: boolean = true;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  profile_id: number;
}
