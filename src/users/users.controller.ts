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

@ApiBearerAuth('access-token') // This indicates that the endpoints require authentication
@ApiTags('Users') // This groups the endpoints under the 'Users' tag in Swagger documentation
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Public() // This endpoint is accessible without authentication
  @Post('create')
  @Roles(Role.Admin, Role.Customer) // This endpoint is restricted to users with the 'admin' or 'customer' role
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get('all')
  @Roles(Role.Admin, Role.Customer, Role.Store, Role.Driver) // This endpoint is restricted to users with the 'admin', 'customer', 'store', or 'driver' role
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @Roles(Role.Admin, Role.Customer, Role.Store, Role.Driver) // This endpoint is restricted to users with the 'admin', 'customer', 'store', or 'driver' role
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  @Roles(Role.Admin, Role.Customer, Role.Store, Role.Driver) // This endpoint is restricted to users with the 'admin', 'customer', 'store', or 'driver' role
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete('delete/:id')
  @Roles(Role.Admin, Role.Customer, Role.Store, Role.Driver) // This endpoint is restricted to users with the 'admin', 'customer', 'store', or 'driver' role
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }

  @Get('me')
  getProfile(@Req() req) {
    // req.user is set by the auth guard
    return this.usersService.findOne(req.user.user_id);
  }
}
