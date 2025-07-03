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
  @IsDate()
  created_at: Date;

  @ApiProperty()
  @IsOptional()
  @IsDate()
  updated_at: Date;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  profile_id: number;
}
