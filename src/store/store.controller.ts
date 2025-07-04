import {Controller,Get,Post,Body,Patch,Param,Delete,Query,Request,ParseIntPipe} from '@nestjs/common';
import { StoreService } from './store.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/role.decorators';
import { Role } from 'src/users/entities/user.entity';


@ApiTags('Stores')
@ApiBearerAuth('access-token')
@Controller('stores')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Post()
  @Roles(Role.Store, Role.Admin)
  @ApiOperation({ summary: 'Create a new store' })
  @ApiResponse({ status: 201, description: 'Store successfully created' })
  @ApiResponse({ status: 403, description: 'Only Store role users can create stores' })
  @ApiResponse({ status: 409, description: 'User already has a store' })
  create(@Body() createStoreDto: CreateStoreDto) {
    return this.storeService.create(createStoreDto);
  }

  @Get('all')
  @ApiOperation({ summary: 'Get all stores' })
  findAll() {
    return this.storeService.findAll();
  }

  @Get('location/:city')
  @ApiOperation({ summary: 'Get stores by location' })
  @ApiQuery({ name: 'state', required: false, description: 'State/County filter' })
  findByLocation(
    @Param('city') city: string,
    @Query('state') state?: string,
  ) {
    return this.storeService.findByLocation(city, state);
  }

  @Get('owner/:ownerId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get store by owner ID' })
  findByOwner(@Param('ownerId', ParseIntPipe) ownerId: number) {
    return this.storeService.findByOwner(ownerId);
  }

  @Get(':id')
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

  @Post(':id/rate')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Rate a store' })
  rateStore(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { rating: number },
  ) {
    return this.storeService.updateRating(id, body.rating);
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