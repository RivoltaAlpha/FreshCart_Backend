import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { InventoriesService } from './inventories.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/role.decorators';
import { Role } from 'src/users/dto/create-user.dto';

@ApiBearerAuth('access-token')
@ApiTags('Inventory')
@Controller('inventories')
export class InventoriesController {
  constructor(private readonly inventoriesService: InventoriesService) {}

  @Post('create')
  @Roles(Role.Admin, Role.Store)
  create(@Body() createInventoryDto: CreateInventoryDto) {
    return this.inventoriesService.create(createInventoryDto);
  }

  @Get('all')
  @Roles(Role.Admin, Role.Store)
  findAll() {
    return this.inventoriesService.findAll();
  }

  @Get(':id')
  @Roles(Role.Admin, Role.Store)
  findOne(@Param('id') id: number) {
    return this.inventoriesService.findOne(id);
  }

  @Get(':id/low-stock')
  @Roles(Role.Admin, Role.Store)
  findLowStock(@Param('id') id: number) {
    return this.inventoriesService.findLowStock(id);
  }

  @Get(':id/stats')
  @Roles(Role.Admin, Role.Store)
  getInventoryStats(@Param('id') id: number) {
    return this.inventoriesService.getInventoryStats(id);
  }

  @Get(':id/out-of-stock')
  @Roles(Role.Admin, Role.Store)
  findOutOfStock(@Param('id') id: number) {
    return this.inventoriesService.findOutOfStock(id);
  }

  @Patch('update/:id')
  @Roles(Role.Admin, Role.Store)
  update(
    @Param('id') id: number,
    @Body() updateInventoryDto: UpdateInventoryDto,
  ) {
    return this.inventoriesService.updateStock(id, updateInventoryDto);
  }

  @Delete('delete/:id')
  @Roles(Role.Admin, Role.Store)
  remove(@Param('id') id: number) {
    return this.inventoriesService.remove(id);
  }

  @Get('products/:inventory_id')
  @Roles(Role.Admin, Role.Store, Role.Customer)
  inventoryProducts(@Param('inventory_id') inventory_id: number) {
    return this.inventoriesService.inventoryProducts(inventory_id);
  }

  @Get('product/:productId/store/:storeId')
  @Roles(Role.Admin, Role.Store, Role.Customer)
  getInventoryWithProductInStore(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('storeId', ParseIntPipe) storeId: number,
  ) {
    return this.inventoriesService.getInventoryWithProductInStore(productId, storeId);
  }

  @Get('product/:productId/store/:storeId/exists')
  @Roles(Role.Admin, Role.Store, Role.Customer)
  isProductInStore(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('storeId', ParseIntPipe) storeId: number,
  ) {
    return this.inventoriesService.isProductInStore(productId, storeId);
  }

  @Get('product/:productId/store/:storeId/total-stock')
  @Roles(Role.Admin, Role.Store, Role.Customer)
  getTotalProductStockInStore(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('storeId', ParseIntPipe) storeId: number,
  ) {
    return this.inventoriesService.getTotalProductStockInStore(productId, storeId);
  }

  @Get(':id/products')
  @Roles(Role.Admin, Role.Store, Role.Customer)
  getProductsInInventory(@Param('id', ParseIntPipe) id: number) {
    return this.inventoriesService.getProductsInInventory(id);
  }

  @Post(':id/reserve')
  @Roles(Role.Admin, Role.Store)
  reserveStock(
    @Param('id', ParseIntPipe) id: number,
    @Body('quantity') quantity: number,
  ) {
    return this.inventoriesService.reserveStock(id, quantity);
  }

  @Post('product/:productId/reserve')
  @Roles(Role.Admin, Role.Store)
  reserveStockForProduct(
    @Param('productId', ParseIntPipe) productId: number,
    @Body() body: { quantity: number; storeId?: number },
  ) {
    return this.inventoriesService.reserveStockForProduct(
      productId,
      body.quantity,
      body.storeId,
    );
  }

  @Post(':id/release-reserved')
  @Roles(Role.Admin, Role.Store)
  releaseReservedStock(
    @Param('id', ParseIntPipe) id: number,
    @Body('quantity') quantity: number,
  ) {
    return this.inventoriesService.releaseReservedStock(id, quantity);
  }

  @Post(':id/confirm-sale')
  @Roles(Role.Admin, Role.Store)
  confirmSale(
    @Param('id', ParseIntPipe) id: number,
    @Body('quantity') quantity: number,
  ) {
    return this.inventoriesService.confirmSale(id, quantity);
  }






  @Post(':inventoryId/products/:productId')
  @Roles(Role.Admin, Role.Store)
  addProductToInventory(
    @Param('inventoryId', ParseIntPipe) inventoryId: number,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    return this.inventoriesService.addProductToInventory(inventoryId, productId);
  }

  @Delete(':inventoryId/products/:productId')
  @Roles(Role.Admin, Role.Store)
  removeProductFromInventory(
    @Param('inventoryId', ParseIntPipe) inventoryId: number,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    return this.inventoriesService.removeProductFromInventory(inventoryId, productId);
  }
}
