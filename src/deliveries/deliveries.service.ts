import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { UpdateDeliveryDto } from './dto/update-delivery.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, Role } from 'src/users/entities/user.entity';
import { Order, OrderStatus } from 'src/orders/entities/order.entity';
import { Delivery, DeliveryStatus } from './entities/delivery.entity';
import { Store } from 'src/store/entities/store.entity';
import { Payment, PaymentStatus } from 'src/payments/entities/payment.entity';
import axios from 'axios';
import { PaystackTransferService } from 'src/payments/paystack-transfer.service';

interface RouteInfo {
  coordinates: number[][];
  distance: number; // in meters
  duration: number; // in seconds
  summary: any;
  geometry: any;
  bbox: any;
}

@Injectable()
export class DeliveriesService {
  private readonly logger = new Logger(DeliveriesService.name);

  constructor(
    @InjectRepository(Delivery)
    private deliveriesRepository: Repository<Delivery>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    @InjectRepository(Store)
    private storesRepository: Repository<Store>,
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
    private paystackTransferService: PaystackTransferService,
  ) {}

  async create(createDeliveryDto: CreateDeliveryDto) {
    const delivery = this.deliveriesRepository.create({
      ...createDeliveryDto,
      delivery_status: DeliveryStatus.PENDING,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return await this.deliveriesRepository.save(delivery);
  }

  // 1. Payment Verification
  async verifyOrderPayment(orderId: number): Promise<boolean> {
    const payment = await this.paymentsRepository.findOne({
      where: {
        order_id: orderId,
        status: PaymentStatus.COMPLETED,
      },
    });

    return !!payment;
  }

  // 2. Find Available Drivers
  async findAvailableDrivers(): Promise<User[]> {
    return await this.usersRepository.find({
      where: {
        role: Role.Driver,
      },
      relations: ['profile', 'profile.addresses'],
    });
  }

  async getCoordinatesFromAddress(
    userId: number,
  ): Promise<{ latitude: number; longitude: number } | null> {
    const user = await this.usersRepository.findOne({
      where: { user_id: userId },
      relations: ['profile', 'profile.addresses'],
    });

    if (!user?.profile?.addresses?.length) {
      throw new NotFoundException(`No address found for user ID ${userId}`);
    }

    const address = user.profile.addresses[0];

    if (address.latitude && address.longitude) {
      return {
        latitude: address.latitude,
        longitude: address.longitude,
      };
    }

    // If no coordinates in address, geocode the address
    const locationString = `${address.area}, ${address.town}, ${address.county}, ${address.country}`;
    return await this.getGeocodedLocation(locationString);
  }

  // 4. Calculate distance between two points
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    return distance;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // 5. Find best available driver for a store
  // Also update findBestDriverForStore method
  async findBestDriverForStore(storeId: number): Promise<User | null> {
    // Get store coordinates directly
    const storeCoords = await this.getStoreCoordinates(storeId);

    if (!storeCoords) {
      throw new NotFoundException(
        `Cannot get coordinates for store ${storeId}`,
      );
    }

    // Get available drivers
    const availableDrivers = await this.findAvailableDrivers();

    if (!availableDrivers.length) {
      return null;
    }

    // Find closest driver
    let bestDriver: User | null = null;
    let shortestDistance = Infinity;

    for (const driver of availableDrivers) {
      const driverCoords = await this.getCoordinatesFromAddress(driver.user_id);

      if (driverCoords) {
        const distance = this.calculateDistance(
          storeCoords.latitude,
          storeCoords.longitude,
          driverCoords.latitude,
          driverCoords.longitude,
        );

        if (distance < shortestDistance) {
          shortestDistance = distance;
          bestDriver = driver;
        }
      }
    }

    return bestDriver;
  }

  // Enhanced geocoding method (existing)
  async getGeocodedLocation(
    location: string,
  ): Promise<{ latitude: number; longitude: number } | null> {
    try {
      const API_KEY = process.env.OPENROUTESERVICE_API_KEY;
      const response = await axios.get(
        `https://api.openrouteservice.org/geocode/search?api_key=${API_KEY}&text=${encodeURIComponent(location)}`,
        {
          headers: {
            Accept:
              'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
          },
        },
      );

      const data = response.data;

      if (data.features && data.features.length > 0) {
        const firstFeature = data.features[0];

        if (firstFeature.geometry && firstFeature.geometry.coordinates) {
          const [longitude, latitude] = firstFeature.geometry.coordinates;
          return { latitude, longitude };
        } else {
          return null;
        }
      } else {
        this.logger.warn(`No geocoding results for: ${location}`);
        return null;
      }
    } catch (error) {
      this.logger.error('Geocoding error:', error);
      return null;
    }
  }

  // Enhanced directions method (existing)
  async getDirections(
    start: { latitude: number; longitude: number },
    end: { latitude: number; longitude: number },
  ): Promise<RouteInfo | null> {
    try {
      const API_KEY = process.env.OPENROUTESERVICE_API_KEY;
      const response = await axios.get(
        `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${API_KEY}&start=${start.longitude},${start.latitude}&end=${end.longitude},${end.latitude}`,
        {
          headers: {
            Accept:
              'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
          },
        },
      );

      const data = response.data;

      if (data.features && data.features.length > 0) {
        const route = data.features[0];

        if (route.properties && route.geometry) {
          const routeInfo: RouteInfo = {
            coordinates: route.geometry.coordinates,
            distance: route.properties.segments?.[0]?.distance || 0,
            duration: route.properties.segments?.[0]?.duration || 0,
            summary: route.properties.summary || {},
            geometry: route.geometry,
            bbox: data.bbox || route.bbox,
          };

          return routeInfo;
        } else {
          return null;
        }
      } else {
        return null;
      }
    } catch (error) {
      this.logger.error('Directions error:', error);
      return null;
    }
  }

  async getStoreCoordinates(
    storeId: number,
  ): Promise<{ latitude: number; longitude: number } | null> {
    const store = await this.storesRepository.findOne({
      where: { store_id: storeId },
      relations: ['address'], // Assuming store has direct address relation
    });

    if (!store) {
      throw new NotFoundException(`Store ${storeId} not found`);
    }

    if (!store.address) {
      throw new NotFoundException(`No address found for store ${storeId}`);
    }

    if (store.address.latitude && store.address.longitude) {
      return {
        latitude: store.address.latitude,
        longitude: store.address.longitude,
      };
    }

    // If no coordinates in address, geocode the store address
    const locationString = `${store.address.area}, ${store.address.town}, ${store.address.county}, ${store.address.country}`;
    return await this.getGeocodedLocation(locationString);
  }

  // 6. Complete delivery workflow
  async createDeliveryWorkflow(orderId: number): Promise<any> {
    // Prevent duplicate deliveries for the same order
    this.logger.log(`Starting delivery workflow for order ${orderId}`);
    const existingDelivery = await this.deliveriesRepository.findOne({
      where: { order_id: orderId },
    });

    if (existingDelivery) {
      this.logger.warn(`Delivery already exists for order ${orderId}`);
      return {
        delivery: existingDelivery,
        message: 'Delivery already exists for this order',
      };
    }

    try {
      // Step 1: Verify payment
      const isPaymentCompleted = await this.verifyOrderPayment(orderId);
      if (!isPaymentCompleted) {
        throw new Error(`Payment not completed for order ${orderId}`);
      }

      // Get order details
      const order = await this.ordersRepository.findOne({
        where: { order_id: orderId },
        relations: ['user', 'store'],
      });

      if (!order) {
        throw new NotFoundException(`Order ${orderId} not found`);
      }

      // Step 2: Find best available driver
      const assignedDriver = await this.findBestDriverForStore(order.store_id);
      if (!assignedDriver) {
        throw new Error(`No available driver found for order ${orderId}`);
      }

      // Step 3: Get coordinates
      const storeCoords = await this.getStoreCoordinates(order.store_id);
      const customerCoords = await this.getCoordinatesFromAddress(
        order.user_id,
      );

      if (!storeCoords || !customerCoords) {
        throw new Error('Unable to get coordinates for delivery route');
      }

      // Step 4: Calculate route
      const routeInfo = await this.getDirections(storeCoords, customerCoords);
      if (!routeInfo) {
        throw new Error('Unable to calculate delivery route');
      }

      // Step 5: Calculate estimated delivery time
      const estimatedDeliveryTime = new Date();
      estimatedDeliveryTime.setMinutes(
        estimatedDeliveryTime.getMinutes() + Math.ceil(routeInfo.duration / 60),
      );

      // Step 6: Create delivery record
      const delivery = this.deliveriesRepository.create({
        order_id: order.order_id,
        driver_id: assignedDriver.user_id,
        user_id: order.user_id,
        store_id: order.store_id,
        delivery_address: order.delivery_address,
        delivery_status: DeliveryStatus.ASSIGNED,
        estimated_delivery_time: estimatedDeliveryTime,
        delivery_fee: order.delivery_fee,
        route_distance: routeInfo.distance,
        route_duration: routeInfo.duration,
        route_coordinates: JSON.stringify(routeInfo.coordinates),
        route_geometry: JSON.stringify(routeInfo.geometry),
        created_at: new Date(),
        updated_at: new Date(),
      });

      const savedDelivery = await this.deliveriesRepository.save(delivery);

      // Step 7: Update order with driver assignment
      await this.ordersRepository.update(orderId, {
        driver_id: assignedDriver.user_id,
        status: OrderStatus.IN_TRANSIT,
      });

      this.logger.log(`Finished delivery workflow for order ${orderId}`);
      // Return complete delivery information
      return {
        delivery: savedDelivery,
        route: {
          distance: `${(routeInfo.distance / 1000).toFixed(2)} km`,
          duration: `${Math.ceil(routeInfo.duration / 60)} minutes`,
          coordinates: routeInfo.coordinates,
          geometry: routeInfo.geometry,
        },
        driver: {
          id: assignedDriver.user_id,
          name: `${assignedDriver.profile?.first_name} ${assignedDriver.profile?.last_name}`,
          phone: assignedDriver.profile?.phone_number,
        },
        estimatedDeliveryTime,
      };
    } catch (error) {
      this.logger.error(
        `Delivery workflow failed for order ${orderId}:`,
        error,
      );
      throw error;
    }
  }

  // Enhanced delivery details method
  async deliveryDetails(orderId: number): Promise<any> {
    const delivery = await this.deliveriesRepository.findOne({
      where: { order_id: orderId },
      relations: ['order', 'driver', 'driver.profile', 'user', 'user.profile'],
    });

    if (!delivery) {
      throw new NotFoundException(`Delivery for order ${orderId} not found`);
    }

    const routeCoordinates = delivery.route_coordinates
      ? JSON.parse(delivery.route_coordinates)
      : null;

    return {
      delivery_id: delivery.delivery_id,
      order_id: delivery.order_id,
      status: delivery.delivery_status,
      driver: {
        id: delivery.driver_id,
        name: `${delivery.driver.profile?.first_name} ${delivery.driver.profile?.last_name}`,
        phone: delivery.driver.profile?.phone_number,
      },
      customer: {
        id: delivery.user_id,
        name: `${delivery.user.profile?.first_name} ${delivery.user.profile?.last_name}`,
        phone: delivery.user.profile?.phone_number,
      },
      route: {
        distance: `${((delivery.route_distance ?? 0) / 1000).toFixed(2)} km`,
        duration: `${Math.ceil((delivery.route_duration ?? 0) / 60)} minutes`,
        coordinates: routeCoordinates,
      },
      delivery_address: delivery.delivery_address,
      estimated_delivery_time: delivery.estimated_delivery_time,
      delivery_fee: delivery.delivery_fee,
      created_at: delivery.created_at,
      updated_at: delivery.updated_at,
    };
  }

  // Update delivery status
  async updateDeliveryStatus(
    deliveryId: number,
    status: DeliveryStatus,
  ): Promise<Delivery> {
    const delivery = await this.deliveriesRepository.findOne({
      where: { delivery_id: deliveryId },
    });

    if (!delivery) {
      throw new NotFoundException(`Delivery ${deliveryId} not found`);
    }

    delivery.delivery_status = status;
    delivery.updated_at = new Date();

    if (status === DeliveryStatus.DELIVERED) {
      delivery.delivered_at = new Date();

      // Update order status
      await this.ordersRepository.update(delivery.order_id, {
        status: OrderStatus.DELIVERED,
        delivered_at: new Date(),
      });
    }

    return await this.deliveriesRepository.save(delivery);
  }

  findAll() {
    return this.deliveriesRepository.find({
      relations: ['order', 'driver', 'driver.profile', 'user', 'user.profile', 'user.profile.addresses'],
    });
  }

  findOne(id: number) {
    return this.deliveriesRepository.findOne({
      where: { delivery_id: id },
      relations: ['order', 'driver', 'driver.profile', 'user', 'user.profile'],
    });
  }

  async update(id: number, updateDeliveryDto: UpdateDeliveryDto) {
    const delivery = await this.deliveriesRepository.findOne({
      where: { delivery_id: id },
    });

    if (!delivery) {
      throw new NotFoundException(`Delivery ${id} not found`);
    }

    Object.assign(delivery, updateDeliveryDto);
    delivery.updated_at = new Date();

    return await this.deliveriesRepository.save(delivery);
  }

  async remove(id: number) {
    const delivery = await this.deliveriesRepository.findOne({
      where: { delivery_id: id },
    });

    if (!delivery) {
      throw new NotFoundException(`Delivery ${id} not found`);
    }

    await this.deliveriesRepository.remove(delivery);
    return { message: `Delivery ${id} has been removed` };
  }

  // In your delivery service
async completeDelivery(orderId: string, vendorData: any, driverData: any) {
  try {
    const result = await this.paystackTransferService.payVendorAndDriver(
      {
        name: 'Store Vendor',
        accountNumber: '0701234567', // Mobile money number
        bankCode: 'SFB', // Safaricom bank code for M-Pesa
        amount: 1000, // Amount in KES
      },
      {
        name: 'Dr. Smith',
        accountNumber: '0712345678',
        bankCode: 'SFB',
        amount: 500,
      },
      orderId
    );
    
    console.log('Payments processed:', result);
  } catch (error) {
    console.error('Payment failed:', error);
  }
}
}
