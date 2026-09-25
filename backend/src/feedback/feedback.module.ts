import { Module } from '@nestjs/common'
import { FeedbackService } from './feedback.service.js'
import { FeedbackController } from './feedback.controller.js'

@Module({
  controllers: [FeedbackController],
  providers: [FeedbackService],
})
export class FeedbackModule {}
