import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Role } from 'src/users/entities/user.entity';

export class CreateAuthDto {
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
  role: Role;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  first_name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  last_name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  phone_number?: string;

  @ApiProperty()
  @IsOptional()
  @IsArray()
  address?: number[];

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  town: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  county: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  country?: string;
}
