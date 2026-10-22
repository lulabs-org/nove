import { Prisma, QATargetType } from '@/generated/prisma/client';
import { MinuteService } from '@/minute/services/minute.service';
import { PrismaService } from '@/prisma/prisma.service';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateQASessionDto, QueryQASessionDto } from '../dto';
import { QASessionRepository } from '../repositories';

@Injectable()
export class QASessionService {
  constructor(
    private readonly sessions: QASessionRepository,
    private readonly minuteService: MinuteService,
    private readonly prisma: PrismaService,
  ) {}

  requireUserId(userId?: string | null): string {
    if (!userId) throw new ForbiddenException('Current user is required');
    return userId;
  }

  async create(orgId: string, userId: string, dto: CreateQASessionDto) {
    const targetType = dto.targetType ?? QATargetType.GLOBAL;
    const targetId = dto.targetId?.trim() || null;
    await this.assertTarget(targetType, targetId, orgId);
    return this.sessions.create({
      orgId,
      userId,
      title: dto.title.trim(),
      targetType,
      targetId,
      metadata: (dto.metadata ?? {}) as Prisma.InputJsonValue,
    });
  }

  async findAll(orgId: string, userId: string, query: QueryQASessionDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const { items, total } = await this.sessions.findMany({
      orgId,
      userId,
      skip: (page - 1) * pageSize,
      take: pageSize,
      targetType: query.targetType,
      targetId: query.targetId?.trim(),
    });
    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findById(id: string, orgId: string, userId: string) {
    const session = await this.sessions.findById(id, orgId, userId);
    if (!session) throw new NotFoundException('QA session not found');
    return session;
  }

  async delete(id: string, orgId: string, userId: string): Promise<void> {
    await this.findById(id, orgId, userId);
    await this.sessions.softDelete(id, orgId, userId);
  }

  private async assertTarget(
    targetType: QATargetType,
    targetId: string | null,
    orgId: string,
  ): Promise<void> {
    if (targetType === QATargetType.GLOBAL) {
      if (targetId) {
        throw new BadRequestException('GLOBAL session cannot have targetId');
      }
      return;
    }
    if (!targetId) {
      throw new BadRequestException('targetId is required for this targetType');
    }

    if (targetType === QATargetType.MINUTE) {
      await this.minuteService.getById(targetId, orgId);
      return;
    }

    const exists =
      targetType === QATargetType.PROJECT
        ? await this.prisma.project.findFirst({
            where: { id: targetId, orgId, deletedAt: null },
            select: { id: true },
          })
        : await this.prisma.driveFile.findFirst({
            where: {
              id: targetId,
              node: {
                is: {
                  deletedAt: null,
                  space: { orgId, deletedAt: null },
                },
              },
            },
            select: { id: true },
          });
    if (!exists) throw new NotFoundException('QA target not found');
  }
}
