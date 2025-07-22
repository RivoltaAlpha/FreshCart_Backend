import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';
import { Roles } from 'src/auth/decorators/role.decorators';
import { Role } from 'src/users/entities/user.entity';

@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post('create')
  @Roles(Role.Customer)
  create(@Body() createFeedbackDto: CreateFeedbackDto) {
    return this.feedbackService.create(createFeedbackDto);
  }

  @Get('all')
  @Roles(Role.Customer, Role.Store, Role.Admin, Role.Driver)
  findAll() {
    return this.feedbackService.findAll();
  }

  @Get(':id')
  @Roles(Role.Customer, Role.Store, Role.Admin, Role.Driver)
  findOne(@Param('id') id: number) {
    return this.feedbackService.findOne(id);
  }

  @Patch('update/:id')
  @Roles(Role.Customer, Role.Store, Role.Admin, Role.Driver)
  update(@Param('id') id: number, @Body() updateFeedbackDto: UpdateFeedbackDto) {
    return this.feedbackService.update(id, updateFeedbackDto);
  }

  @Delete('remove/:id')
  @Roles(Role.Customer, Role.Store, Role.Admin, Role.Driver)
  remove(@Param('id') id: number) {
    return this.feedbackService.remove(id);
  }

  // user feedbacks
  @Get('user/:userId')
  @Roles(Role.Customer, Role.Store, Role.Admin, Role.Driver)
  findUserFeedbacks(@Param('userId') userId: number) {
    return this.feedbackService.findByUserId(userId);
  }

  //order feedback
  @Get('order/:orderId')
  @Roles(Role.Customer, Role.Store, Role.Admin, Role.Driver)
  findOrderFeedback(@Param('orderId') orderId: number) {
    return this.feedbackService.findByOrderId(orderId);
  }
}
