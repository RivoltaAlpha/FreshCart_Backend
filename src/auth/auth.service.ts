import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateAuthDto } from './dto/signup.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Role, User } from 'src/users/entities/user.entity';
import { DataSource, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Profile } from 'src/profile/entities/profile.entity';
import { LoginDto } from './dto/signin.dto';
import { Address } from 'src/addresses/entities/address.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Profile)
    private profileService: Repository<Profile>,
    @InjectRepository(Address) // Add Address repository
    private addressRepository: Repository<Address>,
    private configService: ConfigService,
    private jwtService: JwtService,
    private readonly dataSource: DataSource,
  ) {}

  private async getTokens(userId: number, email: string, role: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, email: email, role: role },
        {
          secret: this.configService.getOrThrow<string>(
            'JWT_ACCESS_TOKEN_SECRET',
          ),
          expiresIn: this.configService.getOrThrow<string>(
            'JWT_ACCESS_TOKEN_EXPIRES_IN',
          ),
        },
      ),
      this.jwtService.signAsync(
        { sub: userId, email: email, role: role },
        {
          secret: this.configService.getOrThrow<string>(
            'JWT_REFRESH_TOKEN_SECRET',
          ),
          expiresIn: this.configService.getOrThrow<string>(
            'JWT_REFRESH_TOKEN_EXPIRES_IN',
          ),
        },
      ),
    ]);
    return { accessToken, refreshToken };
  }

  private async hashData(data: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(data, salt);
  }

  private async saveRefreshToken(userId: number, refreshToken: string) {
    const hashedToken = await this.hashData(refreshToken);
    await this.userRepository.update(userId, {
      hashedRefreshToken: hashedToken,
    });
  }

  private async generateTokens(userId: number, email: string, role: string) {
    const accessToken = this.jwtService.sign(
      { sub: userId, email: email, role: role },
      {
        secret: this.configService.getOrThrow<string>(
          'JWT_ACCESS_TOKEN_SECRET',
        ),
        expiresIn: '1h',
      },
    );
    const refreshToken = this.jwtService.sign(
      { sub: userId, email: email, role: role },
      {
        secret: this.configService.getOrThrow<string>(
          'JWT_REFRESH_TOKEN_SECRET',
        ),
        expiresIn: '7d',
      },
    );
    return { accessToken, refreshToken };
  }

  async SignUp(createAuthDto: CreateAuthDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const existingUser = await this.userRepository.findOne({
        where: { email: createAuthDto.email },
        select: ['user_id', 'profile'],
      });

      if (existingUser) {
        throw new ConflictException('User already exists');
      }
      // Validate required fields
      if (!createAuthDto.first_name || !createAuthDto.last_name) {
        throw new BadRequestException('First name and last name are required');
      }
      const hashedPassword = await bcrypt.hash(createAuthDto.password, 10);
      const profile = this.profileService.create({
        first_name: createAuthDto.first_name,
        last_name: createAuthDto.last_name,
        phone_number: createAuthDto.phone_number,
      });
      const savedProfile = await queryRunner.manager.save(profile);

      // Step 2: Create address
      const address = this.addressRepository.create({
        area: createAuthDto.area,
        town: createAuthDto.town,
        county: createAuthDto.county,
        country: createAuthDto.country || 'Kenya',
        type: 'home',
        isDefault: true,
        profile: savedProfile,
      });

      await queryRunner.manager.save(address);

      const user = this.userRepository.create({
        email: createAuthDto.email,
        password: hashedPassword,
        role: createAuthDto.role as Role,
        profile_id: savedProfile.profile_id,
      });

      // generate tokens
      const savedUser = await queryRunner.manager.save(user);

      const { accessToken, refreshToken } = await this.generateTokens(
        savedUser.user_id,
        savedUser.email,
        savedUser.role,
      );
      // Save refresh token in the database
      await this.saveRefreshToken(savedUser.user_id, refreshToken);
      await queryRunner.commitTransaction();
      // Return user and tokens
      const userWithProfile = await this.userRepository.findOne({
        where: { user_id: savedUser.user_id },
        relations: ['profile'],
        select: {
          user_id: true,
          email: true,
          role: true,
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
      return {
        user: userWithProfile,
        tokens: { accessToken, refreshToken },
        isAuthenticated: true,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async SignIn(loginDto: LoginDto) {
    const foundUser = await this.userRepository.findOne({
      where: { email: loginDto.email },
      relations: ['profile'],
        select: {
          user_id: true,
          email: true,
          role: true,
          password: true,
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

    if (!foundUser) {
      throw new NotFoundException(
        `User with email ${loginDto.email} not found`,
      );
    }

    const foundPassword = await bcrypt.compare(
      loginDto.password,
      foundUser.password,
    );

    if (!foundPassword) {
      throw new UnauthorizedException('Invalid password');
    }

    // Generate tokens
    const { accessToken, refreshToken } = await this.getTokens(
      foundUser.user_id,
      foundUser.email,
      foundUser.role,
    );

    // Save refresh token in the database
    await this.saveRefreshToken(foundUser.user_id, refreshToken);

    const { password, ...userWithoutPassword } = foundUser;

    // Return user and tokens
    return {
      user: userWithoutPassword,
      tokens: { accessToken, refreshToken },
      isAuthenticated: true,
    };
  }

  async signOut(userId: number) {
    // set user refresh token to null
    const res = await this.userRepository.update(userId, {
      hashedRefreshToken: null,
    });

    if (res.affected === 0) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    return { message: `User with id : ${userId} signed out successfully` };
  }

  async refreshTokens(userId: number, refreshToken: string) {
    const foundUser = await this.userRepository.findOne({
      where: { user_id: userId },
      select: ['user_id', 'email', 'hashedRefreshToken', 'role'], // Select only necessary fields
    });

    if (!foundUser) {
      throw new Error('User not found');
    }
    if (!foundUser.hashedRefreshToken) {
      throw new Error('Refresh token not found');
    }

    // Verify the refresh token
    const isRefreshTokenValid = await bcrypt.compare(
      refreshToken,
      foundUser.hashedRefreshToken, // Assuming hashedRefreshToken is stored in the user entity
    );

    if (!isRefreshTokenValid) {
      throw new Error('Invalid refresh token');
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await this.generateTokens(
        foundUser.user_id,
        foundUser.email,
        foundUser.role,
      );
    await this.saveRefreshToken(foundUser.user_id, newRefreshToken);

    return { accessToken, refreshToken: newRefreshToken };
  }
}
