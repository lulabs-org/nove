import { WecomEventService } from './wecom-event.service';

describe('WecomEventService Workbuddy text', () => {
  const queue = { add: jest.fn().mockResolvedValue(undefined) };
  const service = new WecomEventService(queue as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('queues a Workbuddy text using the sender, not a name inside the question', async () => {
    await service.handleWecomEvent(
      '<xml><ToUserName>corp</ToUserName><FromUserName>liutong</FromUserName><MsgType>text</MsgType><Content>过去两三天我都没来，张老师那边、叶老师那边都讲了什么？</Content></xml>',
    );

    expect(queue.add).toHaveBeenCalledWith(
      'workbuddy_text',
      {
        wecomUserId: 'liutong',
        content: '过去两三天我都没来，张老师那边、叶老师那边都讲了什么？',
      },
      expect.objectContaining({ attempts: 3 }),
    );
  });

  it('leaves non-text events off the Workbuddy queue', async () => {
    await service.handleWecomEvent(
      '<xml><MsgType>event</MsgType><Event>change_external_tag</Event><FromUserName>admin</FromUserName><ChangeType>update</ChangeType><Id>tag-1</Id></xml>',
    );

    expect(queue.add).not.toHaveBeenCalledWith(
      'workbuddy_text',
      expect.anything(),
      expect.anything(),
    );
  });
});
