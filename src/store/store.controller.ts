import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { StoreService } from './store.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/role.decorators';
import { Role } from 'src/users/entities/user.entity';
import { Public } from 'src/auth/decorators/public.decorator';

@ApiTags('Stores')
@ApiBearerAuth('access-token')
@Controller('stores')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Post('create')
  @Public()
  @ApiOperation({ summary: 'Create a new store' })
  @ApiResponse({ status: 201, description: 'Store successfully created' })
  @ApiResponse({
    status: 403,
    description: 'Only Store role users can create stores',
  })
  @ApiResponse({ status: 409, description: 'User already has a store' })
  create(@Body() createStoreDto: CreateStoreDto) {
    return this.storeService.create(createStoreDto);
  }

  @Get('owner/:id')
  @ApiOperation({ summary: 'Get store by owner ID' })
  findByOwnerId(@Param('id', ParseIntPipe) id: number) {
    return this.storeService.findByOwnerId(id);
  }

  @Get('analytics')
  @Public()
  @ApiOperation({ summary: 'Get store analytics' })
  getStoreAnalytics() {
    return this.storeService.getStoreAnalytics();
  }

  @Get('all')
  @Public()
  @ApiOperation({ summary: 'Get all stores' })
  findAll() {
    return this.storeService.findAll();
  }

  @Get('unverified-stores')
  @Public()
  @ApiOperation({ summary: 'Get all unverified stores' })
  findUnverifiedStores() {
    return this.storeService.findUnverifiedStores();
  }

  @Get('location/:city')
  @Public()
  @ApiOperation({ summary: 'Get stores by location' })
  @ApiQuery({
    name: 'state',
    required: false,
    description: 'State/County filter',
  })
  findByLocation(@Param('city') city: string, @Query('state') state?: string) {
    return this.storeService.findByLocation(city, state);
  }

  @Post('rate/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Rate a store' })
  rateStore(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { rating: number },
  ) {
    return this.storeService.updateRating(id, body.rating);
  }

  @Patch('verify/:store_id')
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify store' })
  verifyStore(@Param('store_id', ParseIntPipe) storeId: number) {
    return this.storeService.verifyStore(storeId);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get store by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.storeService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.Store, Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update store' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStoreDto: UpdateStoreDto,
    @Request() req: any,
  ) {
    const userId = req.user?.role === Role.Admin ? undefined : req.user?.sub;
    return this.storeService.update(id, updateStoreDto, userId);
  }

  @Delete(':id')
  @Roles(Role.Store, Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete store' })
  remove(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    const userId = req.user?.role === Role.Admin ? undefined : req.user?.sub;
    return this.storeService.remove(id, userId);
  }
}
