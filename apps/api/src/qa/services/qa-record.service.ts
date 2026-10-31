import { MinuteService } from '@/minute/services/minute.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import {
  BatchCreateQARecordDto,
  CreateQARecordDto,
  QueryQARecordDto,
  UpdateQARecordDto,
} from '../dto';
import { QARecordRepository, QASessionRepository } from '../repositories';

@Injectable()
export class QARecordService {
  constructor(
    private readonly records: QARecordRepository,
    private readonly sessions: QASessionRepository,
    private readonly minuteService: MinuteService,
  ) {}

  async create(orgId: string, sessionId: string, dto: CreateQARecordDto) {
    await this.assertSession(sessionId, orgId);
    return this.records.create({ ...dto, sessionId });
  }

  async createBatch(orgId: string, dto: BatchCreateQARecordDto) {
    const sessionIds = [...new Set(dto.records.map((item) => item.sessionId))];
    await Promise.all(sessionIds.map((id) => this.assertSession(id, orgId)));
    return this.records.createBatch(dto.records);
  }

  async findAll(orgId: string, query: QueryQARecordDto) {
    return this.findPaged(orgId, query);
  }

  async update(orgId: string, recordId: string, dto: UpdateQARecordDto) {
    await this.assertRecord(recordId, orgId);
    return this.records.update(recordId, orgId, dto);
  }

  async delete(orgId: string, recordId: string): Promise<void> {
    await this.assertRecord(recordId, orgId);
    await this.records.delete(recordId, orgId);
  }

  async findByMinute(orgId: string, minuteId: string, query: QueryQARecordDto) {
    await this.minuteService.getById(minuteId, orgId);
    return this.findPaged(orgId, query, minuteId);
  }

  private async findPaged(
    orgId: string,
    query: QueryQARecordDto,
    minuteId?: string,
  ) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const { items, total } = await this.records.findMany({
      orgId,
      skip: (page - 1) * pageSize,
      take: pageSize,
      keyword: query.keyword?.trim(),
      rating: query.rating,
      sessionId: query.sessionId,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
      minuteId,
    });
    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  private async assertSession(sessionId: string, orgId: string): Promise<void> {
    if (!(await this.sessions.findById(sessionId, orgId))) {
      throw new NotFoundException('QA session not found');
    }
  }

  private async assertRecord(recordId: string, orgId: string): Promise<void> {
    if (!(await this.records.findById(recordId, orgId))) {
      throw new NotFoundException('QA record not found');
    }
  }
}
