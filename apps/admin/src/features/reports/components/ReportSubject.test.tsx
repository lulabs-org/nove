import { render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { ReportTargetSummary } from './ReportSubject';

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
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
});

describe('ReportTargetSummary', () => {
  it('renders the generic tracking target name and type', () => {
    render(
      <ReportTargetSummary
        target={{
          id: 'target-row-1',
          targetType: 'ORGANIZATION',
          targetId: 'org-1',
          nameSnapshot: 'Nove',
        }}
      />
    );
    expect(screen.getByText('Nove')).toBeInTheDocument();
    expect(screen.getByText('组织')).toBeInTheDocument();
  });
});
