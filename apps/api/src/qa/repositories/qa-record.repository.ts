import {
  Prisma,
  QAGeneratedBy,
  QAFeedbackRating,
} from '@/generated/prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import {
  CreateQACitationDto,
  CreateQARecordDto,
  UpdateQARecordDto,
} from '../dto';

type RecordCreateData = CreateQARecordDto & { sessionId: string };

const recordInclude = {
  citations: true,
  session: { select: { id: true, title: true } },
} satisfies Prisma.QARecordInclude;

@Injectable()
export class QARecordRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: RecordCreateData) {
    return this.prisma.qARecord.create({
      data: this.toCreateInput(data),
      include: recordInclude,
    });
  }

  createBatch(records: RecordCreateData[]) {
    return this.prisma.$transaction(
      records.map((record) =>
        this.prisma.qARecord.create({
          data: this.toCreateInput(record),
          include: recordInclude,
        }),
      ),
    );
  }

  async findMany(params: {
    orgId: string;
    skip: number;
    take: number;
    keyword?: string;
    rating?: QAFeedbackRating;
    sessionId?: string;
    from?: Date;
    to?: Date;
    minuteId?: string;
  }) {
    const where: Prisma.QARecordWhereInput = {
      session: {
        orgId: params.orgId,
        deletedAt: null,
        ...(params.minuteId
          ? { targetType: 'MINUTE', targetId: params.minuteId }
          : {}),
      },
      ...(params.sessionId ? { sessionId: params.sessionId } : {}),
      ...(params.rating ? { rating: params.rating } : {}),
      ...(params.keyword
        ? {
            OR: [
              {
                question: {
                  contains: params.keyword,
                  mode: 'insensitive',
                },
              },
              {
                answer: {
                  contains: params.keyword,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
      ...(params.from || params.to
        ? {
            createdAt: {
              ...(params.from ? { gte: params.from } : {}),
              ...(params.to ? { lte: params.to } : {}),
            },
          }
        : {}),
    };
    const [total, items] = await this.prisma.$transaction([
      this.prisma.qARecord.count({ where }),
      this.prisma.qARecord.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { createdAt: 'desc' },
        include: recordInclude,
      }),
    ]);
    return { items, total };
  }

  findById(id: string, orgId: string) {
    return this.prisma.qARecord.findFirst({
      where: { id, session: { orgId, deletedAt: null } },
      include: recordInclude,
    });
  }

  update(id: string, orgId: string, data: UpdateQARecordDto) {
    return this.prisma.qARecord.update({
      where: { id, session: { orgId, deletedAt: null } },
      data: {
        ...(data.question !== undefined
          ? { question: data.question.trim() }
          : {}),
        ...(data.answer !== undefined ? { answer: data.answer.trim() } : {}),
        ...(data.generatedBy !== undefined
          ? { generatedBy: data.generatedBy }
          : {}),
        ...(data.aiModel !== undefined
          ? { aiModel: data.aiModel?.trim() || null }
          : {}),
        ...(data.promptTokens !== undefined
          ? { promptTokens: data.promptTokens }
          : {}),
        ...(data.completionTokens !== undefined
          ? { completionTokens: data.completionTokens }
          : {}),
        ...(data.totalTokens !== undefined
          ? { totalTokens: data.totalTokens }
          : {}),
        ...(data.latencyMs !== undefined ? { latencyMs: data.latencyMs } : {}),
        ...(data.metadata !== undefined
          ? { metadata: data.metadata as Prisma.InputJsonValue }
          : {}),
        ...(data.citations !== undefined
          ? {
              citations: {
                deleteMany: {},
                create: data.citations.map((citation) =>
                  this.toCitationInput(citation),
                ),
              },
            }
          : {}),
      },
      include: recordInclude,
    });
  }

  delete(id: string, orgId: string) {
    return this.prisma.qARecord.delete({
      where: { id, session: { orgId, deletedAt: null } },
    });
  }

  updateFeedback(
    id: string,
    orgId: string,
    data: {
      rating: QAFeedbackRating | null;
      feedbackReason?: string | null;
      feedbackComment?: string | null;
    },
  ) {
    return this.prisma.qARecord.update({
      where: {
        id,
        session: { orgId, deletedAt: null },
      },
      data,
      include: recordInclude,
    });
  }

  private toCreateInput(data: RecordCreateData): Prisma.QARecordCreateInput {
    return {
      session: { connect: { id: data.sessionId } },
      question: data.question.trim(),
      answer: data.answer.trim(),
      generatedBy: data.generatedBy ?? QAGeneratedBy.AI,
      aiModel: data.aiModel?.trim() || null,
      promptTokens: data.promptTokens,
      completionTokens: data.completionTokens,
      totalTokens: data.totalTokens,
      latencyMs: data.latencyMs,
      metadata: (data.metadata ?? {}) as Prisma.InputJsonValue,
      citations: {
        create: (data.citations ?? []).map((citation) =>
          this.toCitationInput(citation),
        ),
      },
    };
  }

  private toCitationInput(
    citation: CreateQACitationDto,
  ): Prisma.QACitationCreateWithoutRecordInput {
    return {
      sourceType: citation.sourceType.trim(),
      sourceId: citation.sourceId.trim(),
      title: citation.title?.trim() || null,
      location: citation.location?.trim() || null,
      snippet: citation.snippet.trim(),
      relevanceScore: citation.relevanceScore,
      metadata: (citation.metadata ?? {}) as Prisma.InputJsonValue,
    };
  }
}
