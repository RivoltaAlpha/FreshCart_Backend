import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Public } from 'src/auth/decorators/public.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/role.decorators';
import { Role } from './entities/user.entity';

@ApiBearerAuth('access-token')
@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Public() 
  @Post('create')
  @Roles(Role.Admin, Role.Customer) 
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get('all')
  @Roles(Role.Admin, Role.Store)
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @Roles(Role.Admin, Role.Customer, Role.Store, Role.Driver) 
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  @Roles(Role.Admin, Role.Customer, Role.Store, Role.Driver) 
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete('delete/:id')
  @Roles(Role.Admin, Role.Customer, Role.Store, Role.Driver) 
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }

  @Get('me')
  getProfile(@Req() req) {
    return this.usersService.findOne(req.user.user_id);
  }

  @Get('orders/:userId')
  getUserOrders(@Param('userId') user_id: number) {
    return this.usersService.userOrders(user_id);
  }

  @Get('profile/:userId')
  getUserProfile(@Param('userId') userId: number) {
    return this.usersService.getUserProfile(userId);
  }

}
