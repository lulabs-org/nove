import { Prisma, QATargetType } from '@/generated/prisma/client';
import { MinuteService } from '@/minute/services/minute.service';
import { PrismaService } from '@/prisma/prisma.service';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateQASessionDto,
  QueryQASessionDto,
  UpdateQASessionDto,
} from '../dto';
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

  async update(
    id: string,
    orgId: string,
    userId: string,
    dto: UpdateQASessionDto,
  ) {
    const session = await this.findById(id, orgId, userId);
    const targetType = dto.targetType ?? session.targetType;
    const targetId =
      dto.targetId === undefined
        ? session.targetId
        : dto.targetId?.trim() || null;
    await this.assertTarget(targetType, targetId, orgId);
    return this.sessions.update(id, orgId, userId, {
      ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
      targetType,
      targetId,
      ...(dto.metadata !== undefined
        ? { metadata: dto.metadata as Prisma.InputJsonValue }
        : {}),
    });
  }

  async delete(id: string, orgId: string, userId: string): Promise<void> {
    await this.findById(id, orgId, userId);
    await this.sessions.softDelete(id, orgId, userId);
  }

  async findTargetOptions(
    orgId: string,
    targetType: QATargetType,
    keyword?: string,
  ) {
    const search = keyword?.trim();
    if (targetType === QATargetType.GLOBAL) return [];

    if (targetType === QATargetType.PROJECT) {
      const projects = await this.prisma.project.findMany({
        where: {
          orgId,
          deletedAt: null,
          ...(search
            ? {
                OR: [
                  { title: { contains: search, mode: 'insensitive' } },
                  { code: { contains: search, mode: 'insensitive' } },
                ],
              }
            : {}),
        },
        select: { id: true, title: true, code: true },
        orderBy: { updatedAt: 'desc' },
        take: 50,
      });
      return projects.map((project) => ({
        id: project.id,
        label: project.title,
        description: project.code,
      }));
    }

    if (targetType === QATargetType.MINUTE) {
      const minutes = await this.prisma.minute.findMany({
        where: {
          deletedAt: null,
          meeting: {
            orgId,
            deletedAt: null,
            ...(search
              ? { title: { contains: search, mode: 'insensitive' } }
              : {}),
          },
        },
        select: {
          id: true,
          externalId: true,
          meeting: { select: { title: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: 50,
      });
      return minutes.map((minute) => ({
        id: minute.id,
        label: minute.meeting?.title || minute.externalId || minute.id,
        description: minute.externalId,
      }));
    }

    const files = await this.prisma.driveFile.findMany({
      where: {
        node: {
          is: {
            deletedAt: null,
            space: { orgId, deletedAt: null },
            ...(search
              ? { name: { contains: search, mode: 'insensitive' } }
              : {}),
          },
        },
      },
      select: {
        id: true,
        node: { select: { name: true, space: { select: { name: true } } } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });
    return files.map((file) => ({
      id: file.id,
      label: file.node?.name || file.id,
      description: file.node?.space.name,
    }));
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
