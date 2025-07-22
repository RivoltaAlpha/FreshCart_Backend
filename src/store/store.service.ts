import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Store } from './entities/store.entity';
import { User } from '../users/entities/user.entity';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { Address } from 'src/addresses/entities/address.entity';

@Injectable()
export class StoreService {
  constructor(
    @InjectRepository(Store)
    private storeRepository: Repository<Store>,

    @InjectRepository(Address)
    private addressRepository: Repository<Address>,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    private dataSource: DataSource,
  ) {}

  async create(createStoreDto: CreateStoreDto): Promise<Store> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await this.userRepository.findOne({
        where: { user_id: createStoreDto.owner_id },
        select: ['user_id', 'role'],
      });

      if (!user) {
        throw new NotFoundException(
          `User with ID ${createStoreDto.owner_id} not found`,
        );
      }

      if (user.role !== 'Store') {
        throw new ForbiddenException(
          'Only users with Store role can create stores',
        );
      }

      const existingStore = await this.storeRepository.findOne({
        where: { owner_id: createStoreDto.owner_id },
      });

      if (existingStore) {
        throw new ConflictException('User already has a store');
      }

      const store = this.storeRepository.create({
        owner_id: createStoreDto.owner_id,
        name: createStoreDto.name,
        description: createStoreDto.description,
        contact_info: createStoreDto.contact_info,
        delivery_fee: createStoreDto.delivery_fee,
        image_url: createStoreDto.image_url,
        store_code: createStoreDto.store_code,
        is_active: createStoreDto.is_active ?? true,
        is_verified: createStoreDto.is_verified ?? false,
        rating:
          typeof createStoreDto.rating === 'number' ? createStoreDto.rating : 0,
        total_reviews:
          typeof createStoreDto.total_reviews === 'number'
            ? createStoreDto.total_reviews
            : 0,
      });
      const savedStore = await queryRunner.manager.save(store);

      const address = this.addressRepository.create({
        area: createStoreDto.area,
        town: createStoreDto.town,
        county: createStoreDto.county,
        country: createStoreDto.country || 'Kenya',
        type: 'store',
        isDefault: true,
        store: savedStore,
      });
      const savedAddress = await queryRunner.manager.save(address);

      // Step 3: Update the store with the address_id
      savedStore.address = savedAddress;
      const finalStore = await queryRunner.manager.save(savedStore);

      await queryRunner.commitTransaction();

      const createdStore = await this.storeRepository.findOne({
        where: { store_id: finalStore.store_id },
        relations: ['owner', 'owner.profile', 'address'],
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
      if (!createdStore) {
        throw new NotFoundException(
          `Store with ID ${finalStore.store_id} not found`,
        );
      }

      return createdStore;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(): Promise<Store[]> {
    return await this.storeRepository.find({
      where: { is_verified: true },
      relations: ['owner', 'owner.profile', 'address'],
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
    const query = this.storeRepository
      .createQueryBuilder('store')
      .leftJoinAndSelect('store.owner', 'owner')
      .leftJoinAndSelect('owner.profile', 'profile')
      .leftJoinAndSelect('store.address', 'address')
      .where('LOWER(address.town) = LOWER(:city)', { city });

    if (country) {
      query.andWhere('LOWER(address.country) = LOWER(:country)', { country });
    }

    return await query.orderBy('store.rating', 'DESC').getMany();
  }

  async findOne(id: number): Promise<Store> {
    const store = await this.storeRepository.findOne({
      where: { store_id: id },
      relations: ['owner', 'owner.profile', 'address'],
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

  async update(
    id: number,
    updateStoreDto: UpdateStoreDto,
    userId?: number,
  ): Promise<Store> {
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

    const totalReviews =
      typeof store.total_reviews === 'number' ? store.total_reviews : 0;
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

  async findByOwnerId(ownerId: number): Promise<Store | null> {
    const store = await this.storeRepository.findOne({
      where: { owner_id: ownerId },
      relations: ['owner', 'owner.profile', 'address'],
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
      throw new NotFoundException(`Store not found for owner ID ${ownerId}`);
    }

    return store;
  }

  async findByOwnerIdOrNull(ownerId: number): Promise<Store | null> {
    return await this.storeRepository.findOne({
      where: { owner_id: ownerId },
      relations: ['owner', 'owner.profile', 'address'],
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
  }

  // verify store
  async verifyStore(id: number): Promise<Store> {
    const store = await this.findOne(id);
    store.is_verified = true;
    await this.storeRepository.save(store);
    return store;
  }

  // unverified stores
  async findUnverifiedStores(): Promise<Store[]> {
    return await this.storeRepository.find({
      where: { is_verified: false },
      relations: ['owner', 'owner.profile', 'address'],
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
  }

  //Store Analytics
  // Total Stores (active, pending verification)
  // Top Performing Stores (by revenue, order count)
  // Store Revenue Breakdown (per store, per region)
  // Store Order Volume (trends, per store)
  // Store Onboarding Trends (new stores over time)

  async getStoreAnalytics(): Promise<any> {
    const totalStores = await this.storeRepository.count();
    const verifiedStores = await this.storeRepository.count({
      where: { is_verified: true },
    });
    const unverifiedStores = await this.storeRepository.count({
      where: { is_verified: false },
    });

    // store with most orders |
    const topPerformingStore = await this.storeRepository
      .createQueryBuilder('store')
      .leftJoin('store.orders', 'order')
      .select([
        'store.store_id',
        'store.name',
        'COUNT(order.order_id) as "orderCount"',
      ])
      .groupBy('store.store_id')
      .addGroupBy('store.name')
      .orderBy('"orderCount"', 'DESC')
      .getRawOne();

    if (!topPerformingStore) {
      throw new NotFoundException('No stores found');
    }

    // Calculate total revenue per store
    const storeRevenue = await this.storeRepository
      .createQueryBuilder('store')
      .leftJoin('store.orders', 'order')
      .select([
        'store.store_id',
        'store.name',
        'SUM(order.total_amount) as "totalRevenue"',
      ])
      .groupBy('store.store_id')
      .addGroupBy('store.name')
      .getRawMany();

    if (!storeRevenue) {
      throw new NotFoundException('No store revenue data found');
    }

    // trend of new stores over time
    const newStoresTrend = await this.storeRepository
      .createQueryBuilder('store')
      .select(
        "DATE_TRUNC('month', store.created_at) AS month, COUNT(store.store_id) AS storeCount",
      )
      .groupBy('month')
      .orderBy('month', 'ASC')
      .getRawMany();

    if (!newStoresTrend) {
      throw new NotFoundException('No new stores trend data found');
    }

    //Store Order Volume (trends, per store)
    const storeOrderVolume = await this.storeRepository
      .createQueryBuilder('store')
      .leftJoin('store.orders', 'order')
      .select([
        'store.store_id',
        'store.name',
        "DATE_TRUNC('month', order.created_at) AS month",
        'COUNT(order.order_id) AS orderCount',
      ])
      .groupBy('store.store_id')
      .addGroupBy('store.name')
      .addGroupBy('month')
      .orderBy('month', 'ASC')
      .getRawMany();

    return {
      totalStores,
      verifiedStores,
      unverifiedStores,
      storeRevenue,
      topPerformingStore,
      newStoresTrend,
      storeOrderVolume,
    };
  }
}
