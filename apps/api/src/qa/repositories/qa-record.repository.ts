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

  create(orgId: string, data: RecordCreateData) {
    return this.prisma.$transaction(async (tx) => {
      await this.touchSessions(tx, orgId, [data.sessionId]);
      return tx.qARecord.create({
        data: this.toCreateInput(data),
        include: recordInclude,
      });
    });
  }

  createBatch(orgId: string, records: RecordCreateData[]) {
    return this.prisma.$transaction(async (tx) => {
      await this.touchSessions(
        tx,
        orgId,
        records.map((record) => record.sessionId),
      );
      const result: Prisma.QARecordGetPayload<{
        include: typeof recordInclude;
      }>[] = [];
      for (const record of records) {
        result.push(
          await tx.qARecord.create({
            data: this.toCreateInput(record),
            include: recordInclude,
          }),
        );
      }
      return result;
    });
  }

  async findMany(params: {
    orgId: string;
    skip: number;
    take: number;
    keyword?: string;
    rating?: QAFeedbackRating;
    sessionId: string;
    from?: Date;
    to?: Date;
  }) {
    const where: Prisma.QARecordWhereInput = {
      session: {
        orgId: params.orgId,
        deletedAt: null,
      },
      sessionId: params.sessionId,
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
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
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
    return this.prisma.$transaction(async (tx) => {
      const original = await tx.qARecord.findFirstOrThrow({
        where: { id, session: { orgId, deletedAt: null } },
        select: { sessionId: true },
      });
      await this.touchSessions(tx, orgId, [
        original.sessionId,
        data.sessionId ?? original.sessionId,
      ]);
      return tx.qARecord.update({
        where: { id, session: { orgId, deletedAt: null } },
        data: {
          ...(data.sessionId !== undefined
            ? { session: { connect: { id: data.sessionId } } }
            : {}),
          ...(data.question !== undefined
            ? { question: data.question.trim() }
            : {}),
          ...(data.answer !== undefined ? { answer: data.answer.trim() } : {}),
          ...(data.generatedBy !== undefined
            ? { generatedBy: data.generatedBy }
            : {}),
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
    });
  }

  delete(id: string, orgId: string) {
    return this.prisma.$transaction(async (tx) => {
      const original = await tx.qARecord.findFirstOrThrow({
        where: { id, session: { orgId, deletedAt: null } },
        select: { sessionId: true },
      });
      await this.touchSessions(tx, orgId, [original.sessionId]);
      return tx.qARecord.delete({
        where: { id, session: { orgId, deletedAt: null } },
      });
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

  private async touchSessions(
    tx: Prisma.TransactionClient,
    orgId: string,
    sessionIds: string[],
  ) {
    // Stable lock order for batches and moves; roll back content and timestamps together.
    for (const id of [...new Set(sessionIds)].sort()) {
      await tx.qASession.update({
        where: { id, orgId, deletedAt: null },
        data: { updatedAt: new Date() },
      });
    }
  }

  private toCreateInput(data: RecordCreateData): Prisma.QARecordCreateInput {
    return {
      session: { connect: { id: data.sessionId } },
      question: data.question.trim(),
      answer: data.answer.trim(),
      generatedBy: data.generatedBy ?? QAGeneratedBy.AI,
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
