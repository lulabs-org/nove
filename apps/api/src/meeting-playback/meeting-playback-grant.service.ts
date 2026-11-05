import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  MeetingPlaybackScopeType,
  Platform,
  Prisma,
} from '@/generated/prisma/client';
import { PrismaService } from '@/prisma/prisma.service';

export interface PlaybackGrantHostInput {
  hostName: string;
  hostPlatformUserId?: string;
}

export interface CreatePlaybackGrantInput {
  studentUserId: string;
  wecomPlatformUserId: string;
  scopeType: MeetingPlaybackScopeType;
  projectId?: string;
  hosts?: PlaybackGrantHostInput[];
  note?: string;
  boundApiKeyId?: string;
}

export interface ListPlaybackGrantQuery {
  studentUserId?: string;
  wecomUserId?: string;
  active?: boolean;
}

@Injectable()
export class MeetingPlaybackGrantService {
  constructor(private readonly prisma: PrismaService) {}

  create(
    orgId: string,
    actorId: string | null,
    input: CreatePlaybackGrantInput,
  ) {
    return this.prisma.$transaction((tx) =>
      this.createWith(tx, orgId, actorId, input),
    );
  }

  createMany(
    orgId: string,
    actorId: string | null,
    inputs: CreatePlaybackGrantInput[],
  ) {
    return this.prisma.$transaction(async (tx) => {
      const grants: Awaited<ReturnType<typeof this.createWith>>[] = [];
      for (const input of inputs) {
        grants.push(await this.createWith(tx, orgId, actorId, input));
      }
      return grants;
    });
  }

