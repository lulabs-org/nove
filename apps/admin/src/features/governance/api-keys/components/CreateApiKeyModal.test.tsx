import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CreateApiKeyModal } from './CreateApiKeyModal';
import type { CreateApiKeyResult } from '../types';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
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

vi.mock('../../../../shared/hooks/useAuth', () => ({
  useAuth: () => ({ user: { permissions: [] } }),
}));

const result: CreateApiKeyResult = {
  id: 'key-1',
  name: 'test',
  prefix: 'prefix',
  last4: 'last',
  status: 'ACTIVE',
  scopes: [],
  createdAt: '2026-08-18T00:00:00.000Z',
  key: 'redacted-test-key',
};

describe('CreateApiKeyModal success state', () => {
  it('closes without submitting again when the user clicks complete', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    const onComplete = vi.fn();
    const onSubmit = vi.fn();

    render(
      <CreateApiKeyModal
        open
        loading={false}
        result={result}
        onCancel={onCancel}
        onComplete={onComplete}
        onSubmit={onSubmit}
      />
    );

    await user.click(screen.getByRole('button', { name: /我\s*已\s*保\s*存.*完\s*成/ }));

    expect(onComplete).toHaveBeenCalledOnce();
    expect(onCancel).not.toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('keeps the result open after copying the key', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    render(
      <CreateApiKeyModal
        open
        loading={false}
        result={result}
        onCancel={vi.fn()}
        onComplete={onComplete}
        onSubmit={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: /复制密钥/ }));

    expect(writeText).toHaveBeenCalledWith('redacted-test-key');
    expect(onComplete).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /已复制/ })).toBeInTheDocument();
  });
});
