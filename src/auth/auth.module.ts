import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { DatabaseModule } from 'src/database/database.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AccessStrategy } from './strategies/accsess.stategy';
import { RefreshStrategy } from './strategies/refresh.stategy';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [
    DatabaseModule,
    TypeOrmModule.forFeature([User]),
    JwtModule.register({
      global: true,
    }), // Register JwtModule globally
    PassportModule, // Import PassportModule to use guards
  ],
  providers: [AuthService, AccessStrategy, RefreshStrategy, RolesGuard],
  controllers: [AuthController],
  exports: [ RolesGuard], // Export RolesGuard for use in other modules
})
export class AuthModule {}
