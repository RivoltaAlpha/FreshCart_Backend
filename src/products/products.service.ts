import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Like, Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { Category } from 'src/categories/entities/category.entity';
import { Store } from 'src/store/entities/store.entity';
import { Inventory } from 'src/inventories/entities/inventory.entity';
import { OrderItem } from 'src/order-item/entities/order-item.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,

    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,

    @InjectRepository(Store)
    private storeRepository: Repository<Store>,

    @InjectRepository(Inventory)
    private inventoryRepository: Repository<Inventory>,

    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,

    private dataSource: DataSource,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      // Verify store exists
      const store = await this.storeRepository.findOne({
        where: { store_id: createProductDto.store_id },
      });

      if (!store) {
        throw new NotFoundException(
          `Store with ID ${createProductDto.store_id} not found`,
        );
      }

      // Verify category exists
      const category = await this.categoryRepository.findOne({
        where: { category_id: createProductDto.category_id },
      });

      if (!category) {
        throw new NotFoundException(
          `Category with ID ${createProductDto.category_id} not found`,
        );
      }

      // Create product
      const product = queryRunner.manager.create(Product, {
        ...createProductDto,
        category: category,
        inventory: [], // Initialize empty inventory array
      });

      const savedProduct = await queryRunner.manager.save(Product, product);

      // Commit transaction
      await queryRunner.commitTransaction();

      return savedProduct;
    } catch (error) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      throw error;
    } finally {
      // Release query runner
      await queryRunner.release();
    }
  }

  // find byId
  async findByIds(id: number): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: { product_id: id },
      relations: ['category', 'inventory', 'inventory.store'],
      select: {
        inventory: {
          inventory_id: true,
          stock_qty: true,
          quantity_reserved: true,
          reorder_level: true,
          store: {
            store_id: true,
            name: true,
            rating: true,
            owner: {
              user_id: true,
              email: true,
            },
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async findAll(): Promise<{ products: Product[] }> {
    const products = await this.productsRepository.find({
      relations: ['category', 'inventory', 'inventory.store'],
      order: { created_at: 'DESC' },
    });

    return {
      products,
    };
  }

  async findByStore(storeId: number): Promise<{ products: Product[] }> {
    const queryBuilder = this.productsRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoin('product.inventory', 'inventory')
      .leftJoin('inventory.store', 'store')
      .where('inventory.store_id = :storeId', { storeId })
      .orderBy('product.created_at', 'DESC');

    const products = await queryBuilder.getMany();

    return {
      products,
    };
  }

  async findStoreByProductId(productId: number): Promise<Store> {
    const product = await this.findOne(productId);
    return product.inventory[0].store;
  }

  async findByCategory(categoryId: number): Promise<{ products: Product[] }> {
    const products = await this.productsRepository.find({
      where: { category_id: categoryId },
      relations: ['category', 'inventory', 'inventory.store'],
      order: { rating: 'DESC', created_at: 'DESC' },
    });

    return {
      products,
    };
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: { product_id: id },
      relations: [
        'category',
        'inventory',
        'inventory.store',
        'inventory.store.owner',
      ],
      select: {
        inventory: {
          inventory_id: true,
          stock_qty: true,
          quantity_reserved: true,
          reorder_level: true,
          store: {
            store_id: true,
            name: true,
            rating: true,
            owner: {
              user_id: true,
              email: true,
            },
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async update(
    id: number,
    updateProductDto: UpdateProductDto,
    userId?: number,
  ): Promise<Product> {
    const product = await this.findOne(id);

    // Check ownership through inventory relationship
    if (userId && product.inventory) {
      const inventories = Array.isArray(product.inventory)
        ? product.inventory
        : [product.inventory];
      const hasOwnership = inventories.some(
        (inv: any) => inv.store?.owner?.user_id === userId,
      );

      if (!hasOwnership) {
        throw new ForbiddenException(
          'You can only update products in your own store',
        );
      }
    }

    // Remove store_id from update data if present
    const { store_id, ...updateData } = updateProductDto;

    Object.assign(product, updateData);
    await this.productsRepository.save(product);

    return await this.findOne(id);
  }

  async remove(id: number, userId?: number): Promise<void> {
    const product = await this.findOne(id);

    // Check ownership through inventory relationship
    if (userId && product.inventory) {
      const inventories = Array.isArray(product.inventory)
        ? product.inventory
        : [product.inventory];
      const hasOwnership = inventories.some(
        (inv: any) => inv.store?.owner?.user_id === userId,
      );

      if (!hasOwnership) {
        throw new ForbiddenException(
          'You can only delete products from your own store',
        );
      }
    }

    await this.productsRepository.remove(product);
  }

  async getLowStockProducts(storeId?: number): Promise<Product[]> {
    const queryBuilder = this.productsRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.inventory', 'inventory')
      .leftJoinAndSelect('inventory.store', 'store')
      .where('inventory.stock_qty <= inventory.reorder_level');

    if (storeId) {
      queryBuilder.andWhere('inventory.store_id = :storeId', { storeId });
    }

    return await queryBuilder.getMany();
  }

  async getProductsByStore(storeId: number): Promise<Product[]> {
    // First verify the store exists
    const storeExists = await this.dataSource
      .getRepository('Store')
      .findOne({ where: { store_id: storeId } });

    if (!storeExists) {
      throw new NotFoundException(`Store with ID ${storeId} not found`);
    }

    const products = await this.productsRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoin('product.inventory', 'inventory')
      .where('inventory.store_id = :storeId', { storeId })
      .orderBy('product.created_at', 'DESC')
      .getMany();

    return products;
  }

  async getProductsByCategory(categoryId: number): Promise<Product[]> {
    const category = await this.categoryRepository.findOne({
      where: { category_id: categoryId },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${categoryId} not found`);
    }

    const products = await this.productsRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.inventory', 'inventory')
      .leftJoinAndSelect('inventory.store', 'store')
      .where('product.category_id = :categoryId', { categoryId })
      .orderBy('product.created_at', 'DESC')
      .getMany();

    return products;
  }

  // stores that have this product
  async getStoresByProduct(productId: number): Promise<any[]> {
    const product = await this.productsRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.inventory', 'inventory')
      .leftJoinAndSelect('inventory.store', 'store')
      .leftJoinAndSelect('store.owner', 'owner')
      .where('product.product_id = :productId', { productId })
      .getOne();

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    // Type guard to handle the relationship properly
    const inventories = product.inventory;

    if (
      !inventories ||
      (Array.isArray(inventories) && inventories.length === 0)
    ) {
      return [];
    }

    // Since it's a many-to-many relationship, inventory should always be an array
    const inventoryArray = Array.isArray(inventories)
      ? inventories
      : [inventories];

    return inventoryArray.map((inv) => ({
      store: inv.store,
      inventory: {
        inventory_id: inv.inventory_id,
        stock_qty: inv.stock_qty,
        quantity_reserved: inv.quantity_reserved,
        reorder_level: inv.reorder_level,
        last_restocked: inv.last_restocked,
      },
    }));
  }

  async addProductToStore(
    productId: number,
    storeId: number,
    inventoryData: Inventory,
  ): Promise<Inventory> {
    // Check if product exists
    const product = await this.productsRepository.findOne({
      where: { product_id: productId },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    // Check if store exists
    const store = await this.storeRepository.findOne({
      where: { store_id: storeId },
    });

    if (!store) {
      throw new NotFoundException(`Store with ID ${storeId} not found`);
    }

    // Check if inventory already exists
    const existingInventory = await this.inventoryRepository.findOne({
      where: { store_id: storeId },
    });

    if (existingInventory) {
      throw new ForbiddenException('Product already exists in this store');
    }

    // Create new inventory record
    const { store_id, ...restInventoryData } = inventoryData;
    const inventory = this.inventoryRepository.create({
      store_id: storeId,
      ...restInventoryData,
      last_restocked: new Date(),
    });

    return await this.inventoryRepository.save(inventory);
  }

  async removeProductFromStore(
    productId: number,
    storeId: number,
    userId?: number,
  ): Promise<void> {
    const inventory = await this.inventoryRepository.findOne({
      where: { store_id: storeId },
      relations: ['store', 'store.owner'],
    });

    if (!inventory) {
      throw new NotFoundException(`Product not found in this store`);
    }

    // Check ownership
    if (userId && inventory.store.owner.user_id !== userId) {
      throw new ForbiddenException(
        'You can only remove products from your own store',
      );
    }

    await this.inventoryRepository.remove(inventory);
  }

  async updateRating(id: number, rating: number): Promise<Product> {
    const product = await this.findOne(id);

    // Calculate new average rating
    const totalRating = product.rating * product.review_count + rating;
    product.review_count += 1;
    product.rating =
      Math.round((totalRating / product.review_count) * 100) / 100;

    await this.productsRepository.save(product);
    return product;
  }

  // Search categories by name and include products
  async searchCategoriesByName(name: string) {
    return this.categoryRepository.find({
      where: {
        name: Like(`%${name}%`),
      },
      relations: ['products'],
      select: {
        category_id: true,
        name: true,
        description: true,
        products: {
          product_id: true,
          name: true,
          price: true,
          image_url: true,
        },
      },
    });
  }

  async searchProductsByName(name: string): Promise<Product[]> {
    if (!name || name.trim() === '') {
      return [];
      // Or: return this.findAll();
    }
    return this.productsRepository.find({
      where: { name: Like(`%${name}%`) },
    });
  }

  //search all products
  async searchAllProducts(query: string): Promise<Product[]> {
    // If no query is provided, return all products
    if (!query) {
      const products = await this.productsRepository.find();
      return products;
    }

    query = query.toLowerCase();

    return this.productsRepository.find({
      where: {
        name: Like(`%${query}%`),
      },
    });
  }

  //all Products Analytics
  async getAllProductsAnalytics(): Promise<any> {
    // Top Categories (by sales, by order count)
    const topCategories = await this.categoryRepository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.products', 'product')
      .leftJoinAndSelect('product.inventory', 'inventory')
      .select([
        'category.category_id',
        'category.name',
        'SUM(inventory.stock_qty) AS total_sales',
      ])
      .groupBy('category.category_id')
      .orderBy('total_sales', 'DESC')
      .limit(4)
      .getRawMany();

    const productRatings = await this.productsRepository
      .createQueryBuilder('product')
      .select([
        'product.product_id',
        'product.name',
        'AVG(product.rating) AS average_rating',
        'COUNT(product.review_count) AS review_count',
      ])
      .groupBy('product.product_id')
      .orderBy('average_rating', 'DESC')
      .limit(5)
      .getRawMany();

    // most ordered products
    const topProducts = await this.orderItemRepository
      .createQueryBuilder('orderItem')
      .select('orderItem.product_id', 'product_id')
      .addSelect('SUM(orderItem.quantity)', 'totalQuantity')
      .groupBy('orderItem.product_id')
      .orderBy('"totalQuantity"', 'DESC')
      .limit(10)
      .getRawMany();

    return {
      topCategories,
      productRatings,
      topProducts,
    };
  }
}
