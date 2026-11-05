import { Injectable, HttpException } from '@nestjs/common';
import { Tool, ToolScopes, type McpRequestWithUser } from '@rekog/mcp-nest';
import { z } from 'zod';
import { MeetingPlaybackService } from '@/meeting-playback/meeting-playback.service';
import type {
  MeetingPlaybackCatchUpResult,
  PlaybackCaller,
} from '@/meeting-playback/meeting-playback.types';
import type { AuthContext } from '@/auth/types/auth-context.interface';

const emptyResult = (message: string): MeetingPlaybackCatchUpResult => ({
  authorized: false,
  matched: false,
  message,
  student: null,
  range: null,
  teachers: [],
  absence: false,
  sessions: [],
  catchUpPlan: null,
  replyText: message,
});

@Injectable()
export class MeetingPlaybackTool {
  constructor(private readonly playbackService: MeetingPlaybackService) {}

  @Tool({
    name: 'catch-up-meeting-playbacks',
    description:
      '为当前企业微信 Workbuddy 会话中的同学查询已授权的会议回放，返回回放入口、纪要摘要和补课顺序。wecomUserId 必须是会话发送人，不能从问题文本里猜测另一名同学。',
    parameters: z.object({
      wecomUserId: z
        .string()
        .optional()
        .describe('会话发送人的企业微信 userid'),
      question: z
        .string()
        .optional()
        .describe('同学的原话，用于识别时间、老师和缺席'),
      teachers: z
        .string()
        .optional()
        .describe('老师过滤，多个用逗号分隔，例如 张老师,叶老师'),
      absence: z.boolean().optional().describe('同学表示最近没来上课'),
      startDate: z.string().optional().describe('开始时间，ISO 8601'),
      endDate: z.string().optional().describe('结束时间，ISO 8601'),
    }),
  })
  @ToolScopes(['mcp-tool:meeting-playback'])
  catchUp(
    args: {
      wecomUserId?: string;
      question?: string;
      teachers?: string;
      absence?: boolean;
      startDate?: string;
      endDate?: string;
    },
    _context: unknown,
    httpRequest: McpRequestWithUser,
  ) {
    return this.run(() =>
      this.playbackService.catchUp(callerFromRequest(httpRequest), {
        wecomUserId: args.wecomUserId,
        question: args.question,
        teachers: splitTeachers(args.teachers),
        absence: args.absence,
        startAt: args.startDate,
        endAt: args.endDate,
      }),
    );
  }

  @Tool({
    name: 'get-meeting-playback',
    description:
      '按会议 ID 读取当前企业微信身份被授权的单场回放。无权或不存在时不要编造内容。',
    parameters: z.object({
      meetingId: z.string().describe('会议 ID'),
      wecomUserId: z
        .string()
        .optional()
        .describe('会话发送人的企业微信 userid'),
    }),
  })
  @ToolScopes(['mcp-tool:meeting-playback'])
  getSession(
    args: { meetingId: string; wecomUserId?: string },
    _context: unknown,
    httpRequest: McpRequestWithUser,
  ) {
    return this.run(() =>
      this.playbackService.getSession(
        callerFromRequest(httpRequest),
        args.meetingId,
        { wecomUserId: args.wecomUserId },
      ),
    );
  }

  private async run(
    action: () => Promise<MeetingPlaybackCatchUpResult>,
  ): Promise<MeetingPlaybackCatchUpResult> {
    try {
      return await action();
    } catch (error) {
      if (error instanceof HttpException) {
        return emptyResult(error.message);
      }
      throw error;
    }
  }
}

function splitTeachers(value: string | undefined): string[] | undefined {
  if (!value?.trim()) return undefined;
  const teachers = value
    .split(/[,，]/)
    .map((item) => item.trim())
    .filter(Boolean);
  return teachers.length ? teachers : undefined;
}

function callerFromRequest(httpRequest: McpRequestWithUser): PlaybackCaller {
  const request = httpRequest as McpRequestWithUser & {
    authContext?: AuthContext;
  };
  if (request.authContext) {
    return {
      orgId: request.authContext.orgId,
      userId: request.authContext.userId,
      apiKeyId: request.authContext.apiKeyId ?? null,
      permissions: request.authContext.permissions ?? [],
    };
  }

  const user = request.user as
    | {
        sub?: string;
        orgId?: string;
        scopes?: string[];
        apiKeyId?: string;
      }
    | undefined;
  return {
    orgId: user?.orgId ?? null,
    userId: user?.sub ? user.sub : null,
    apiKeyId: user?.apiKeyId ?? null,
    permissions: user?.scopes ?? [],
  };
}
