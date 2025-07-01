import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateCartDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    user_id: number;

    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    product_id: number;

    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    quantity: number;

}
