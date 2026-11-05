import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  MeetingPlaybackScopeType,
  Platform,
  Prisma,
} from '@/generated/prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import type {
  CatchUpPlaybackInput,
  MeetingPlaybackCatchUpResult,
  MeetingPlaybackSession,
  PlaybackCaller,
} from './meeting-playback.types';
import {
  SESSION_NOT_VISIBLE_MESSAGE,
  UNAUTHORIZED_PLAYBACK_MESSAGE,
} from './meeting-playback.types';
import {
  parsePlaybackQuestion,
  recentShanghaiRange,
  shanghaiDayRange,
} from './playback-question.util';
import {
  buildCatchUpPlan,
  catchUpSuggestion,
  emptyPlaybackMessage,
  fileLabel,
  formatWorkbuddyReply,
  foundPlaybackMessage,
  playbackEntryPath,
  playbackEntryUrl,
  readKeySegments,
  summaryFromMinute,
} from './playback-reply.util';
import { hostMatchesTeacher, teacherKey } from './teacher-match.util';

const MAX_RANGE_DAYS = 31;
const MAX_SESSIONS = 20;
const QUERY_TAKE = 100;

const meetingSelect = {
  id: true,
  title: true,
  projectId: true,
  startAt: true,
  scheduledStartAt: true,
  endAt: true,
  host: { select: { id: true, displayName: true } },
  minutes: {
    where: { deletedAt: null },
    orderBy: { startAt: 'asc' as const },
    select: {
      id: true,
      files: {
        where: { deletedAt: null },
        select: { id: true, fileType: true },
      },
      summary: {
        select: { content: true, aiMinutes: true, keyPoints: true },
      },
      speakerSummaries: {
        select: {
          partSummary: true,
          platformUser: { select: { displayName: true } },
        },
      },
    },
  },
} satisfies Prisma.MeetingSelect;

type PlaybackMeeting = Prisma.MeetingGetPayload<{
  select: typeof meetingSelect;
}>;

type WecomIdentity = {
  id: string;
  ptUserId: string | null;
  displayName: string | null;
  localUserId: string | null;
};

type GrantRecord = Prisma.MeetingPlaybackGrantGetPayload<{
  include: {
    hosts: { select: { hostName: true; hostPlatformUserId: true } };
  };
}>;

@Injectable()
export class MeetingPlaybackService {
  constructor(private readonly prisma: PrismaService) {}

  async catchUp(
    caller: PlaybackCaller,
    input: CatchUpPlaybackInput,
    now = new Date(),
  ): Promise<MeetingPlaybackCatchUpResult> {
    const orgId = this.requireOrg(caller);
    const parsed = parsePlaybackQuestion(input.question);
    const teachers = input.teachers ?? parsed.teachers;
    const absence = input.absence === true || parsed.absence;
    const viewer = await this.resolveViewer(caller, orgId, input);

    if (viewer.kind === 'denied') {
      return this.finish({
        authorized: false,
        matched: false,
        message: UNAUTHORIZED_PLAYBACK_MESSAGE,
        student: null,
        range: null,
        teachers,
        absence,
        sessions: [],
        catchUpPlan: null,
      });
    }

    const range = this.resolveRange(input, parsed, absence, now);
    const meetings = await this.loadMeetings(
      orgId,
      viewer.grants,
      range,
      teachers,
    );
    const allowed = meetings.filter((meeting) =>
      viewer.grants.some((grant) => this.grantAllows(grant, meeting)),
    );
    const matched = this.filterTeachers(allowed, teachers).sort(
      (left, right) => this.meetingTime(left) - this.meetingTime(right),
    );
    const truncated = matched.length > MAX_SESSIONS;
    const sessions = matched
      .slice(0, MAX_SESSIONS)
      .map((meeting, index) => this.toSession(meeting, index + 1));

    return this.finish({
      authorized: true,
      matched: sessions.length > 0,
      message: sessions.length
        ? foundPlaybackMessage(sessions.length, absence, truncated)
        : emptyPlaybackMessage(teachers),
      student: this.toStudent(viewer.platformUser),
      range: {
        startAt: range.startAt.toISOString(),
        endAt: range.endAt.toISOString(),
        timeZone: 'Asia/Shanghai',
      },
      teachers,
      absence,
      sessions,
      catchUpPlan: buildCatchUpPlan(sessions),
    });
  }

