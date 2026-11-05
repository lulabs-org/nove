import { BadRequestException } from '@nestjs/common';
import { MeetingPlaybackScopeType, Platform } from '@/generated/prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { MeetingPlaybackGrantService } from './meeting-playback-grant.service';

describe('MeetingPlaybackGrantService', () => {
  const tx = {
    user: { findFirst: jest.fn() },
    platformUser: { findFirst: jest.fn(), findMany: jest.fn() },
    project: { findFirst: jest.fn() },
    apiKey: { findFirst: jest.fn() },
    meetingPlaybackGrant: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },
    meetingPlaybackGrantHost: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
  };
  const prisma = {
    $transaction: jest.fn(async (fn: (client: typeof tx) => Promise<unknown>) =>
      fn(tx),
    ),
  };
  let service: MeetingPlaybackGrantService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation(async (fn) => fn(tx));
    service = new MeetingPlaybackGrantService(
      prisma as unknown as PrismaService,
    );
    tx.user.findFirst.mockResolvedValue({ id: 'user-liutong' });
    tx.platformUser.findFirst.mockResolvedValue({
      id: 'pu-liutong',
      platform: Platform.WECOM,
      localUserId: 'user-liutong',
      active: true,
    });
    tx.platformUser.findMany.mockResolvedValue([]);
    tx.meetingPlaybackGrant.findFirst.mockResolvedValue(null);
    tx.meetingPlaybackGrant.create.mockResolvedValue({ id: 'grant-1' });
    tx.meetingPlaybackGrantHost.deleteMany.mockResolvedValue({ count: 0 });
    tx.meetingPlaybackGrantHost.createMany.mockResolvedValue({ count: 2 });
    tx.meetingPlaybackGrant.findUniqueOrThrow.mockResolvedValue({
      id: 'grant-1',
      studentUserId: 'user-liutong',
      wecomPlatformUserId: 'pu-liutong',
      scopeType: MeetingPlaybackScopeType.HOSTS,
      projectId: null,
      boundApiKeyId: null,
      active: true,
      note: '试点',
      createdAt: new Date('2026-11-05T00:00:00.000Z'),
      revokedAt: null,
      hosts: [
        { hostName: '张老师', hostPlatformUserId: null },
        { hostName: '叶老师', hostPlatformUserId: null },
      ],
      wecomPlatformUser: {
        id: 'pu-liutong',
        ptUserId: 'liutong',
        displayName: '柳潼',
      },
    });
  });

  it('refuses a WeCom identity that is not linked to the student', async () => {
    tx.platformUser.findFirst.mockResolvedValue({
      id: 'pu-liutong',
      platform: Platform.WECOM,
      localUserId: 'someone-else',
      active: true,
    });

    await expect(
      service.create('org-1', 'admin-1', {
        studentUserId: 'user-liutong',
        wecomPlatformUserId: 'pu-liutong',
        scopeType: MeetingPlaybackScopeType.HOSTS,
        hosts: [{ hostName: '张老师' }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(tx.meetingPlaybackGrant.create).not.toHaveBeenCalled();
  });

  it('creates a host-scoped grant for 柳潼 and can batch another student', async () => {
    const grant = await service.create('org-1', 'admin-1', {
      studentUserId: 'user-liutong',
      wecomPlatformUserId: 'pu-liutong',
      scopeType: MeetingPlaybackScopeType.HOSTS,
      note: '试点',
      hosts: [{ hostName: '张老师' }, { hostName: '叶老师' }],
    });

    expect(grant.displayName).toBe('柳潼');
    expect(grant.wecomUserId).toBe('liutong');
    expect(grant.hosts.map((host) => host.hostName)).toEqual([
      '张老师',
      '叶老师',
    ]);
    expect(tx.meetingPlaybackGrantHost.createMany).toHaveBeenCalled();

    tx.user.findFirst.mockImplementation(
      ({ where }: { where: { id: string } }) => ({
        id: where.id,
      }),
    );
    tx.platformUser.findFirst.mockImplementation(
      ({ where }: { where: { id: string } }) => ({
        id: where.id,
        platform: Platform.WECOM,
        localUserId: where.id.replace('pu-', 'user-'),
        active: true,
      }),
    );

    const grants = await service.createMany('org-1', 'admin-1', [
      {
        studentUserId: 'user-liutong',
        wecomPlatformUserId: 'pu-liutong',
        scopeType: MeetingPlaybackScopeType.HOSTS,
        hosts: [{ hostName: '张老师' }],
      },
      {
        studentUserId: 'user-other',
        wecomPlatformUserId: 'pu-other',
        scopeType: MeetingPlaybackScopeType.HOSTS,
        hosts: [{ hostName: '叶老师' }],
      },
    ]);

    expect(grants).toHaveLength(2);
  });
});
