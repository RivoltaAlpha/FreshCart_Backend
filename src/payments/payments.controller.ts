import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { PaymentsService, VerifyResponse,  } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { Roles } from 'src/auth/decorators/role.decorators';
import { Role } from 'src/users/entities/user.entity';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth('access-token')
@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('all')
  @Roles(Role.Customer)
  create(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.create(createPaymentDto);
  }

  @Post('initialize')
  @Roles(Role.Customer)
  initialize(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.initializePayment(createPaymentDto);
  }
  // verify
  @Get('verify/:reference')
  @Roles(Role.Customer)
  verifTransaction(@Param('reference') reference: string): Promise<VerifyResponse> {
    return this.paymentsService.verifyTransaction(reference);
  }

  // user payments
  @Get('user/:userId')
  @Roles(Role.Customer, Role.Admin, Role.Store)
  findUserPayments(@Param('userId') userId: number) {
    return this.paymentsService.findUserPayments(userId);
  }

  @Get()
  @Roles(Role.Customer, Role.Admin, Role.Store)
  findAll() {
    return this.paymentsService.findAll();
  }

  @Get(':id')
  @Roles(Role.Customer, Role.Admin, Role.Store)
  findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(+id);
  }

  @Patch(':id')
  @Roles(Role.Customer, Role.Admin, Role.Store)
  update(@Param('id') id: string, @Body() updatePaymentDto: UpdatePaymentDto) {
    return this.paymentsService.update(+id, updatePaymentDto);
  }

  @Delete(':id')
  @Roles(Role.Customer, Role.Admin, Role.Store)
  remove(@Param('id') id: string) {
    return this.paymentsService.remove(+id);
  }
}
