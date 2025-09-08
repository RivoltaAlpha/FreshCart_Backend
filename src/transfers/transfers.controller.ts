import { Controller, Post, Body, Param, Get } from '@nestjs/common';
import { TransfersService, PaymentParticipant } from './transfers.service';
import { Roles } from 'src/auth/decorators/role.decorators';
import { Role } from 'src/users/entities/user.entity';

@Controller('transfers')
export class TransfersController {
  constructor(private readonly transfersService: TransfersService) {}

  // Test endpoint to trigger payment transfer manually
  @Post('pay')
  @Roles(Role.Admin)
  async pay(@Body() body: {
    order_id: number;
    delivery_id: number;
    store: PaymentParticipant;
    driver: PaymentParticipant;
  }) {
    return this.transfersService.processDeliveryPayments(body);
  }

  // Get all transfers for an order
  @Get('order/:order_id')
  @Roles(Role.Admin)
  async getTransfersByOrder(@Param('order_id') order_id: number) {
    return this.transfersService.getTransfersByOrder_id(Number(order_id));
  }

  // Get all transfers for a delivery
  @Get('delivery/:delivery_id')
  @Roles(Role.Admin)
  async getTransfersByDelivery(@Param('delivery_id') delivery_id: number) {
    return this.transfersService.getTransfersByDelivery_id(Number(delivery_id));
  }

  // Manually verify a transfer status
  @Post('verify/:reference')
  @Roles(Role.Admin)
  async verify(@Param('reference') reference: string) {
    return this.transfersService.verifyAndUpdateTransferStatus(reference);
  }
}