  async getSession(
    caller: PlaybackCaller,
    meetingId: string,
    input: Pick<CatchUpPlaybackInput, 'wecomUserId' | 'wecomPlatformUserId'>,
  ): Promise<MeetingPlaybackCatchUpResult> {
    const orgId = this.requireOrg(caller);
    const viewer = await this.resolveViewer(caller, orgId, input);
    if (viewer.kind === 'denied') {
      throw new NotFoundException(SESSION_NOT_VISIBLE_MESSAGE);
    }

    const meeting = await this.prisma.meeting.findFirst({
      where: { id: meetingId, orgId, deletedAt: null },
      select: meetingSelect,
    });
    const visible =
      meeting &&
      meeting.minutes.length > 0 &&
      viewer.grants.some((grant) => this.grantAllows(grant, meeting));
    if (!meeting || !visible) {
      throw new NotFoundException(SESSION_NOT_VISIBLE_MESSAGE);
    }

    const sessions = [this.toSession(meeting, 1)];
    return this.finish({
      authorized: true,
      matched: true,
      message: '已找到这场你有权限查看的回放。',
      student: this.toStudent(viewer.platformUser),
      range: null,
      teachers: [],
      absence: false,
      sessions,
      catchUpPlan: buildCatchUpPlan(sessions),
    });
  }

  async answerForWecomUser(
    orgId: string,
    wecomUserId: string,
    question: string,
    now = new Date(),
  ): Promise<MeetingPlaybackCatchUpResult> {
    return this.catchUp(
      {
        orgId,
        userId: null,
        permissions: ['mcp-tool:meeting-playback'],
        trustedSession: true,
      },
      { question, wecomUserId },
      now,
    );
  }

  private requireOrg(caller: PlaybackCaller): string {
    if (!caller.orgId) {
      throw new BadRequestException('缺少组织上下文');
    }
    return caller.orgId;
  }

  private async resolveViewer(
    caller: PlaybackCaller,
    orgId: string,
    input: Pick<CatchUpPlaybackInput, 'wecomUserId' | 'wecomPlatformUserId'>,
  ): Promise<
    | { kind: 'denied' }
    | { kind: 'ready'; platformUser: WecomIdentity; grants: GrantRecord[] }
  > {
    const requested =
      input.wecomUserId?.trim() || input.wecomPlatformUserId?.trim();
    const linked = caller.userId
      ? await this.findLinkedWecomUsers(caller.userId)
      : [];
    let platformUser: WecomIdentity | null;

    if (!this.canAddressOthers(caller)) {
      if (!linked.length) {
        throw new ForbiddenException('当前账号没有绑定企业微信身份');
      }
      if (requested) {
        platformUser =
          linked.find(
            (user) => user.ptUserId === requested || user.id === requested,
          ) ?? null;
        if (!platformUser) {
          throw new ForbiddenException('只能查询当前账号已绑定的企业微信身份');
        }
      } else if (linked.length === 1) {
        platformUser = linked[0];
      } else {
        throw new BadRequestException(
          '当前账号绑定了多个企业微信身份，请指定 wecomUserId',
        );
      }
    } else if (requested) {
      platformUser = await this.findWecomUser(requested);
      if (!platformUser) return { kind: 'denied' };
    } else if (linked.length === 1) {
      platformUser = linked[0];
    } else {
      throw new BadRequestException('请提供企业微信成员 userid');
    }

    const grants = await this.prisma.meetingPlaybackGrant.findMany({
      where: {
        orgId,
        wecomPlatformUserId: platformUser.id,
        active: true,
        revokedAt: null,
      },
      include: {
        hosts: { select: { hostName: true, hostPlatformUserId: true } },
      },
    });
    const visible = this.visibleGrants(caller, grants);
    if (!visible.length) return { kind: 'denied' };
    return { kind: 'ready', platformUser, grants: visible };
  }

