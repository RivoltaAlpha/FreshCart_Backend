import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/role.decorators';
import { Role } from 'src/users/entities/user.entity';
import { Product } from './entities/product.entity';
import { Public } from 'src/auth/decorators/public.decorator';

@ApiBearerAuth('access-token')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post('create')
  @Roles(Role.Admin, Role.Store)
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get('all')
  @Public()
  findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: number) {
    return this.productsService.findOne(+id);
  }

  @Patch('update/:id')
  @Roles(Role.Admin, Role.Store)
  update(@Param('id') id: number, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(+id, updateProductDto);
  }

  @Delete('delete/:id')
  @Roles(Role.Admin, Role.Store)
  remove(@Param('id') id: number) {
    return this.productsService.remove(+id);
  }

  @Get('store/:storeId')
  @Public()
  async getProductsByStore(
    @Param('storeId') storeId: number,
  ): Promise<Product[]> {
    return this.productsService.getProductsByStore(storeId);
  }

  @Get('category/:categoryId')
  @Public()
  async getProductsByCategory(
    @Param('categoryId') categoryId: number,
  ): Promise<Product[]> {
    return this.productsService.getProductsByCategory(categoryId);
  }
  // rate a product
  @Post(':id/rate')
  @Roles(Role.Admin, Role.Store, Role.Customer)
  rateProduct(
    @Param('id') id: number,
    @Body() rateProductDto: { id: number; rating: number },
  ) {
    return this.productsService.updateRating(id, rateProductDto.rating);
  }
}
