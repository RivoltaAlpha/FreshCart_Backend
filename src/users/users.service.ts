import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Role, User } from './entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.usersRepository.create({
      ...createUserDto,
      role: createUserDto.role as Role, 
    });
    return await this.usersRepository.save(user);
  }

  async getUserProfile(userId: number) {
    return this.usersRepository.findOne({
      where: { user_id: userId },
      relations: ['profile'],
      select: {
        user_id: true,
        email: true,
        role: true,
        profile: {
          first_name: true,
          last_name: true,
          phone_number: true,
        },
      },
    });
  }

  async findAll(): Promise<User[]> {
    const users = await this.usersRepository.find({
      relations: ['profile'],
      select: {
        user_id: true,
        email: true,
        role: true,
        profile: {
          first_name: true,
          last_name: true,
          phone_number: true,
        },
      },
    });
    if (!users || users.length === 0) {
      throw new Error('No users found');
    }
    return users;
  }

  async findOne(userId: number): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { user_id: userId },
      relations: ['profile', 'profile.addresses'],
      select: {
        user_id: true,
        email: true,
        role: true,
        created_at: true,
        updated_at: true,
        profile: {
          profile_id: true,
          first_name: true,
          last_name: true,
          phone_number: true,
          addresses: {
            address_id: true,
            area: true,
            town: true,
            county: true,
            country: true,
            type: true,
            isDefault: true,
          },
        },
      },
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    Object.assign(user, updateUserDto);
    const updatedUser = await this.usersRepository.save(user);
    return updatedUser;
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
  }

  async userOrders(user_id: number) {
    const user = await this.usersRepository.findOne({
      where: { user_id: user_id },
      relations: ['orders', 'profile'],
      select: {
        user_id: true,
        email: true,
        profile: {
          first_name: true,
          last_name: true,
        },
        orders: {
          order_id: true,
          status: true,
          total_amount: true,

        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${user_id} not found`);
    }

    return user;
  }
}