  async list(orgId: string, query: ListPlaybackGrantQuery) {
    const grants = await this.prisma.meetingPlaybackGrant.findMany({
      where: {
        orgId,
        ...(query.studentUserId ? { studentUserId: query.studentUserId } : {}),
        ...(query.active === undefined
          ? { active: true }
          : { active: query.active }),
        ...(query.wecomUserId
          ? { wecomPlatformUser: { ptUserId: query.wecomUserId } }
          : {}),
      },
      include: grantInclude,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return grants.map(toGrantResponse);
  }

  async revoke(orgId: string, id: string) {
    const existing = await this.prisma.meetingPlaybackGrant.findFirst({
      where: { id, orgId },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('回放授权不存在');
    }

    const grant = await this.prisma.meetingPlaybackGrant.update({
      where: { id },
      data: { active: false, revokedAt: new Date() },
      include: grantInclude,
    });
    return toGrantResponse(grant);
  }

  private async createWith(
    db: Prisma.TransactionClient,
    orgId: string,
    actorId: string | null,
    input: CreatePlaybackGrantInput,
  ) {
    this.assertScope(input);

    const student = await db.user.findFirst({
      where: { id: input.studentUserId, deletedAt: null },
      select: { id: true },
    });
    if (!student) throw new NotFoundException('同学用户不存在');

    const wecomUser = await db.platformUser.findFirst({
      where: { id: input.wecomPlatformUserId, deletedAt: null },
      select: {
        id: true,
        platform: true,
        localUserId: true,
        active: true,
      },
    });
    if (!wecomUser?.active) {
      throw new NotFoundException('企业微信身份不存在');
    }
    if (wecomUser.platform !== Platform.WECOM) {
      throw new BadRequestException('回放权限只能绑定企业微信身份');
    }
    if (wecomUser.localUserId !== input.studentUserId) {
      throw new BadRequestException(
        '企业微信身份必须先绑定到这名同学的本地用户',
      );
    }

    if (input.scopeType === MeetingPlaybackScopeType.PROJECT) {
      const project = await db.project.findFirst({
        where: { id: input.projectId, orgId, deletedAt: null },
        select: { id: true },
      });
      if (!project) throw new NotFoundException('项目不存在');
    }

    if (input.boundApiKeyId) {
      const apiKey = await db.apiKey.findFirst({
        where: { id: input.boundApiKeyId, orgId },
        select: { id: true },
      });
      if (!apiKey) throw new NotFoundException('要绑定的 API Key 不存在');
    }

    const hostIds = (input.hosts ?? [])
      .map((host) => host.hostPlatformUserId)
      .filter((id): id is string => Boolean(id));
    if (hostIds.length) {
      const found = await db.platformUser.findMany({
        where: { id: { in: hostIds }, deletedAt: null },
        select: { id: true },
      });
      if (found.length !== new Set(hostIds).size) {
        throw new NotFoundException('老师的平台用户不存在');
      }
    }

    const existing = await db.meetingPlaybackGrant.findFirst({
      where: {
        orgId,
        wecomPlatformUserId: wecomUser.id,
        scopeType: input.scopeType,
        projectId: input.projectId ?? null,
        active: true,
        revokedAt: null,
      },
      select: { id: true },
    });

    const writable = {
      ...(input.note !== undefined ? { note: input.note } : {}),
      ...(input.boundApiKeyId !== undefined
        ? { boundApiKeyId: input.boundApiKeyId }
        : {}),
      grantedById: actorId,
      active: true,
      revokedAt: null,
    };
    const grant = existing
      ? await db.meetingPlaybackGrant.update({
          where: { id: existing.id },
          data: writable,
        })
      : await db.meetingPlaybackGrant.create({
          data: {
            orgId,
            studentUserId: input.studentUserId,
            wecomPlatformUserId: wecomUser.id,
            scopeType: input.scopeType,
            projectId: input.projectId ?? null,
            note: input.note ?? null,
            boundApiKeyId: input.boundApiKeyId ?? null,
            grantedById: actorId,
          },
        });

    await db.meetingPlaybackGrantHost.deleteMany({
      where: { grantId: grant.id },
    });
    if (input.hosts?.length) {
      await db.meetingPlaybackGrantHost.createMany({
        data: input.hosts.map((host) => ({
          grantId: grant.id,
          hostName: host.hostName.trim(),
          hostPlatformUserId: host.hostPlatformUserId ?? null,
        })),
      });
    }

    const stored = await db.meetingPlaybackGrant.findUniqueOrThrow({
      where: { id: grant.id },
      include: grantInclude,
    });
    return toGrantResponse(stored);
  }

  private assertScope(input: CreatePlaybackGrantInput) {
    const hosts = input.hosts ?? [];
    if (hosts.some((host) => !host.hostName.trim())) {
      throw new BadRequestException('老师名称不能为空');
    }
    if (
      input.scopeType === MeetingPlaybackScopeType.PROJECT &&
      !input.projectId
    ) {
      throw new BadRequestException('项目范围需要填写 projectId');
    }
    if (
      input.scopeType !== MeetingPlaybackScopeType.PROJECT &&
      input.projectId
    ) {
      throw new BadRequestException('只有项目范围需要填写 projectId');
    }
    if (input.scopeType === MeetingPlaybackScopeType.HOSTS && !hosts.length) {
      throw new BadRequestException('老师范围至少要指定一位老师');
    }
    if (input.scopeType !== MeetingPlaybackScopeType.HOSTS && hosts.length) {
      throw new BadRequestException('只有老师范围需要填写老师');
    }
  }
}

const grantInclude = {
  hosts: true,
  wecomPlatformUser: {
    select: { id: true, ptUserId: true, displayName: true },
  },
} satisfies Prisma.MeetingPlaybackGrantInclude;

type StoredGrant = Prisma.MeetingPlaybackGrantGetPayload<{
  include: typeof grantInclude;
}>;

function toGrantResponse(grant: StoredGrant) {
  return {
    id: grant.id,
    studentUserId: grant.studentUserId,
    wecomPlatformUserId: grant.wecomPlatformUserId,
    wecomUserId: grant.wecomPlatformUser.ptUserId,
    displayName: grant.wecomPlatformUser.displayName,
    scopeType: grant.scopeType,
    projectId: grant.projectId,
    boundApiKeyId: grant.boundApiKeyId,
    active: grant.active,
    note: grant.note,
    hosts: grant.hosts.map((host) => ({
      hostName: host.hostName,
      hostPlatformUserId: host.hostPlatformUserId,
    })),
    createdAt: grant.createdAt,
    revokedAt: grant.revokedAt,
  };
}
