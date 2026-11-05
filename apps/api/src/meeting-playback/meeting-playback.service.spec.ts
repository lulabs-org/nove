import { ForbiddenException } from '@nestjs/common';
import { MeetingPlaybackScopeType } from '@/generated/prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { MeetingPlaybackService } from './meeting-playback.service';
import type { PlaybackCaller } from './meeting-playback.types';

const NOW = new Date('2026-11-05T07:00:00.000Z');
const QUESTION = '过去两三天我都没来，张老师那边、叶老师那边都讲了什么？';

const liutong = {
  id: 'pu-liutong',
  ptUserId: 'liutong',
  displayName: '柳潼',
  localUserId: 'user-liutong',
};

const otherStudent = {
  id: 'pu-other',
  ptUserId: 'other-student',
  displayName: '其他同学',
  localUserId: 'user-other',
};

function minute(
  content: string | null,
  extras?: {
    keyPoints?: unknown;
    aiMinutes?: unknown;
    speakerSummaries?: {
      partSummary: string;
      platformUser: { displayName: string | null } | null;
    }[];
    files?: { id: string; fileType: string }[];
  },
) {
  return {
    id: `minute-${content ?? 'empty'}`,
    files: extras?.files ?? [{ id: 'file-video', fileType: 'VIDEO' }],
    summary: content
      ? {
          content,
          aiMinutes: extras?.aiMinutes ?? null,
          keyPoints: extras?.keyPoints ?? null,
        }
      : null,
    speakerSummaries: extras?.speakerSummaries ?? [],
  };
}

function meeting(input: {
  id: string;
  title: string;
  teacher: string;
  startAt: string;
  summary: string | null;
  keyPoints?: unknown;
  aiMinutes?: unknown;
  files?: { id: string; fileType: string }[];
}) {
  return {
    id: input.id,
    title: input.title,
    projectId: null,
    startAt: new Date(input.startAt),
    scheduledStartAt: null,
    endAt: null,
    host: { id: `host-${input.id}`, displayName: input.teacher },
    minutes: [
      minute(input.summary, {
        keyPoints: input.keyPoints,
        aiMinutes: input.aiMinutes,
        files: input.files,
      }),
    ],
  };
}

const zhang = meeting({
  id: 'meet-zhang',
  title: '函数入门',
  teacher: '张老师',
  startAt: '2026-11-03T11:00:00.000Z',
  summary: '讲了函数的定义和调用。',
  aiMinutes: {
    sections: [
      { title: '函数定义', content: '用例子说明参数', timestamp: '00:05:00' },
    ],
  },
  keyPoints: [{ point: '函数由参数和返回值组成', timestamp: '00:12:00' }],
});

const ye = meeting({
  id: 'meet-ye',
  title: '循环练习',
  teacher: '叶老师',
  startAt: '2026-11-04T11:00:00.000Z',
  summary: '讲了 for 循环和 while 循环。',
});

const wang = meeting({
  id: 'meet-wang',
  title: '不该出现的课',
  teacher: '王老师',
  startAt: '2026-11-04T12:00:00.000Z',
  summary: '王老师讲了不该被看到的内容。',
});

