import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '../model/authStore';
import { OAuthConsentPage } from './OAuthConsentPage';
import { getOAuthAuthorizationRequest } from './api';

vi.mock('./api', () => ({
  approveOAuthAuthorizationRequest: vi.fn(),
  denyOAuthAuthorizationRequest: vi.fn(),
  getOAuthAuthorizationRequest: vi.fn(),
}));

describe('OAuthConsentPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      isAuthenticated: true,
      loading: false,
      user: {
        active: true,
        createdAt: '2026-08-25T00:00:00.000Z',
        email: 'user@example.test',
        emailVerified: true,
        id: 'user-1',
        name: '测试用户',
        permissions: ['meeting:read', 'meeting:delete'],
        phoneVerified: false,
        roles: ['USER'],
      },
    });
    vi.mocked(getOAuthAuthorizationRequest).mockResolvedValue({
      client: {
        clientId: 'nove-cli',
        description: 'Official Nove command line client',
        logoUri: null,
        name: 'Nove CLI',
      },
      expiresAt: '2026-08-25T00:05:00.000Z',
      organizations: [{ code: 'NOVE', id: 'org-1', name: 'Nove' }],
      permissions: [
        {
          action: 'read',
          code: 'meeting:read',
          description: '查看会议',
          name: '查看会议',
          resource: 'meeting',
        },
        {
          action: 'read',
          code: 'minute:read',
          description: '查看妙记',
          name: '查看妙记',
          resource: 'minute',
        },
        {
          action: 'delete',
          code: 'meeting:delete',
          description: '删除会议',
          name: '删除会议',
          resource: 'meeting',
        },
      ],
      requestId: 'request-1',
    });
  });

  it('preselects read access and requires explicit selection for destructive access', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/oauth/consent?request_id=request-1']}>
        <OAuthConsentPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('Nove CLI 请求访问')).toBeInTheDocument();
    const checkboxes = screen.getAllByRole('checkbox');
    await waitFor(() => expect(checkboxes[0]).toBeChecked());
    expect(checkboxes[1]).not.toBeChecked();
    expect(screen.getByText('高风险')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /会议.*1\/2/ })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(screen.getByRole('tab', { name: /妙记.*1\/1/ })).toHaveAttribute(
      'aria-selected',
      'false'
    );

    await user.click(checkboxes[1]);
    expect(checkboxes[1]).toBeChecked();
    expect(screen.getByLabelText('已选择 3 项权限')).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('搜索权限资源'), '妙记');
    await waitFor(() =>
      expect(screen.getByRole('tab', { name: /妙记.*1\/1/ })).toHaveAttribute(
        'aria-selected',
        'true'
      )
    );
    expect(screen.queryByRole('tab', { name: /会议/ })).not.toBeInTheDocument();
  });
});
