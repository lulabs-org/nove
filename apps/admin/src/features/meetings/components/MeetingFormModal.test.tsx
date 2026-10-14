import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Meeting } from '../model/types';
import { MeetingFormModal } from './MeetingFormModal';

Object.defineProperty(window, 'matchMedia', {
  configurable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

vi.stubGlobal(
  'ResizeObserver',
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
);

const meeting: Meeting = {
  id: 'meeting-1',
  platform: 'TENCENT_MEETING',
  meetingId: 'platform-meeting-1',
  subMeetingId: '',
  title: '契约联调会议',
  type: 'SCHEDULED',
  tags: [],
  host: null,
  hasRecording: true,
  recordingStatus: 'COMPLETED',
  processingStatus: 'COMPLETED',
  createdAt: '2026-08-24T00:00:00.000Z',
  updatedAt: '2026-08-24T00:00:00.000Z',
};

describe('MeetingFormModal derived fields', () => {
  it('does not render or submit recording-derived fields', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<MeetingFormModal open meeting={meeting} onCancel={vi.fn()} onSubmit={onSubmit} />);

    expect(screen.queryByText('是否有录制')).not.toBeInTheDocument();
    expect(screen.queryByText('录制处理状态')).not.toBeInTheDocument();
    expect(screen.queryByText('会议处理状态')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /保\s*存/ }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    const payload = onSubmit.mock.calls[0][0] as Record<string, unknown>;
    expect(payload).not.toHaveProperty('hasRecording');
    expect(payload).not.toHaveProperty('recordingStatus');
    expect(payload).not.toHaveProperty('processingStatus');
  });
});
