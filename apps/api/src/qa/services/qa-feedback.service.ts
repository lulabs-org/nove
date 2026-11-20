import { Injectable, NotFoundException } from '@nestjs/common';
import { QAFeedbackDto } from '../dto';
import { QARecordRepository } from '../repositories';

@Injectable()
export class QAFeedbackService {
  constructor(private readonly records: QARecordRepository) {}

  async submit(orgId: string, recordId: string, dto: QAFeedbackDto) {
    if (!(await this.records.findById(recordId, orgId))) {
      throw new NotFoundException('QA record not found');
    }
    return this.records.updateFeedback(recordId, orgId, {
      rating: dto.rating,
      feedbackReason: dto.reason?.trim() || null,
      feedbackComment: dto.comment?.trim() || null,
    });
  }
}
