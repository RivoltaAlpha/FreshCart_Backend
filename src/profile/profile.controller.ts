import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/role.decorators';
import { Role } from 'src/users/entities/user.entity';
import { Public } from 'src/auth/decorators/public.decorator';

@ApiBearerAuth('access-token')
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Post()
  @Public()
  create(@Body() createProfileDto: CreateProfileDto) {
    return this.profileService.create(createProfileDto);
  }

  @Get(':id')
  @Roles(Role.Customer, Role.Store, Role.Admin, Role.Driver)
  findOne(@Param('id') id: string) {
    return this.profileService.findByUserId(+id);
  }

  @Patch(':id')
  @Roles(Role.Customer, Role.Store, Role.Admin, Role.Driver)
  update(@Param('id') id: string, @Body() updateProfileDto: UpdateProfileDto) {
    return this.profileService.update(+id, updateProfileDto);
  }

  @Delete(':id')
  @Roles(Role.Customer, Role.Store, Role.Admin, Role.Driver)
  remove(@Param('id') id: string) {
    return this.profileService.remove(+id);
  }
}
