import { MinuteModule } from '@/minute/minute.module';
import { Module } from '@nestjs/common';
import {
  QAFeedbackController,
  QARecordController,
  QASessionController,
} from './controllers';
import { QARecordRepository, QASessionRepository } from './repositories';
import {
  QAFeedbackService,
  QARecordService,
  QASessionService,
} from './services';

@Module({
  imports: [MinuteModule],
  controllers: [QASessionController, QARecordController, QAFeedbackController],
  providers: [
    QASessionService,
    QARecordService,
    QAFeedbackService,
    QASessionRepository,
    QARecordRepository,
  ],
})
export class QAModule {}
