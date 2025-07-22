import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { DatabaseModule } from 'src/database/database.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Feedback } from 'src/feedback/entities/feedback.entity';
import { Payment } from 'src/payments/entities/payment.entity';

@Module({
  imports: [DatabaseModule, TypeOrmModule.forFeature([User, Feedback, Payment])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
