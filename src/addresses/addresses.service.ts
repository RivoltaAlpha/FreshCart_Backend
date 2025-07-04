import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from './entities/address.entity';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressesService {
  constructor(
    @InjectRepository(Address)
    private addressRepository: Repository<Address>,
  ) {}

  async create(createAddressDto: CreateAddressDto): Promise<Address> {
    const address = this.addressRepository.create(createAddressDto);
    return await this.addressRepository.save(address);
  }

  async findByProfileId(profile_id: number): Promise<Address[]> {
    return await this.addressRepository.find({
      where: { profile_id },
      order: { isDefault: 'DESC', created_at: 'ASC' },
    });
  }

  async findOne(addressId: number): Promise<Address> {
    const address = await this.addressRepository.findOne({
      where: { address_id: addressId },
    });

    if (!address) {
      throw new NotFoundException(`Address with ID ${addressId} not found`);
    }

    return address;
  }

  async update(addressId: number, updateAddressDto: UpdateAddressDto): Promise<Address> {
    const address = await this.findOne(addressId);
    Object.assign(address, updateAddressDto);
    return await this.addressRepository.save(address);
  }

  async remove(addressId: number): Promise<void> {
    const address = await this.findOne(addressId);
    await this.addressRepository.remove(address);
  }

  async setDefaultAddress(addressId: number, profile_id: number): Promise<Address> {
    await this.addressRepository.update(
      { profile_id },
      { isDefault: false }
    );

    await this.addressRepository.update(
      { address_id: addressId },
      { isDefault: true }
    );

    return await this.findOne(addressId);
  }
  
  findUserAddresses(profile_id: number) {
    return this.addressRepository.find({ where: { profile_id: profile_id } });
  }
}
