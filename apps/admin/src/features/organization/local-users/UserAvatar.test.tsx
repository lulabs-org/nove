import { render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { UserAvatar } from './UserAvatar';
import type { AdminUser } from './types';

beforeAll(() => {
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
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  );
});

function createUser(overrides: Partial<AdminUser> = {}): AdminUser {
  return {
    id: 'user-1',
    username: 'yangshiming',
    email: 'yangshiming@example.com',
    countryCode: '+86',
    phone: null,
    active: true,
    emailVerified: true,
    phoneVerified: false,
    lastLoginAt: null,
    createdAt: '2026-09-17T00:00:00.000Z',
    updatedAt: '2026-09-17T00:00:00.000Z',
    profile: null,
    ...overrides,
  };
}

describe('UserAvatar', () => {
  it('renders the avatar returned by the flat list response', () => {
    const { container } = render(
      <UserAvatar
        user={createUser({
          displayName: '杨仕明',
          avatar: 'https://cdn.example.com/avatar.webp',
        })}
      />
    );

    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      'https://cdn.example.com/avatar.webp'
    );
  });

  it('falls back to the same name text style as organization members', () => {
    render(<UserAvatar user={createUser({ displayName: '杨仕明' })} />);

    expect(screen.getByText('仕明')).toBeInTheDocument();
  });
});
