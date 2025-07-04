import { IsDate, IsNotEmpty, IsNumber, IsOptional } from "class-validator";

export class CreateOrderItemDto {

    @IsOptional()
    @IsNumber()
    order_id: number;

    @IsNotEmpty()
    @IsNumber()
    product_id: number;

    @IsNotEmpty()
    @IsNumber()
    quantity: number;

    @IsNotEmpty()
    @IsNumber()
    unit_price: number;

    @IsNotEmpty()
    @IsNumber()
    total_price: number;

    @IsNotEmpty()
    @IsDate()
    created_at?: Date;
    }
