import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/create-order.dto';
import { Roles } from 'src/auth/decorators/role.decorators';
import { Role } from 'src/users/entities/user.entity';
import {
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiBearerAuth('access-token')
@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('create')
  @Roles(Role.Customer, Role.Store, Role.Admin, Role.Driver)
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  @Get('all')
  @Roles(Role.Customer, Role.Store, Role.Admin, Role.Driver)
  findAll() {
    return this.ordersService.findAll();
  }

  @Get(':id')
  @Roles(Role.Customer, Role.Store, Role.Admin, Role.Driver)
  findOne(@Param('id') id: number) {
    return this.ordersService.findOne(id);
  }

  @Patch('update/:id')
  @Roles(Role.Customer, Role.Store, Role.Admin, Role.Driver)
  update(@Param('id') id: number, @Body() updateOrderDto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, updateOrderDto);
  }

  @Delete(':id')
  @Roles(Role.Customer, Role.Store, Role.Admin, Role.Driver)
  remove(@Param('id') id: number) {
    return this.ordersService.remove(id);
  }
  @Get('user/:userId')
  @Roles(Role.Customer, Role.Store, Role.Admin, Role.Driver)
  findByUser(@Param('userId') userId: number) {
    return this.ordersService.findByUser(userId);
  }
  // Get orders by store
  @Get('store/:storeId')
  @Roles(Role.Store, Role.Admin)
  findByStore(@Param('storeId') storeId: number) {
    return this.ordersService.findByStore(storeId);
  }
}
