import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { ProductsModule } from './products/products.module';
import { PaymentsModule } from './payments/payments.module';
import { OrdersModule } from './orders/orders.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { AtGuard } from './auth/guards/at.guards';
import { RolesGuard } from './auth/guards/roles.guard';
import { LoggerMiddleware } from './logger.middleware';
import { DatabaseModule } from './database/database.module';
import { User } from './users/entities/user.entity';
import { CacheInterceptor, CacheModule } from '@nestjs/cache-manager';
import { CacheableMemory} from 'cacheable';
import { createKeyv, Keyv } from '@keyv/redis';
import { ThrottlerModule } from '@nestjs/throttler';
import { InventoriesModule } from './inventories/inventories.module';
import { CategoriesModule } from './categories/categories.module';
import { StoreModule } from './store/store.module';
import { ProfileModule } from './profile/profile.module';
import { AddressesModule } from './addresses/addresses.module';
import { OrderItemModule } from './order-item/order-item.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    TypeOrmModule.forFeature([User]), 
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.getOrThrow<number>('THROTTLER_TTL', {
            infer: true,
          }),
          limit: configService.getOrThrow<number>('THROTTLER_LIMIT', {
            infer: true,
          }),
          ignoreUserAgents: [/^curl\//], 
        },
      ],
    }),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      isGlobal: true, 
      useFactory: (configService: ConfigService) => {
        return {
          ttl: 60000, 
          stores: [
            createKeyv(configService.getOrThrow<string>('REDIS_URL')),

            new Keyv({
              store: new CacheableMemory({ ttl: 30000, lruSize: 5000 }),
            }),
          ],
          logger: true,
        };
      },
    }),
    ProductsModule,
    PaymentsModule,
    OrdersModule,
    UsersModule,
    InventoriesModule,
    CategoriesModule,
    AuthModule,
    StoreModule,
    ProfileModule,
    AddressesModule,
    OrderItemModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AtGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: 'APP_INTERCEPTOR',
      useClass: CacheInterceptor, 
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
