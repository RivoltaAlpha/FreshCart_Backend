import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/role.decorators';
import { Role } from 'src/users/entities/user.entity';
import { Product } from './entities/product.entity';
import { Public } from 'src/auth/decorators/public.decorator';
import { CategoriesService } from 'src/categories/categories.service';

@Controller('products')
@ApiBearerAuth('access-token')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly categoryService: CategoriesService,
  ) {}

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

  @Get('')
  @Public()
  categoryProducts(@Query('category_name') category_name: string) {
    return this.categoryService.searchCategoriesByName(category_name);
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: number) {
    return this.productsService.findOne(+id);
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

  // find store product belongs to
  @Get(':id/store')
  @Public()
  async findStoreByProductId(@Param('id') id: number) {
    return this.productsService.findStoreByProductId(id);
  }

  @Get('search')
  @Public()
  async searchProductsByName(@Query('name') name: string) {
    if (!name || name.trim() === '') {
      // Option 1: Return empty array
      return [];
      // Option 2: Return all products (uncomment if you want this)
      // return this.productsService.findAll();
    }
    return this.productsService.searchProductsByName(name);
  }

  // Search all products (if you want to support a query param)
  @Get('search-all')
  @Public()
  async searchAllProducts(@Query('query') query: string): Promise<Product[]> {
    return this.productsService.searchAllProducts(query);
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
}
