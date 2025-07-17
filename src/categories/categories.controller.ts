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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/role.decorators';
import { Role } from 'src/users/dto/create-user.dto';
import { Public } from 'src/auth/decorators/public.decorator';

@ApiBearerAuth('access-token')
@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get('all')
  @Public()
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get('category-products')
  @Public()
  categoryProducts(@Query('category_name') category_name: string) {
    return this.categoriesService.searchCategoriesByName(category_name);
  }
  @Post('create')
  @Roles(Role.Admin, Role.Store)
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Get(':id')
  @Roles(Role.Admin)
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(+id);
  }

  @Patch('update/:id')
  @Roles(Role.Admin, Role.Store)
  update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(+id, updateCategoryDto);
  }

  @Delete('delete/:id')
  @Roles(Role.Admin, Role.Store)
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(+id);
  }
}
