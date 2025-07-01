import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { ProductsModule } from './products/products.module';
import { CartModule } from './cart/cart.module';
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


@Module({
  imports: [
    ProductsModule,
    CartModule,
    PaymentsModule,
    OrdersModule,
    UsersModule,
    AuthModule,
    DatabaseModule,
    TypeOrmModule.forFeature([User]),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
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
          ignoreUserAgents: [/^curl\//], // Ignore specific user agents
        },
      ],
    }),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      isGlobal: true, // Make cache globally available
      useFactory: (configService: ConfigService) => {
        return {
          ttl: 60000, // Default TTL for cache entries
          stores: [
            createKeyv(configService.getOrThrow<string>('REDIS_URL')),

            // Using CacheableMemory for in-memory caching
            new Keyv({
              store: new CacheableMemory({ ttl: 30000, lruSize: 5000 }),
            }),
          ],
          logger: true, // Enable logging for cache operations
        };
      },
    }),
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
      useClass: CacheInterceptor, // Global cache interceptor
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
