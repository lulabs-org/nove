import { WecomEventProcessor } from './wecom-event.processor';

describe('WecomEventProcessor', () => {
  it('answers a Workbuddy text as the sending WeCom user', async () => {
    const customer = { syncExternalContact: jest.fn() };
    const client = {
      sendWorkbuddyText: jest.fn().mockResolvedValue({ sent: false }),
    };
    const playback = {
      answerForWecomUser: jest.fn().mockResolvedValue({
        replyText: '柳潼，找到 2 场可以补看的回放。',
        authorized: true,
        matched: true,
      }),
    };
    const org = { getOrgId: () => 'org-1' };
    const processor = new WecomEventProcessor(
      customer as never,
      client as never,
      playback as never,
      org as never,
    );

    await processor.process({
      id: 'job-1',
      name: 'workbuddy_text',
      data: {
        wecomUserId: 'liutong',
        content: '过去两三天我都没来，张老师那边、叶老师那边都讲了什么？',
      },
    } as never);

    expect(playback.answerForWecomUser).toHaveBeenCalledWith(
      'org-1',
      'liutong',
      '过去两三天我都没来，张老师那边、叶老师那边都讲了什么？',
    );
    expect(client.sendWorkbuddyText).toHaveBeenCalledWith(
      'liutong',
      '柳潼，找到 2 场可以补看的回放。',
    );
  });
});