describe('MeetingPlaybackService', () => {
  const prisma = {
    platformUser: { findMany: jest.fn(), findFirst: jest.fn() },
    meetingPlaybackGrant: { findMany: jest.fn() },
    meeting: { findMany: jest.fn(), findFirst: jest.fn() },
  };
  let service: MeetingPlaybackService;

  const workbuddy: PlaybackCaller = {
    orgId: 'org-1',
    userId: 'admin-1',
    apiKeyId: 'key-workbuddy',
    permissions: ['mcp-tool:meeting-playback'],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.NOVE_PUBLIC_API_URL;
    prisma.platformUser.findMany.mockResolvedValue([]);
    prisma.platformUser.findFirst.mockImplementation(
      ({ where }: { where: { OR?: { id?: string; ptUserId?: string }[] } }) => {
        const identifiers = (where.OR ?? []).flatMap((item) =>
          [item.id, item.ptUserId].filter(Boolean),
        );
        return (
          [liutong, otherStudent].find(
            (user) =>
              identifiers.includes(user.id) ||
              identifiers.includes(user.ptUserId),
          ) ?? null
        );
      },
    );
    prisma.meetingPlaybackGrant.findMany.mockImplementation(
      ({ where }: { where: { wecomPlatformUserId: string } }) => {
        if (where.wecomPlatformUserId !== liutong.id) return [];
        return [
          {
            id: 'grant-liutong',
            scopeType: MeetingPlaybackScopeType.HOSTS,
            projectId: null,
            boundApiKeyId: null,
            hosts: [
              { hostName: '张老师', hostPlatformUserId: null },
              { hostName: '叶老师', hostPlatformUserId: null },
            ],
          },
        ];
      },
    );
    prisma.meeting.findMany.mockResolvedValue([zhang, ye, wang]);
    service = new MeetingPlaybackService(prisma as unknown as PrismaService);
  });

  it('answers 柳潼 with 张老师 and 叶老师 playbacks, summaries, and catch-up order', async () => {
    const result = await service.catchUp(
      workbuddy,
      { question: QUESTION, wecomUserId: 'liutong' },
      NOW,
    );

    expect(result.authorized).toBe(true);
    expect(result.matched).toBe(true);
    expect(result.student?.displayName).toBe('柳潼');
    expect(result.sessions.map((session) => session.teacherName)).toEqual([
      '张老师',
      '叶老师',
    ]);
    expect(
      result.sessions.map((session) => session.playback.entryPath),
    ).toEqual([
      '/meeting-playbacks/sessions/meet-zhang',
      '/meeting-playbacks/sessions/meet-ye',
    ]);
    expect(result.sessions[0]?.summary).toBe('讲了函数的定义和调用。');
    expect(result.sessions[1]?.summary).toBe('讲了 for 循环和 while 循环。');
    expect(
      result.sessions[0]?.keySegments.map((segment) => segment.title),
    ).toEqual(expect.arrayContaining(['函数定义', '函数由参数和返回值组成']));
    expect(result.sessions[0]?.catchUp.order).toBe(1);
    expect(result.sessions[1]?.catchUp.order).toBe(2);
    expect(result.catchUpPlan).toContain('张老师');
    expect(result.catchUpPlan).toContain('叶老师');
    expect(result.replyText).toContain('函数入门');
    expect(result.replyText).toContain('循环练习');
    expect(result.replyText).not.toContain('不该出现的课');
    expect(result.replyText).not.toContain('不该被看到');
    expect(prisma.meeting.findMany).toHaveBeenCalled();
  });

  it('summarizes the authorized sessions when she only says she missed recent days', async () => {
    const result = await service.catchUp(
      workbuddy,
      { question: '过去三天我都没来', wecomUserId: 'liutong' },
      NOW,
    );

    expect(result.absence).toBe(true);
    expect(result.sessions.map((session) => session.title)).toEqual([
      '函数入门',
      '循环练习',
    ]);
    expect(result.replyText).toContain('补看');
  });

  it('returns an explicit empty result and does not invent a summary', async () => {
    const result = await service.catchUp(
      workbuddy,
      { question: QUESTION, wecomUserId: 'liutong' },
      NOW,
    );
    prisma.meeting.findMany.mockResolvedValue([wang]);

    const empty = await service.catchUp(
      workbuddy,
      { question: QUESTION, wecomUserId: 'liutong' },
      NOW,
    );

    expect(result.matched).toBe(true);
    expect(empty.authorized).toBe(true);
    expect(empty.matched).toBe(false);
    expect(empty.sessions).toEqual([]);
    expect(empty.catchUpPlan).toBeNull();
    expect(empty.message).toContain('张老师');
    expect(empty.message).toContain('叶老师');
    expect(empty.replyText).not.toContain('不该出现的课');
    expect(empty.replyText).not.toContain('讲了 for');
  });

  it('keeps the playback entry when the recording has no minutes summary', async () => {
    prisma.meeting.findMany.mockResolvedValue([
      meeting({
        id: 'meet-zhang',
        title: '函数入门',
        teacher: '张老师',
        startAt: '2026-11-03T11:00:00.000Z',
        summary: null,
        files: [{ id: 'file-video', fileType: 'VIDEO' }],
      }),
    ]);

    const result = await service.catchUp(
      workbuddy,
      { question: '过去三天张老师讲了什么', wecomUserId: 'liutong' },
      NOW,
    );

    expect(result.sessions[0]?.summary).toBeNull();
    expect(result.sessions[0]?.playback.files[0]?.label).toBe('视频回放');
    expect(result.sessions[0]?.catchUp.suggestion).toContain('纪要尚未生成');
    expect(result.replyText).toContain('纪要尚未生成');
    expect(result.replyText).not.toContain('讲了函数');
  });

  it('hides every playback from a student without a grant', async () => {
    const result = await service.catchUp(
      workbuddy,
      { question: QUESTION, wecomUserId: 'other-student' },
      NOW,
    );

    expect(result.authorized).toBe(false);
    expect(result.matched).toBe(false);
    expect(result.sessions).toEqual([]);
    expect(result.student).toBeNull();
    expect(result.replyText).toContain('没有会议回放查看权限');
    expect(result.replyText).not.toContain('函数入门');
    expect(prisma.meeting.findMany).not.toHaveBeenCalled();
  });

  it('refuses a bound account that asks as another WeCom user', async () => {
    prisma.platformUser.findMany.mockResolvedValue([liutong]);

    await expect(
      service.catchUp(
        {
          orgId: 'org-1',
          userId: 'user-liutong',
          permissions: ['meeting-playback:read'],
        },
        { question: QUESTION, wecomUserId: 'other-student' },
        NOW,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.meeting.findMany).not.toHaveBeenCalled();
  });

  it('does not use a grant bound to another Workbuddy API key', async () => {
    prisma.meetingPlaybackGrant.findMany.mockResolvedValue([
      {
        id: 'grant-bound',
        scopeType: MeetingPlaybackScopeType.ORGANIZATION,
        projectId: null,
        boundApiKeyId: 'key-liutong',
        hosts: [],
      },
    ]);

    const result = await service.catchUp(
      workbuddy,
      { question: QUESTION, wecomUserId: 'liutong' },
      NOW,
    );

    expect(result.authorized).toBe(false);
    expect(result.sessions).toEqual([]);
    expect(prisma.meeting.findMany).not.toHaveBeenCalled();
  });
});
