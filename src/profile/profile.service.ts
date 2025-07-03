import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Profile } from './entities/profile.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
  ) {}

  async create(createProfileDto: CreateProfileDto): Promise<Profile> {
    const profile = this.profileRepository.create(createProfileDto);
    return await this.profileRepository.save(profile);
  }

  async findByUserId(userId: number): Promise<Profile> {
    const profile = await this.profileRepository.findOne({
      where: { user: { user_id: userId } },
      relations: ['addresses'],
      
    });

    if (!profile) {
      throw new NotFoundException(`Profile for user ${userId} not found`);
    }

    return profile;
  }

  async update(profileId: number, updateProfileDto: UpdateProfileDto): Promise<Profile> {
    const profile = await this.profileRepository.findOne({
      where: { profile_id: profileId },
    });

    if (!profile) {
      throw new NotFoundException(`Profile with ID ${profileId} not found`);
    }

    Object.assign(profile, updateProfileDto);
    return await this.profileRepository.save(profile);
  }

  async remove(profileId: number): Promise<void> {
    const profile = await this.profileRepository.findOne({
      where: { profile_id: profileId },
    });

    if (!profile) {
      throw new NotFoundException(`Profile with ID ${profileId} not found`);
    }

    await this.profileRepository.remove(profile);
  }
}
