import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inventory, InventoryAction } from './entities/inventory.entity';
import { Product } from '../products/entities/product.entity';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { Store } from 'src/store/entities/store.entity';

@Injectable()
export class InventoriesService {
  constructor(
    @InjectRepository(Inventory)
    private inventoryRepository: Repository<Inventory>,

    @InjectRepository(Product)
    private productRepository: Repository<Product>,

    @InjectRepository(Store)
    private storeRepository: Repository<Store>,
  ) {}

  async create(createInventoryDto: CreateInventoryDto): Promise<Inventory> {
    // Verify store exists
    const store = await this.storeRepository.findOne({
      where: { store_id: createInventoryDto.store_id },
    });

    if (!store) {
      throw new NotFoundException(
        `Store with ID ${createInventoryDto.store_id} not found`,
      );
    }

    // Fetch products by IDs if provided
    let products: Product[] = [];
    if (createInventoryDto.products && createInventoryDto.products.length > 0) {
      products = await this.productRepository.findByIds(
        createInventoryDto.products,
      );
    }

    // Create inventory without requiring existing products
    const inventory = this.inventoryRepository.create({
      ...createInventoryDto,
      last_restocked: new Date(),
      store: store,
      products: products,
    });

    return await this.inventoryRepository.save(inventory);
  }

  async findAll(storeId?: number): Promise<Inventory[]> {
    const queryBuilder = this.inventoryRepository
      .createQueryBuilder('inventory')
      .leftJoinAndSelect('inventory.products', 'product')
      .leftJoin('inventory.store', 'store')
      .orderBy('inventory.created_at', 'DESC');

    if (storeId) {
      queryBuilder.where('inventory.store_id = :storeId', { storeId });
    }

    return await queryBuilder.getMany();
  }

  async findLowStock(storeId?: number): Promise<Inventory[]> {
    const queryBuilder = this.inventoryRepository
      .createQueryBuilder('inventory')
      .leftJoinAndSelect('inventory.products', 'product')
      .leftJoinAndSelect('inventory.store', 'store')
      .where('inventory.stock_qty <= inventory.reorder_level')
      .orderBy('inventory.stock_qty', 'ASC');

    if (storeId) {
      queryBuilder.andWhere('inventory.store_id = :storeId', { storeId });
    }

    return await queryBuilder.getMany();
  }

  async findOutOfStock(storeId?: number): Promise<Inventory[]> {
    const queryBuilder = this.inventoryRepository
      .createQueryBuilder('inventory')
      .leftJoinAndSelect('inventory.products', 'product')
      .leftJoinAndSelect('inventory.store', 'store')
      .where('inventory.stock_qty = 0')
      .orderBy('inventory.created_at', 'DESC');

    if (storeId) {
      queryBuilder.andWhere('inventory.store_id = :storeId', { storeId });
    }

    return await queryBuilder.getMany();
  }

  async findOne(id: number): Promise<Inventory> {
    const inventory = await this.inventoryRepository.findOne({
      where: { inventory_id: id },
      relations: ['products', 'store'],
    });

    if (!inventory) {
      throw new NotFoundException(`Inventory with ID ${id} not found`);
    }

    return inventory;
  }

  async getInventoryStats(storeId?: number): Promise<any> {
    const queryBuilder =
      this.inventoryRepository.createQueryBuilder('inventory');

    if (storeId) {
      queryBuilder.where('inventory.store_id = :storeId', { storeId });
    }

    const totalItems = await queryBuilder.getCount();
    const lowStockItems = await queryBuilder
      .clone()
      .andWhere('inventory.stock_qty <= inventory.reorder_level')
      .getCount();
    const outOfStockItems = await queryBuilder
      .clone()
      .andWhere('inventory.stock_qty = 0')
      .getCount();

    const totalValue = await queryBuilder
      .clone()
      .select('SUM(inventory.stock_qty * inventory.cost_price)', 'total')
      .getRawOne();

    return {
      total_items: totalItems,
      low_stock_items: lowStockItems,
      out_of_stock_items: outOfStockItems,
      in_stock_items: totalItems - outOfStockItems,
      total_inventory_value: parseFloat(totalValue?.total || '0'),
    };
  }

  async remove(id: number): Promise<void> {
    const inventory = await this.findOne(id);
    await this.inventoryRepository.remove(inventory);
  }

