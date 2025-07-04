import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import {
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/role.decorators';
import { Role } from 'src/users/entities/user.entity';

@ApiBearerAuth('access-token')
@ApiTags('Addresses')
@Controller('addresses')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Post()
  @Roles(Role.Customer, Role.Store, Role.Admin, Role.Driver)
  create(@Body() createAddressDto: CreateAddressDto) {
    return this.addressesService.create(createAddressDto);
  }

  @Get()
  @Roles(Role.Customer, Role.Store, Role.Admin, Role.Driver)
  findUserAddresses(@Param('profileId') profileId: number) {
    return this.addressesService.findByProfileId(profileId);
  }

  @Get(':id')
  @Roles(Role.Customer, Role.Store, Role.Admin, Role.Driver)
  findOne(@Param('id') id: number) {
    return this.addressesService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.Customer, Role.Store, Role.Admin, Role.Driver)
  update(@Param('id') id: number, @Body() updateAddressDto: UpdateAddressDto) {
    return this.addressesService.update(id, updateAddressDto);
  }

  @Delete(':id')
  @Roles(Role.Customer, Role.Store, Role.Admin, Role.Driver)
  remove(@Param('id') id: number) {
    return this.addressesService.remove(id);
  }

  @Patch('default/:id')
  @Roles(Role.Customer, Role.Store, Role.Admin, Role.Driver)
  setDefaultAddress(@Param('id') id: number, @Param('profileId') profileId: number) {
    return this.addressesService.setDefaultAddress(id, profileId);
  }

  @Get('default/:profileId')
  @Roles(Role.Customer, Role.Store, Role.Admin, Role.Driver)
  findUserAddress(@Param('profileId') profileId: number) {
    return this.addressesService.findByProfileId(profileId);
  }

}
