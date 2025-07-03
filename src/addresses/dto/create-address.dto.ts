import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateAddressDto {
  profile_id: number;

  @IsNotEmpty()
  street: string;

  @IsNotEmpty()
  town: string;

  @IsNotEmpty()
  county: string;

  @IsNotEmpty()
  postal_code: string;

  @IsOptional()
  country?: string;

  @IsOptional()
  type?: 'home' | 'work' | 'other';

  @IsOptional()
  latitude?: number;

  @IsOptional()
  longitude?: number;

  @IsOptional()
  isDefault?: boolean;

  @IsOptional()
  createdAt?: Date;

  @IsOptional()
  updatedAt?: Date;
}