  async inventoryProducts(inventory_id: number) {
    const inventory = await this.inventoryRepository.findOne({
      where: {
        inventory_id: inventory_id,
      },
      relations: ['products'],
      select: {
        inventory_id: true,
        stock_qty: true,
        products: {
          product_id: true,
          name: true,
          price: true,
        },
      },
    });

    if (!inventory) {
      throw new NotFoundException(
        `Inventory with ID ${inventory_id} not found`,
      );
    }

    return inventory;
  }

  async updateStock(
    id: number,
    updateInventoryDto: UpdateInventoryDto,
  ): Promise<Inventory> {
    const inventory = await this.findOne(id);

    // Update quantity based on action
    if (updateInventoryDto.last_action === InventoryAction.RESTOCK) {
      inventory.stock_qty += Math.abs(updateInventoryDto.quantity_change);
      inventory.last_restocked = new Date();
    } else if (updateInventoryDto.last_action === InventoryAction.SALE) {
      const newQuantity =
        inventory.stock_qty - Math.abs(updateInventoryDto.quantity_change);
      if (newQuantity < 0) {
        throw new ForbiddenException('Insufficient stock for this sale');
      }
      inventory.stock_qty = newQuantity;
    } else if (updateInventoryDto.last_action === InventoryAction.ADJUSTMENT) {
      inventory.stock_qty += updateInventoryDto.quantity_change; // Can be positive or negative
    } else if (
      [InventoryAction.EXPIRED, InventoryAction.DAMAGED].includes(
        updateInventoryDto.last_action,
      )
    ) {
      const newQuantity =
        inventory.stock_qty - Math.abs(updateInventoryDto.quantity_change);
      if (newQuantity < 0) {
        throw new ForbiddenException('Cannot remove more items than available');
      }
      inventory.stock_qty = newQuantity;
    }

    // Update other fields
    inventory.last_action = updateInventoryDto.last_action;
    if (updateInventoryDto.cost_price)
      inventory.cost_price = updateInventoryDto.cost_price;

    return await this.inventoryRepository.save(inventory);
  }

  // Method to find inventories that contain a specific product
  async findInventoriesByProduct(
    productId: number,
    storeId?: number,
  ): Promise<Inventory[]> {
    const queryBuilder = this.inventoryRepository
      .createQueryBuilder('inventory')
      .leftJoinAndSelect('inventory.products', 'product')
      .leftJoinAndSelect('inventory.store', 'store')
      .where('product.product_id = :productId', { productId });

    if (storeId) {
      queryBuilder.andWhere('inventory.store_id = :storeId', { storeId });
    }

    return await queryBuilder.getMany();
  }

  // Method to get a specific inventory that contains a product in a specific store
  async getInventoryWithProductInStore(
    productId: number,
    storeId: number,
  ): Promise<Inventory> {
    const inventory = await this.inventoryRepository
      .createQueryBuilder('inventory')
      .leftJoinAndSelect('inventory.products', 'product')
      .leftJoinAndSelect('inventory.store', 'store')
      .where('product.product_id = :productId', { productId })
      .andWhere('inventory.store_id = :storeId', { storeId })
      .getOne();

    if (!inventory) {
      throw new NotFoundException(
        `Inventory containing product ID ${productId} in store ID ${storeId} not found`,
      );
    }

    return inventory;
  }

  // Method to reserve stock in an inventory containing a specific product
  async reserveStock(
    inventoryId: number,
    quantity: number,
  ): Promise<Inventory> {
    const inventory = await this.findOne(inventoryId);

    if (inventory.stock_qty < quantity) {
      throw new ForbiddenException('Insufficient stock to reserve');
    }

    inventory.stock_qty -= quantity;
    inventory.quantity_reserved += quantity;

    return await this.inventoryRepository.save(inventory);
  }

  // Method to reserve stock for a product
  async reserveStockForProduct(
    productId: number,
    quantity: number,
    storeId?: number,
  ): Promise<void> {
    // Find inventories that contain this product in the specified store
    const inventories = await this.findInventoriesByProduct(productId, storeId);

    if (!inventories || inventories.length === 0) {
      throw new NotFoundException(
        `Product ${productId} not found in store ${storeId}`,
      );
    }

    let remainingQuantity = quantity;

    // Reserve stock across multiple inventories if needed
    for (const inventory of inventories) {
      if (remainingQuantity <= 0) break;

      const availableStock =
        inventory.stock_qty - (inventory.quantity_reserved || 0);
      const reserveFromThis = Math.min(remainingQuantity, availableStock);

      if (reserveFromThis > 0) {
        await this.reserveStock(inventory.inventory_id, reserveFromThis);
        remainingQuantity -= reserveFromThis;
      }
    }

    if (remainingQuantity > 0) {
      throw new BadRequestException(
        `Insufficient stock to reserve ${quantity} units`,
      );
    }
  }

