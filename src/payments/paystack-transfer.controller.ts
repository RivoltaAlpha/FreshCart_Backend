import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import {
  PaystackTransferService,
  CreateTransferRecipientDto,
  BulkCreateTransferRecipientDto,
  InitiateTransferDto,
  BulkTransferDto,
} from './paystack-transfer.service';

// Additional DTOs for controller endpoints
export class PayVendorAndDoctorDto {
  vendorData: {
    name: string;
    accountNumber: string;
    bankCode: string;
    amount: number;
  };
  doctorData: {
    name: string;
    accountNumber: string;
    bankCode: string;
    amount: number;
  };
  orderId: string;
}

export class FinalizeTransferDto {
  transferCode: string;
  otp: string;
}

@ApiTags('Paystack Transfers')
@Controller('paystack/transfers')
export class PaystackTransferController {
  constructor(private readonly paystackTransferService: PaystackTransferService) {}

  @Post('recipients')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a transfer recipient' })
  @ApiBody({ type: CreateTransferRecipientDto })
  @ApiResponse({ status: 201, description: 'Transfer recipient created successfully' })
  async createTransferRecipient(@Body() createRecipientDto: CreateTransferRecipientDto) {
    return this.paystackTransferService.createTransferRecipient(createRecipientDto);
  }

  @Post('recipients/bulk')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Bulk create transfer recipients' })
  @ApiBody({ type: BulkCreateTransferRecipientDto })
  @ApiResponse({ status: 201, description: 'Transfer recipients created successfully' })
  async bulkCreateTransferRecipients(@Body() bulkCreateDto: BulkCreateTransferRecipientDto) {
    return this.paystackTransferService.bulkCreateTransferRecipients(bulkCreateDto);
  }

//   @Get('recipients')
//   @ApiOperation({ summary: 'Get all transfer recipients' })
//   @ApiResponse({ status: 200, description: 'Transfer recipients retrieved successfully' })
//   async getTransferRecipients(
//     @Query('page') page: number = 1,
//     @Query('perPage') perPage: number = 50,
//   ) {
//     return this.paystackTransferService.getTransferRecipients(page, perPage);
//   }

//   @Get('recipients/:idOrCode')
//   @ApiOperation({ summary: 'Get a transfer recipient by ID or code' })
//   @ApiResponse({ status: 200, description: 'Transfer recipient retrieved successfully' })
//   async getTransferRecipient(@Param('idOrCode') idOrCode: string) {
//     return this.paystackTransferService.getTransferRecipient(idOrCode);
//   }

  @Post('initiate/bulk')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Initiate bulk transfers' })
  @ApiBody({ type: BulkTransferDto })
  @ApiResponse({ status: 200, description: 'Bulk transfer initiated successfully' })
  async initiateBulkTransfer(@Body() bulkTransferDto: BulkTransferDto) {
    return this.paystackTransferService.initiateBulkTransfer(bulkTransferDto);
  }

  @Get('verify/:reference')
  @ApiOperation({ summary: 'Verify transfer status' })
  @ApiResponse({ status: 200, description: 'Transfer status retrieved successfully' })
  async verifyTransfer(@Param('reference') reference: string) {
    return this.paystackTransferService.verifyTransfer(reference);
  }

  @Post('finalize')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Finalize transfer with OTP' })
  @ApiBody({ type: FinalizeTransferDto })
  @ApiResponse({ status: 200, description: 'Transfer finalized successfully' })
  async finalizeTransfer(@Body() finalizeDto: FinalizeTransferDto) {
    return this.paystackTransferService.finalizeTransfer(
      finalizeDto.transferCode,
      finalizeDto.otp,
    );
  }
}
