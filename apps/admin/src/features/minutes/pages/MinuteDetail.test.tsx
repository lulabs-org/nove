import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { PERMISSIONS } from '../../../shared/utils/permissions';
import { MinuteDetail } from './MinuteDetail';

const mocks = vi.hoisted(() => ({
  checkPermission: vi.fn(),
  getById: vi.fn(),
  getSummary: vi.fn(),
  getTranscript: vi.fn(),
  getMeeting: vi.fn(),
  getParticipants: vi.fn(),
  getSpeakerSummaries: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('../../../shared/hooks/useAuth', () => ({
  useAuth: () => ({ checkPermission: mocks.checkPermission }),
}));
vi.mock('../api/minuteApi', () => ({
  minuteApi: {
    getById: mocks.getById,
    getSummary: mocks.getSummary,
    getTranscript: mocks.getTranscript,
    getMeeting: mocks.getMeeting,
    getParticipants: mocks.getParticipants,
    getSpeakerSummaries: mocks.getSpeakerSummaries,
    delete: mocks.delete,
  },
}));

function renderDetail() {
  return render(
    <MemoryRouter initialEntries={['/minutes/minute-1']}>
      <Routes>
        <Route path="/minutes/:id" element={<MinuteDetail />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('MinuteDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      }
    );
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))
    );
    mocks.checkPermission.mockReturnValue(true);
    mocks.getById.mockResolvedValue({
      id: 'minute-1',
      source: 'PLATFORM_AUTO',
      metadata: {},
      meetingId: 'meeting-1',
      meeting: {
        id: 'meeting-1',
        title: '产品周会',
        platform: 'TENCENT_MEETING',
        startAt: '2026-08-31T01:00:00.000Z',
        endAt: null,
      },
      startAt: '2026-08-31T01:00:00.000Z',
      endAt: null,
      createdAt: '2026-08-31T01:00:00.000Z',
      updatedAt: '2026-08-31T02:00:00.000Z',
    });
    mocks.getSummary.mockResolvedValue({
      id: 'summary-1',
      content: '本次会议完成了模块拆分。',
      createdAt: '2026-08-31T01:00:00.000Z',
      updatedAt: '2026-08-31T02:00:00.000Z',
    });
    mocks.getMeeting.mockResolvedValue({
      id: 'meeting-1',
      title: '产品周会',
      platform: 'TENCENT_MEETING',
      type: 'RECURRING',
      meetingId: 'external-meeting-1',
      subMeetingId: '__ROOT__',
    });
    mocks.getTranscript.mockResolvedValue([
      {
        id: 'segment-1',
        speakerName: '张三',
        startTime: '00:00:01',
        endTime: '00:00:03',
        text: '逐字稿内容',
      },
    ]);
    mocks.getParticipants.mockResolvedValue({
      data: [
        {
          id: 'participant-1',
          meetingId: 'meeting-1',
          firstJoinTime: null,
          lastLeaveTime: null,
          totalDurationSeconds: 60,
          platformUser: {
            id: 'platform-user-1',
            platform: 'TENCENT_MEETING',
            displayName: '张三',
            avatarUrl: null,
          },
          user: null,
        },
      ],
      total: 1,
      page: 1,
      limit: 100,
      totalPages: 1,
    });
    mocks.getSpeakerSummaries.mockResolvedValue({
      data: [
        {
          id: 'speaker-summary-1',
          minuteId: 'minute-1',
          platformUserId: 'platform-user-1',
          partSummary: '张三负责后续验证。',
          keywords: [],
          createdAt: '2026-08-31T01:00:00.000Z',
          updatedAt: '2026-08-31T02:00:00.000Z',
        },
      ],
      total: 1,
      page: 1,
      limit: 100,
      totalPages: 1,
    });
  });

  it('loads minute content independently and matches speaker summaries by platform user ID', async () => {
    renderDetail();

    expect(await screen.findByRole('heading', { name: '产品周会' })).toBeInTheDocument();
    expect(await screen.findByText('本次会议完成了模块拆分。')).toBeInTheDocument();
    expect(mocks.getMeeting).toHaveBeenCalledWith('meeting-1');

    fireEvent.click(screen.getByRole('tab', { name: /逐字稿/ }));
    expect(await screen.findByText('逐字稿内容')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: /参会成员/ }));
    expect(await screen.findByText('张三')).toBeInTheDocument();
    fireEvent.click(await screen.findByRole('button', { name: '查看总结' }));
    expect(await screen.findByText('张三负责后续验证。')).toBeInTheDocument();
    expect(mocks.getSpeakerSummaries).toHaveBeenCalledWith('minute-1');
  });

  it('hides meeting and summary tabs without their resource permissions', async () => {
    mocks.checkPermission.mockImplementation(
      (permission: string) => permission === PERMISSIONS.MINUTE.READ
    );
    renderDetail();

    await screen.findByRole('heading', { name: '产品周会' });
    expect(screen.queryByRole('tab', { name: '纪要' })).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /参会成员/ })).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /逐字稿/ })).toBeInTheDocument();
    await waitFor(() => expect(mocks.getTranscript).toHaveBeenCalledWith('minute-1'));
    expect(mocks.getSummary).not.toHaveBeenCalled();
    expect(mocks.getMeeting).not.toHaveBeenCalled();
  });
});
