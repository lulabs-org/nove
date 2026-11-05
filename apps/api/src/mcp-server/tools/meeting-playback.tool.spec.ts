import { ForbiddenException } from '@nestjs/common';
import { MeetingPlaybackTool } from './meeting-playback.tool';

describe('MeetingPlaybackTool', () => {
  it('returns an empty session list when the identity is not allowed', async () => {
    const playback = {
      catchUp: jest
        .fn()
        .mockRejectedValue(
          new ForbiddenException('只能查询当前账号已绑定的企业微信身份'),
        ),
    };
    const tool = new MeetingPlaybackTool(playback as never);

    const result = await tool.catchUp(
      { wecomUserId: 'other-student', question: '过去三天张老师讲了什么' },
      {},
      {
        user: {
          sub: 'user-liutong',
          orgId: 'org-1',
          scopes: ['meeting-playback:read'],
        },
      } as never,
    );

    expect(result.authorized).toBe(false);
    expect(result.sessions).toEqual([]);
    expect(result.replyText).toContain('只能查询当前账号已绑定的企业微信身份');
  });
});
