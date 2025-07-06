import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store } from './entities/store.entity';
import { User } from '../users/entities/user.entity';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';

@Injectable()
export class StoreService {
  constructor(
    @InjectRepository(Store)
    private storeRepository: Repository<Store>,
    
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createStoreDto: CreateStoreDto): Promise<Store> {
    // Check if user exists and has Store role
    const user = await this.userRepository.findOne({
      where: { user_id: createStoreDto.owner_id },
      select: ['user_id', 'role'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${createStoreDto.owner_id} not found`);
    }

    if (user.role !== 'Store') {
      throw new ForbiddenException('Only users with Store role can create stores');
    }

    // Check if user already has a store
    const existingStore = await this.storeRepository.findOne({
      where: { owner_id: createStoreDto.owner_id },
    });

    if (existingStore) {
      throw new ConflictException('User already has a store');
    }

    const store = this.storeRepository.create({
      ...createStoreDto,
      country: createStoreDto.country || 'Kenya',
      rating: typeof createStoreDto.rating === 'number' ? createStoreDto.rating : 0,
      total_reviews: typeof createStoreDto.total_reviews === 'number' ? createStoreDto.total_reviews : 0,
    });

    return await this.storeRepository.save(store);
  }

  async findAll(): Promise<Store[]> {
    return await this.storeRepository.find({
      relations: ['owner', 'owner.profile'],
      select: {
        owner: {
          user_id: true,
          email: true,
          profile: {
            first_name: true,
            last_name: true,
            phone_number: true,
          },
        },
      },
      order: { created_at: 'DESC' },
    });
  }

  async findByLocation(city: string, country?: string): Promise<Store[]> {
    const query = this.storeRepository.createQueryBuilder('store')
      .leftJoinAndSelect('store.owner', 'owner')
      .leftJoinAndSelect('owner.profile', 'profile')
      .where('LOWER(store.city) = LOWER(:city)', { city });

    if (country) {
      query.andWhere('LOWER(store.country) = LOWER(:country)', { country });
    }

    return await query.orderBy('store.rating', 'DESC').getMany();
  }

  async findOne(id: number): Promise<Store> {
    const store = await this.storeRepository.findOne({
      where: { store_id: id },
      relations: ['owner', 'owner.profile', 'products'],
      select: {
        owner: {
          user_id: true,
          email: true,
          profile: {
            first_name: true,
            last_name: true,
            phone_number: true,
          },
        },
      },
    });

    if (!store) {
      throw new NotFoundException(`Store with ID ${id} not found`);
    }

    return store;
  }

  async update(id: number, updateStoreDto: UpdateStoreDto, userId?: number): Promise<Store> {
    const store = await this.findOne(id);

    // Check if user is the owner (for non-admin users)
    if (userId && store.owner_id !== userId) {
      throw new ForbiddenException('You can only update your own store');
    }

    Object.assign(store, updateStoreDto);
    await this.storeRepository.save(store);
    
    return await this.findOne(id);
  }

  async updateRating(id: number, rating: number): Promise<Store> {
    const store = await this.findOne(id);

    const totalReviews = typeof store.total_reviews === 'number' ? store.total_reviews : 0;
    const totalRating = (store?.rating ?? 0) * totalReviews + rating;
    store.total_reviews = totalReviews + 1;
    store.rating = totalRating / store.total_reviews;

    await this.storeRepository.save(store);
    return store;
  }

  async remove(id: number, userId?: number): Promise<void> {
    const store = await this.findOne(id);

    // Check if user is the owner (for non-admin users)
    if (userId && store.owner_id !== userId) {
      throw new ForbiddenException('You can only delete your own store');
    }

    await this.storeRepository.remove(store);
  }
}