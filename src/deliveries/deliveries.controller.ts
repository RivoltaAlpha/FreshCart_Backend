import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { DeliveriesService } from './deliveries.service';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { UpdateDeliveryDto } from './dto/update-delivery.dto';
import { DeliveryStatus } from './entities/delivery.entity';

@Controller('deliveries')
export class DeliveriesController {
  constructor(private readonly deliveriesService: DeliveriesService) {}

  @Post()
  create(@Body() createDeliveryDto: CreateDeliveryDto) {
    return this.deliveriesService.create(createDeliveryDto);
  }

  // Create delivery workflow for an order
  @Post('workflow/:orderId')
  async createDeliveryWorkflow(
    @Param('orderId', ParseIntPipe) orderId: number,
  ) {
    try {
      return await this.deliveriesService.createDeliveryWorkflow(orderId);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create delivery workflow',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Get delivery details by order ID
  @Get('order/:orderId')
  async getDeliveryByOrder(@Param('orderId', ParseIntPipe) orderId: number) {
    try {
      return await this.deliveriesService.deliveryDetails(orderId);
    } catch (error) {
      throw new HttpException(
        error.message || 'Delivery not found',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  // Update delivery status
  @Patch(':deliveryId/status')
  async updateDeliveryStatus(
    @Param('deliveryId', ParseIntPipe) deliveryId: number,
    @Body('status') status: DeliveryStatus,
  ) {
    try {
      return await this.deliveriesService.updateDeliveryStatus(
        deliveryId,
        status,
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to update delivery status',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Verify order payment status
  @Get('payment/verify/:orderId')
  async verifyOrderPayment(@Param('orderId', ParseIntPipe) orderId: number) {
    try {
      const isVerified =
        await this.deliveriesService.verifyOrderPayment(orderId);
      return { orderId, paymentVerified: isVerified };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to verify payment',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Get available drivers
  @Get('drivers/available')
  async getAvailableDrivers() {
    try {
      return await this.deliveriesService.findAvailableDrivers();
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch available drivers',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Find best driver for a store
  @Get('drivers/best-match/:storeId')
  async findBestDriverForStore(
    @Param('storeId', ParseIntPipe) storeId: number,
  ) {
    try {
      const driver =
        await this.deliveriesService.findBestDriverForStore(storeId);
      if (!driver) {
        return {
          message: 'No available driver found for this store',
          driver: null,
        };
      }
      return { driver };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to find best driver',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Get route information between two points
  @Post('route/calculate')
  async calculateRoute(
    @Body()
    routeData: {
      start: { latitude: number; longitude: number };
      end: { latitude: number; longitude: number };
    },
  ) {
    try {
      const route = await this.deliveriesService.getDirections(
        routeData.start,
        routeData.end,
      );

      if (!route) {
        return { message: 'Route not found', route: null };
      }

      return {
        route: {
          distance: `${(route.distance / 1000).toFixed(2)} km`,
          duration: `${Math.ceil(route.duration / 60)} minutes`,
          coordinates: route.coordinates,
          geometry: route.geometry,
        },
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to calculate route',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Get coordinates for a user address
  @Get('coordinates/user/:userId')
  async getUserCoordinates(@Param('userId', ParseIntPipe) userId: number) {
    try {
      const coordinates =
        await this.deliveriesService.getCoordinatesFromAddress(userId);
      return { userId, coordinates };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get user coordinates',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  // Geocode an address
  @Post('geocode')
  async geocodeAddress(@Body('address') address: string) {
    try {
      if (!address) {
        throw new HttpException('Address is required', HttpStatus.BAD_REQUEST);
      }

      const coordinates =
        await this.deliveriesService.getGeocodedLocation(address);
      return { address, coordinates };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to geocode address',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Get all deliveries for a specific driver
  @Get('driver/:driverId')
  async getDriverDeliveries(@Param('driverId', ParseIntPipe) driverId: number) {
    try {
      const deliveries = await this.deliveriesService.findAll();
      const driverDeliveries = deliveries.filter(
        (delivery) => delivery.driver_id === driverId,
      );
      return driverDeliveries;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch driver deliveries',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Get all deliveries for a specific customer
  @Get('customer/:customerId')
  async getCustomerDeliveries(
    @Param('customerId', ParseIntPipe) customerId: number,
  ) {
    try {
      const deliveries = await this.deliveriesService.findAll();
      const customerDeliveries = deliveries.filter(
        (delivery) => delivery.user_id === customerId,
      );
      return customerDeliveries;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch customer deliveries',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Get deliveries by status
  @Get('status/:status')
  async getDeliveriesByStatus(@Param('status') status: DeliveryStatus) {
    try {
      const deliveries = await this.deliveriesService.findAll();
      const statusDeliveries = deliveries.filter(
        (delivery) => delivery.delivery_status === status,
      );
      return statusDeliveries;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch deliveries by status',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('test/workflow/:orderId')
  async testDeliveryWorkflow(@Param('orderId', ParseIntPipe) orderId: number) {
    try {
      // Test the complete workflow
      const result =
        await this.deliveriesService.createDeliveryWorkflow(orderId);
      return {
        success: true,
        message: 'Delivery workflow completed successfully',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Delivery workflow test failed',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get()
  findAll() {
    return this.deliveriesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.deliveriesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDeliveryDto: UpdateDeliveryDto,
  ) {
    return this.deliveriesService.update(id, updateDeliveryDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.deliveriesService.remove(id);
  }
}
