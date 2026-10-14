import { beforeEach, describe, expect, it, vi } from 'vitest';
import { minuteApi } from './minuteApi';

const apiMocks = vi.hoisted(() => ({
  list: vi.fn(),
  getById: vi.fn(),
  delete: vi.fn(),
  getTranscript: vi.fn(),
  mutator: vi.fn(),
}));

vi.mock('../../../shared/lib/api/mutator', () => ({ mutator: apiMocks.mutator }));
vi.mock('../../../shared/lib/api/orval/business/minute', () => ({
  minuteControllerGetMinutes: apiMocks.list,
  minuteControllerGetMinuteById: apiMocks.getById,
  minuteControllerDeleteMinute: apiMocks.delete,
  minuteControllerGetTranscript: apiMocks.getTranscript,
}));

describe('minuteApi', () => {
  beforeEach(() => vi.clearAllMocks());

  it('passes standalone list filters to the generated minute client', async () => {
    const response = { data: [], total: 0, page: 1, limit: 10, totalPages: 0 };
    apiMocks.list.mockResolvedValue(response);

    await expect(
      minuteApi.list({ search: '周会', meetingId: 'meeting-1', page: 1, limit: 10 })
    ).resolves.toBe(response);
    expect(apiMocks.list).toHaveBeenCalledWith({
      search: '周会',
      meetingId: 'meeting-1',
      page: 1,
      limit: 10,
    });
  });

  it('loads structured transcript segments with local user details', async () => {
    const segment = {
      id: 'segment-1',
      speakerName: '平台姓名',
      startTime: '00:00:01',
      endTime: '00:00:02',
      text: '发言内容',
    };
    apiMocks.getTranscript.mockResolvedValue({ transcriptId: 'transcript-1', data: [segment] });

    await expect(minuteApi.getTranscript('minute-1')).resolves.toEqual([segment]);
    expect(apiMocks.getTranscript).toHaveBeenCalledWith('minute-1', { includeLocalUser: true });
  });

  it('treats missing transcript and summary resources as empty content', async () => {
    const notFound = { isAxiosError: true, response: { status: 404 } };
    apiMocks.getTranscript.mockRejectedValue(notFound);
    apiMocks.mutator.mockRejectedValue(notFound);

    await expect(minuteApi.getTranscript('minute-1')).resolves.toEqual([]);
    await expect(minuteApi.getSummary('minute-1')).resolves.toBeNull();
  });

  it('loads meeting participants and current minute speaker summaries', async () => {
    apiMocks.mutator.mockResolvedValue({ data: [], total: 0, page: 1, limit: 100 });

    await minuteApi.getParticipants('meeting-1', { page: 1, limit: 100 });
    expect(apiMocks.mutator).toHaveBeenLastCalledWith({
      url: '/meetings/meeting-1/participants',
      method: 'GET',
      params: { page: 1, limit: 100 },
    });

    await minuteApi.getSpeakerSummaries('minute-1');
    expect(apiMocks.mutator).toHaveBeenLastCalledWith({
      url: '/minutes/minute-1/speaker-summaries',
      method: 'GET',
      params: { page: 1, limit: 100 },
    });
  });
});