  private canAddressOthers(caller: PlaybackCaller): boolean {
    if (caller.trustedSession) return true;
    return (
      caller.permissions.includes('meeting-playback:grant') ||
      caller.permissions.includes('mcp-tool:meeting-playback')
    );
  }

  private visibleGrants(caller: PlaybackCaller, grants: GrantRecord[]) {
    if (caller.trustedSession || !caller.apiKeyId) return grants;
    return grants.filter(
      (grant) =>
        !grant.boundApiKeyId || grant.boundApiKeyId === caller.apiKeyId,
    );
  }

  private async findLinkedWecomUsers(userId: string): Promise<WecomIdentity[]> {
    return this.prisma.platformUser.findMany({
      where: {
        localUserId: userId,
        platform: Platform.WECOM,
        active: true,
        deletedAt: null,
      },
      select: {
        id: true,
        ptUserId: true,
        displayName: true,
        localUserId: true,
      },
    });
  }

  private async findWecomUser(
    identifier: string,
  ): Promise<WecomIdentity | null> {
    return this.prisma.platformUser.findFirst({
      where: {
        platform: Platform.WECOM,
        active: true,
        deletedAt: null,
        OR: [{ id: identifier }, { ptUserId: identifier }],
      },
      select: {
        id: true,
        ptUserId: true,
        displayName: true,
        localUserId: true,
      },
    });
  }

  private resolveRange(
    input: CatchUpPlaybackInput,
    parsed: ReturnType<typeof parsePlaybackQuestion>,
    absence: boolean,
    now: Date,
  ): { startAt: Date; endAt: Date } {
    if (input.startAt || input.endAt) {
      if (!input.startAt || !input.endAt) {
        throw new BadRequestException('开始时间和结束时间需要同时提供');
      }
      const startAt = new Date(input.startAt);
      const endAt = new Date(input.endAt);
      if (
        Number.isNaN(startAt.getTime()) ||
        Number.isNaN(endAt.getTime()) ||
        startAt > endAt
      ) {
        throw new BadRequestException('时间范围无效');
      }
      const days = (endAt.getTime() - startAt.getTime()) / 86_400_000;
      if (days > MAX_RANGE_DAYS) {
        throw new BadRequestException('时间范围不能超过 31 天');
      }
      return { startAt, endAt };
    }

    if (parsed.yesterday) return shanghaiDayRange(now, 1);
    if (parsed.today) return shanghaiDayRange(now, 0);

    const dayCount = parsed.dayCount ?? (absence ? 3 : null);
    if (!dayCount || dayCount > MAX_RANGE_DAYS) {
      throw new BadRequestException('请提供时间范围，或在问题里说明过去几天');
    }
    return recentShanghaiRange(dayCount, now);
  }

  private async loadMeetings(
    orgId: string,
    grants: GrantRecord[],
    range: { startAt: Date; endAt: Date },
    teachers: string[],
  ): Promise<PlaybackMeeting[]> {
    const filters: Prisma.MeetingWhereInput[] = [this.timeWhere(range)];
    const scope = this.scopeWhere(grants);
    if (scope) filters.push(scope);
    const teacherFilter = this.teacherWhere(teachers);
    if (teacherFilter) filters.push(teacherFilter);

    return this.prisma.meeting.findMany({
      where: {
        orgId,
        deletedAt: null,
        minutes: { some: { deletedAt: null } },
        AND: filters,
      },
      select: meetingSelect,
      take: QUERY_TAKE,
    });
  }

  private timeWhere(range: {
    startAt: Date;
    endAt: Date;
  }): Prisma.MeetingWhereInput {
    return {
      OR: [
        { startAt: { gte: range.startAt, lte: range.endAt } },
        {
          startAt: null,
          scheduledStartAt: { gte: range.startAt, lte: range.endAt },
        },
      ],
    };
  }

