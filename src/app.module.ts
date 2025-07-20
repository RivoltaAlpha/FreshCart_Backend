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
import { ThrottlerModule } from '@nestjs/throttler';
import { InventoriesModule } from './inventories/inventories.module';
import { CategoriesModule } from './categories/categories.module';
import { StoreModule } from './store/store.module';
import { ProfileModule } from './profile/profile.module';
import { AddressesModule } from './addresses/addresses.module';
import { OrderItemModule } from './order-item/order-item.module';
import { DeliveriesModule } from './deliveries/deliveries.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { FeedbackModule } from './feedback/feedback.module';
import { PaystackTransferModule } from './payments/paystack-transfer.module';

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
    DeliveriesModule,
    EventEmitterModule.forRoot(),
    FeedbackModule,
    PaystackTransferModule,
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
    }
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
