import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  create(createUserDto: CreateUserDto) {
    const user = this.usersRepository.create(createUserDto);
    return this.usersRepository.save(user);
  }

  findAll() {
    return this.usersRepository.find({
      select: {
        user_id: true,
        first_name: true,
        last_name: true,
        email: true,
        role: true,
      },
      order: {
        user_id: 'ASC',
      },
    });
  }

  // findOne(id: number) {
  //   return this.usersRepository.findOneBy({ user_id: id });
  // }

  findOne(userId: number) {
  return this.usersRepository.findOne({ where: { user_id: userId } });
}

  update(id: number, updateUserDto: UpdateUserDto) {
    return this.usersRepository.update(id, updateUserDto);
  }

  remove(id: number) {
    return this.usersRepository.delete(id);
  }
  // user orders
  // async userOrders(userId: number) {
  //   return this.usersRepository.find({
  //     where: { user_id: userId },
  //     relations: ['orders'],
  //     select: {
  //       user_id: true,
  //       first_name: true,
  //       last_name: true,
  //       email: true,
  //       orders: {
  //         order_id: true,
  //         total_price: true,
  //         status: true,
  //       },
  //     },
  //   });
  // }
}


