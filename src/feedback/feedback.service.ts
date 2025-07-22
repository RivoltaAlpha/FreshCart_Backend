import { Injectable } from '@nestjs/common';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Feedback } from './entities/feedback.entity';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(Feedback)
    private feedbackRepository: Repository<Feedback>,
  ) {}

async create(createFeedbackDto: CreateFeedbackDto) {
  const feedback = this.feedbackRepository.create({
    comment: createFeedbackDto.comment,
    rating: createFeedbackDto.rating,
    user: { user_id: createFeedbackDto.user_id },   
    order: { order_id: createFeedbackDto.order_id } 
  });
  return this.feedbackRepository.save(feedback);
}

  findAll() {
    return this.feedbackRepository.find();
  }

  findOne(id: number) {
    return this.feedbackRepository.findOne({ where: { feedback_id: id } });
  }

  update(id: number, updateFeedbackDto: UpdateFeedbackDto) {
    return this.feedbackRepository.update(id, updateFeedbackDto);
  }

  remove(id: number) {
    return this.feedbackRepository.delete(id);
  }

  //fetch feedback by user ID
  async findByUserId(userId: number) {
    return this.feedbackRepository.find({
      where: { user: { user_id: userId } },
    });
  }

  //fetch feedback by order ID
  async findByOrderId(orderId: number) {
    return this.feedbackRepository.find({
      where: { order: { order_id: orderId } },
    });
  }
}
