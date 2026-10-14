import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OrganizationInfoPage } from './OrganizationInfoPage';

const mocks = vi.hoisted(() => ({
  save: vi.fn(),
  canUpdate: true,
  organization: {
    id: 'org-1',
    name: 'Acme',
    code: 'acme',
    active: true,
    logo: 'https://example.com/old.png',
    description: 'Test organization',
  },
}));
vi.mock('../../../shared/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { currentOrgId: 'org-1' },
    checkPermission: () => mocks.canUpdate,
  }),
}));
vi.mock('../../../shared/lib/api/orval/business/admin-organizations', () => ({
  getOrganizationControllerGetOrganizationQueryKey: (id: string) => ['organization', id],
  useOrganizationControllerGetOrganization: () => ({ data: mocks.organization, isLoading: false }),
}));
vi.mock('./organizationProfileApi', () => ({ saveOrganizationProfile: mocks.save }));

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
  mocks.canUpdate = true;
  mocks.save.mockResolvedValue(mocks.organization);
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: vi.fn(() => 'blob:logo-preview'),
  });
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      matches: false,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
  );
});
function setup() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const view = render(
    <QueryClientProvider client={client}>
      <OrganizationInfoPage />
    </QueryClientProvider>
  );
  return { ...view, user: userEvent.setup({ applyAccept: false }) };
}
async function openEditor() {
  fireEvent.click(screen.getByRole('button', { name: /编辑/ }));
  return screen.findByRole('dialog');
}
function fileInput(dialog: HTMLElement) {
  return dialog.querySelector('input[type="file"]') as HTMLInputElement;
}
describe('OrganizationInfoPage logo editor', () => {
  it('previews a selected file, defers uploading until save, and submits it with the form', async () => {
    const { user } = setup();
    const dialog = await openEditor();
    expect(screen.queryByLabelText('Logo URL')).not.toBeInTheDocument();
    expect(within(dialog).getByRole('textbox', { name: '企业编码' })).toHaveAttribute('readonly');
    expect(within(dialog).getByRole('textbox', { name: '企业编码' })).toHaveValue('acme');
    const file = new File(['png'], 'logo.png', { type: 'image/png' });
    await user.upload(fileInput(dialog), file);
    expect(await within(dialog).findByAltText('企业 Logo 预览')).toHaveAttribute(
      'src',
      'blob:logo-preview'
    );
    expect(mocks.save).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole('button', { name: /保.*存/ }));
    await waitFor(() =>
      expect(mocks.save).toHaveBeenCalledWith(
        'org-1',
        expect.objectContaining({ name: 'Acme', active: true }),
        file,
        false
      )
    );
  });
  it('omits the immutable code when saving organization information', async () => {
    setup();
    const dialog = await openEditor();
    fireEvent.click(within(dialog).getByRole('button', { name: /保.*存/ }));
    await waitFor(() => expect(mocks.save).toHaveBeenCalled());
    expect(mocks.save.mock.calls[0][1]).not.toHaveProperty('code');
  });

  it('discards selected images on cancel and restores the saved logo on reopening', async () => {
    const { user } = setup();
    let dialog = await openEditor();
    await user.upload(fileInput(dialog), new File(['png'], 'logo.png', { type: 'image/png' }));
    fireEvent.click(within(dialog).getByRole('button', { name: /取.*消/ }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(mocks.save).not.toHaveBeenCalled();
    dialog = await openEditor();
    expect(within(dialog).getByAltText('企业 Logo 预览')).toHaveAttribute(
      'src',
      mocks.organization.logo
    );
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:logo-preview');
  });
  it('removes a logo only when saving', async () => {
    setup();
    const dialog = await openEditor();
    fireEvent.click(within(dialog).getByRole('button', { name: /移除 Logo/ }));
    expect(within(dialog).queryByAltText('企业 Logo 预览')).not.toBeInTheDocument();
    expect(mocks.save).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole('button', { name: /保.*存/ }));
    await waitFor(() =>
      expect(mocks.save).toHaveBeenCalledWith('org-1', expect.any(Object), undefined, true)
    );
  });
  it('rejects unsupported and oversized files without replacing the preview', async () => {
    const { user } = setup();
    const dialog = await openEditor();
    await user.upload(fileInput(dialog), new File(['svg'], 'logo.svg', { type: 'image/svg+xml' }));
    expect(await screen.findByText('Logo 仅支持 JPEG、PNG 或 WebP 格式')).toBeInTheDocument();
    const large = new File(['png'], 'large.png', { type: 'image/png' });
    Object.defineProperty(large, 'size', { value: 5 * 1024 * 1024 + 1 });
    await user.upload(fileInput(dialog), large);
    expect(await screen.findByText('Logo 文件不能超过 5 MB')).toBeInTheDocument();
    expect(within(dialog).getByAltText('企业 Logo 预览')).toHaveAttribute(
      'src',
      mocks.organization.logo
    );
    expect(mocks.save).not.toHaveBeenCalled();
  });
  it('keeps the selected image after save fails so the user can retry', async () => {
    mocks.save.mockRejectedValueOnce(new Error('offline'));
    const { user } = setup();
    const dialog = await openEditor();
    await user.upload(fileInput(dialog), new File(['png'], 'logo.png', { type: 'image/png' }));
    fireEvent.click(within(dialog).getByRole('button', { name: /保.*存/ }));
    expect(await screen.findByText('企业信息保存失败，请重试')).toBeInTheDocument();
    expect(within(dialog).getByAltText('企业 Logo 预览')).toHaveAttribute(
      'src',
      'blob:logo-preview'
    );
  });
  it('hides the edit action without update permission', () => {
    mocks.canUpdate = false;
    setup();
    expect(screen.queryByRole('button', { name: /编辑/ })).not.toBeInTheDocument();
  });
});
