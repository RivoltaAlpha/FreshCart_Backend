import { Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductsService {
    constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
  ) {}
  create(createProductDto: CreateProductDto) {
    const product = this.productsRepository.create(createProductDto);
    return this.productsRepository.save(product);
  }

  findAll() {
    return this.productsRepository.find();
  }

  findOne(id: number) {
    return this.productsRepository.findOne({
      where: { product_id: id },
    });
  }

 async update(
    id: number,
    updateProductDto: UpdateProductDto,
  ): Promise<Product | string> {
    const product = await this.productsRepository.findOne({
      where: { product_id: id },
    });
    if (!product) {
      return `product with id ${id} not found`;
    }
    const updatedProduct = this.productsRepository.merge(product, {
      ...updateProductDto,
      updatedAt: new Date(),
    });
    return this.productsRepository.save(updatedProduct);
  }

  async remove(id: number): Promise<string> {
    const result = await this.productsRepository.delete(id);
    if (result.affected && result.affected > 0) {
      return `product with id ${id} deleted successfully`;
    }
    return `product with id ${id} not found`;
  }
}