  async releaseReservedStock(
    inventoryId: number,
    quantity: number,
  ): Promise<Inventory> {
    const inventory = await this.findOne(inventoryId);

    if (inventory.quantity_reserved < quantity) {
      throw new ForbiddenException('Cannot release more than reserved');
    }

    inventory.quantity_reserved -= quantity;
    inventory.stock_qty += quantity;

    return await this.inventoryRepository.save(inventory);
  }

  async confirmSale(inventoryId: number, quantity: number): Promise<Inventory> {
    const inventory = await this.findOne(inventoryId);

    if (inventory.quantity_reserved < quantity) {
      throw new ForbiddenException(
        'Cannot confirm sale for more than reserved',
      );
    }

    inventory.quantity_reserved -= quantity;
    inventory.last_action = InventoryAction.SALE;

    return await this.inventoryRepository.save(inventory);
  }

  // Method to add products to an inventory
  async addProductToInventory(
    inventoryId: number,
    productId: number,
  ): Promise<Inventory> {
    const inventory = await this.inventoryRepository.findOne({
      where: { inventory_id: inventoryId },
      relations: ['products'],
    });

    if (!inventory) {
      throw new NotFoundException(`Inventory with ID ${inventoryId} not found`);
    }

    const product = await this.productRepository.findOne({
      where: { product_id: productId },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    // Check if product is already in this inventory
    const productExists = inventory.products.some(
      (p) => p.product_id === productId,
    );
    if (productExists) {
      throw new ForbiddenException('Product already exists in this inventory');
    }

    inventory.products.push(product);
    return await this.inventoryRepository.save(inventory);
  }

  // Method to remove products from an inventory
  async removeProductFromInventory(
    inventoryId: number,
    productId: number,
  ): Promise<Inventory> {
    const inventory = await this.inventoryRepository.findOne({
      where: { inventory_id: inventoryId },
      relations: ['products'],
    });

    if (!inventory) {
      throw new NotFoundException(`Inventory with ID ${inventoryId} not found`);
    }

    const productExists = inventory.products.some(
      (p) => p.product_id === productId,
    );
    if (!productExists) {
      throw new NotFoundException(
        `Product with ID ${productId} not found in this inventory`,
      );
    }

    inventory.products = inventory.products.filter(
      (p) => p.product_id !== productId,
    );
    return await this.inventoryRepository.save(inventory);
  }

  // Method to get all products in a specific inventory
  async getProductsInInventory(inventoryId: number) {
    const inventory = await this.inventoryRepository.findOne({
      where: { inventory_id: inventoryId },
      relations: ['products'],
      select: {
        inventory_id: true,
        products: {
          product_id: true,
          name: true,
          price: true,
          description: true,
          category: true,
          stock_quantity: true,
        },
      },
    });

    if (!inventory) {
      throw new NotFoundException(`Inventory with ID ${inventoryId} not found`);
    }

    return inventory.products;
  }

  // Method to check if a product exists in any inventory of a specific store
  async isProductInStore(productId: number, storeId: number): Promise<boolean> {
    const inventories = await this.findInventoriesByProduct(productId, storeId);
    return inventories.length > 0;
  }

  // Method to get total stock quantity for a product across all inventories in a store
  async getTotalProductStockInStore(
    productId: number,
    storeId: number,
  ): Promise<number> {
    const inventories = await this.findInventoriesByProduct(productId, storeId);
    return inventories.reduce(
      (total, inventory) => total + inventory.stock_qty,
      0,
    );
  }

  async getStoreInventories(storeId: number): Promise<Inventory[]> {
    const inventories = await this.inventoryRepository.find({
      where: { store_id: storeId },
      relations: ['products'],
      order: { created_at: 'DESC' },
    });
    return inventories;
  }

  // get all store products in all inventories
  async getAllStoreProductsInInventories(storeId: number): Promise<Product[]> {
    const inventories = await this.getStoreInventories(storeId);
    const products: Product[] = [];

    for (const inventory of inventories) {
      for (const product of inventory.products) {
        if (!products.some((p) => p.product_id === product.product_id)) {
          products.push(product);
        }
      }
    }

    return products;
  }
}
