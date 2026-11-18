import { Prisma, QATargetType } from '@/generated/prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class QASessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: {
    orgId: string;
    userId: string;
    title: string;
    targetType: QATargetType;
    targetId?: string | null;
    metadata: Prisma.InputJsonValue;
  }) {
    return this.prisma.qASession.create({ data });
  }

  async findMany(params: {
    orgId: string;
    skip: number;
    take: number;
    targetType?: QATargetType;
    targetId?: string;
    keyword?: string;
  }) {
    const where: Prisma.QASessionWhereInput = {
      orgId: params.orgId,
      deletedAt: null,
      ...(params.keyword
        ? { title: { contains: params.keyword, mode: 'insensitive' as const } }
        : {}),
      ...(params.targetType ? { targetType: params.targetType } : {}),
      ...(params.targetId ? { targetId: params.targetId } : {}),
    };
    const [total, items] = await this.prisma.$transaction([
      this.prisma.qASession.count({ where }),
      this.prisma.qASession.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      }),
    ]);
    return { items, total };
  }

  findById(id: string, orgId: string) {
    return this.prisma.qASession.findFirst({
      where: {
        id,
        orgId,
        deletedAt: null,
      },
      include: {
        records: {
          orderBy: { createdAt: 'asc' },
          include: { citations: true },
        },
      },
    });
  }

  findMetadata(id: string, orgId: string) {
    return this.prisma.qASession.findFirst({
      where: { id, orgId, deletedAt: null },
    });
  }

  update(id: string, orgId: string, data: Prisma.QASessionUpdateInput) {
    return this.prisma.qASession.update({
      where: { id, orgId, deletedAt: null },
      data,
    });
  }

  softDelete(id: string, orgId: string) {
    return this.prisma.qASession.update({
      where: { id, orgId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }
}
