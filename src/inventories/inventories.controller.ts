import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { InventoriesService } from './inventories.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/role.decorators';
import { Role } from 'src/users/dto/create-user.dto'; 

@ApiBearerAuth('access-token')
@ApiTags('Inventory') // This groups the endpoints under the 'Inventory' tag in Swagger documentation
@Controller('inventories')
export class InventoriesController {
  constructor(private readonly inventoriesService: InventoriesService) {}

  // @Post('create')
  // @Roles(Role.Admin,)
  // create(@Body() createInventoryDto: CreateInventoryDto) {
  //   return this.inventoriesService.create(createInventoryDto);
  // }

  @Get('all')
  @Roles(Role.Admin)
  findAll() {
    return this.inventoriesService.findAll();
  }

  @Get(':id')
  @Roles(Role.Admin,)
  findOne(@Param('id') id: string) {
    return this.inventoriesService.findOne(+id);
  }

  // @Patch('update/:id')
  // @Roles(Role.Admin)
  // update(
  //   @Param('id') id: string,
  //   @Body() updateInventoryDto: UpdateInventoryDto,
  // ) {
  //   return this.inventoriesService.update(+id, updateInventoryDto);
  // }

  @Delete('delete/:id')
  @Roles(Role.Admin,)
  remove(@Param('id') id: string) {
    return this.inventoriesService.remove(+id);
  }

  // @Get('products/:inventory_id')
  // @Roles(Role.Admin)
  // inventoryProducts(@Param('inventory_id') inventory_id: string) {
  //   return this.inventoriesService.inventoryProducts(+inventory_id);
  // }

  // @Patch('update-stock/:id')
  // @Roles(Role.Admin)
  // async updateStock(
  //   @Param('id') inventoryId: number,
  //   @Body('stock_qty') stock_qty: number,
  // ) {
  //   return this.inventoriesService.updateStock(inventoryId, stock_qty);
  // }
}
