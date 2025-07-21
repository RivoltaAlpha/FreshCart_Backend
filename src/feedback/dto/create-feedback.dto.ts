import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsString } from "class-validator";

export class CreateFeedbackDto {
    @ApiProperty()
    @IsString()
    comment: string;

    @ApiProperty()
    @IsNumber()
    rating: number;

    @ApiProperty()
    @IsNumber()
    user_id: number;

    @ApiProperty()
    @IsNumber()
    order_id: number;
}
