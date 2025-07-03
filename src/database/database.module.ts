import { Module } from '@nestjs/common';
import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
// Import all entities explicitly
import { User } from '../users/entities/user.entity';
import { Profile } from '../profile/entities/profile.entity';
import { Address } from '../addresses/entities/address.entity';
import { Product } from '../products/entities/product.entity';
import { Order } from '../orders/entities/order.entity';
import { Cart } from '../cart/entities/cart.entity';
import { Category } from '../categories/entities/category.entity';
import { Store } from '../store/entities/store.entity';
import { Inventory } from '../inventories/entities/inventory.entity';

// Load Environment Variables
config({
  path: ['.env', '.env.prod', '.env.local'],
});

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is not defined');
}
const sql = neon(process.env.DATABASE_URL!);

const dbProvider = {
  provide: 'POSTGRES_POOL',
  useValue: sql,
};

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.getOrThrow<string>('DB_HOST'),
        port: configService.getOrThrow<number>('DB_PORT'),
        username: configService.getOrThrow<string>('DB_USERNAME'),
        password: configService.getOrThrow<string>('DB_PASSWORD'),
        database: configService.getOrThrow<string>('DB_NAME'),
        entities: [
          User,
          Profile,
          Address,
          Product,
          Order,
          Cart,
          Category,
          Store,
          Inventory,
        ],
        synchronize: configService.getOrThrow<boolean>('DB_SYNC', true),
        logging: configService.getOrThrow<boolean>('DB_LOGGING', false),
        // ssl: { rejectUnauthorized: false },
        // url: process.env.DATABASE_URL,
        migrations: [__dirname + '/../migrations/**/*{.ts,.js}'],
      }),
      inject: [ConfigService], // Inject ConfigService to access configuration values
    }),
  ],
  providers: [dbProvider],
  exports: [dbProvider],
})
export class DatabaseModule {}
