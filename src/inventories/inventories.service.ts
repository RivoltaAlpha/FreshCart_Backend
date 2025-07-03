import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Inventory } from './entities/inventory.entity';
import { Repository } from 'typeorm';
import { Product } from 'src/products/entities/product.entity';

@Injectable()
export class InventoriesService {
  constructor(
    @InjectRepository(Inventory)
    private inventoryRepository: Repository<Inventory>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async create(createInventoryDto: CreateInventoryDto) {
    const inventory = new Inventory();
    inventory.stock_qty = createInventoryDto.stock_qty;

    // Fetch and assign the product entity
    const product = await this.productRepository.findOneBy({ product_id: createInventoryDto.products });
    if (!product) {
      throw new Error(`Product with id ${createInventoryDto.products} not found`);
    }
    inventory.product = product;

    return this.inventoryRepository.save(inventory);
  }

  findAll() {
    return this.inventoryRepository.find();
  }

  findOne(id: number) {
    return this.inventoryRepository.findOneBy({ inventory_id: id });
  }

  remove(id: number) {
    return this.inventoryRepository.delete(id);
  }

  // inventory products
  async inventoryProducts(inventory_id: number) {
    const inventory = await this.inventoryRepository.findOne({
      where: {
        inventory_id: inventory_id
      },
      relations: [ 'warehouse', 'product'],
      select: {
        inventory_id: true,
        stock_qty: true,
        product: {
          name: true,
          price: true,
        },
      }
    })

    return inventory;
  }

    // Update Product Stock
    async updateStock(inventoryId: number, stock_qty: number):Promise<Inventory | string> {
    const inventory = await this.inventoryRepository.findOneBy({ inventory_id: inventoryId });
    if (!inventory) {
      throw new NotFoundException('Inventory not found');
    }
    inventory.stock_qty = stock_qty;
    return this.inventoryRepository.save(inventory);
  }
}
