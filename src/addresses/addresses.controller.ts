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

@Controller('addresses')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Post()
  create(@Body() createAddressDto: CreateAddressDto) {
    return this.addressesService.create(createAddressDto);
  }

  @Get()
  findUserAddresses(@Param('profileId') profileId: number) {
    return this.addressesService.findByProfileId(profileId);
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.addressesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: number, @Body() updateAddressDto: UpdateAddressDto) {
    return this.addressesService.update(id, updateAddressDto);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.addressesService.remove(id);
  }

  @Patch('default/:id')
  setDefaultAddress(@Param('id') id: number, @Param('profileId') profileId: number) {
    return this.addressesService.setDefaultAddress(id, profileId);
  }

  @Get('default/:profileId')
  findUserAddress(@Param('profileId') profileId: number) {
    return this.addressesService.findByProfileId(profileId);
  }

}