  private scopeWhere(grants: GrantRecord[]): Prisma.MeetingWhereInput | null {
    if (
      grants.some(
        (grant) => grant.scopeType === MeetingPlaybackScopeType.ORGANIZATION,
      )
    ) {
      return null;
    }

    const projectIds = grants.flatMap((grant) =>
      grant.scopeType === MeetingPlaybackScopeType.PROJECT && grant.projectId
        ? [grant.projectId]
        : [],
    );
    const hostIds = grants.flatMap((grant) =>
      grant.scopeType === MeetingPlaybackScopeType.HOSTS
        ? grant.hosts
            .map((host) => host.hostPlatformUserId)
            .filter((id): id is string => Boolean(id))
        : [],
    );
    const hostNames = grants.flatMap((grant) =>
      grant.scopeType === MeetingPlaybackScopeType.HOSTS
        ? grant.hosts.map((host) => teacherKey(host.hostName)).filter(Boolean)
        : [],
    );
    const ors: Prisma.MeetingWhereInput[] = [];
    if (projectIds.length) ors.push({ projectId: { in: projectIds } });
    if (hostIds.length) ors.push({ hostId: { in: hostIds } });
    if (hostNames.length) {
      ors.push({
        OR: hostNames.map((key) => ({
          host: { is: { displayName: { contains: key } } },
        })),
      });
    }
    return ors.length ? { OR: ors } : { id: { in: [] } };
  }

  private teacherWhere(teachers: string[]): Prisma.MeetingWhereInput | null {
    const keys = teachers.map((teacher) => teacherKey(teacher)).filter(Boolean);
    if (!keys.length) return null;
    return {
      OR: keys.map((key) => ({
        host: { is: { displayName: { contains: key } } },
      })),
    };
  }

  private grantAllows(grant: GrantRecord, meeting: PlaybackMeeting): boolean {
    if (grant.scopeType === MeetingPlaybackScopeType.ORGANIZATION) return true;
    if (grant.scopeType === MeetingPlaybackScopeType.PROJECT) {
      return grant.projectId != null && meeting.projectId === grant.projectId;
    }
    return grant.hosts.some((host) => {
      if (
        host.hostPlatformUserId &&
        meeting.host?.id === host.hostPlatformUserId
      ) {
        return true;
      }
      return hostMatchesTeacher(meeting.host?.displayName, host.hostName);
    });
  }

  private filterTeachers(meetings: PlaybackMeeting[], teachers: string[]) {
    if (!teachers.length) return meetings;
    return meetings.filter((meeting) =>
      teachers.some((teacher) =>
        hostMatchesTeacher(meeting.host?.displayName, teacher),
      ),
    );
  }

  private meetingTime(meeting: PlaybackMeeting): number {
    return (
      meeting.startAt ??
      meeting.scheduledStartAt ??
      new Date(0)
    ).getTime();
  }

  private toSession(
    meeting: PlaybackMeeting,
    order: number,
  ): MeetingPlaybackSession {
    const minute =
      meeting.minutes.find((item) => summaryFromMinute(item)) ??
      meeting.minutes[0];
    const summary = minute ? summaryFromMinute(minute) : null;
    const keySegments = readKeySegments(minute?.summary ?? null);
    const files = meeting.minutes.flatMap((item) =>
      item.files.map((file) => ({
        id: file.id,
        fileType: file.fileType,
        label: fileLabel(file.fileType),
      })),
    );
    const start = meeting.startAt ?? meeting.scheduledStartAt ?? new Date(0);

    return {
      meetingId: meeting.id,
      title: meeting.title,
      teacherName: meeting.host?.displayName?.trim() || '未知老师',
      startAt: start.toISOString(),
      endAt: meeting.endAt?.toISOString() ?? null,
      playback: {
        entryPath: playbackEntryPath(meeting.id),
        entryUrl: playbackEntryUrl(meeting.id),
        minuteId: minute?.id ?? meeting.minutes[0]?.id ?? meeting.id,
        files,
      },
      summary,
      keySegments,
      catchUp: {
        order,
        suggestion: catchUpSuggestion(summary, keySegments),
      },
    };
  }

  private toStudent(platformUser: WecomIdentity) {
    return {
      userId: platformUser.localUserId,
      displayName: platformUser.displayName,
      wecomUserId: platformUser.ptUserId,
    };
  }

  private finish(
    result: Omit<MeetingPlaybackCatchUpResult, 'replyText'>,
  ): MeetingPlaybackCatchUpResult {
    const withReply = { ...result, replyText: '' };
    return { ...withReply, replyText: formatWorkbuddyReply(withReply) };
  }
}
