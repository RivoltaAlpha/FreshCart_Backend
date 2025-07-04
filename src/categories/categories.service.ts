import { Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
  ) {}
  create(createCategoryDto: CreateCategoryDto) {
    const category = this.categoriesRepository.create(createCategoryDto);
    return this.categoriesRepository.save(category);
  }

  findAll() {
    return this.categoriesRepository.find();
  }

  findOne(id: number) {
    try {
      return this.categoriesRepository.findOneBy({ category_id: id });
    } catch (error) {
      throw new Error(`Category with id ${id} not found`);
    }
  }

  update(id: number, updateCategoryDto: UpdateCategoryDto) {
    try {
      return this.categoriesRepository.update(id, updateCategoryDto);
    } catch (error) {
      throw new Error(`Error updating category with id ${id}`);
    }
  }

  remove(id: number) {
    try {
      return this.categoriesRepository.delete(id);
    } catch (error) {
      throw new Error(`Error removing category with id ${id}`);
    }
  }

  async categoryProducts (category_id: number) {
    return this.categoriesRepository.find({
      where: {
        category_id: category_id
      },
      relations: ['products'],
      select: {
        category_id:true,
        name:true,
        description:true,
        products: {
          product_id: true,
          name: true,
          price: true,
        },
      }
    })

  }
}
