import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { IntegrationsManagement } from './IntegrationsManagement';

const mocks = vi.hoisted(() => ({
  canWrite: true,
  roles: ['ADMIN'],
  listConfigs: vi.fn(),
  getConfig: vi.fn(),
  testConfig: vi.fn(),
  uploadMailBrandLogo: vi.fn(),
  removeMailBrandLogo: vi.fn(),
}));

vi.mock('../../../shared/hooks/useAuth', () => ({
  useAuth: () => ({
    checkPermission: () => mocks.canWrite,
    user: { roles: mocks.roles },
  }),
}));

vi.mock('./api/integrationsApi', () => ({
  integrationsApi: {
    list: mocks.listConfigs,
    get: mocks.getConfig,
    update: vi.fn(),
    test: mocks.testConfig,
    remove: vi.fn(),
    uploadMailBrandLogo: mocks.uploadMailBrandLogo,
    removeMailBrandLogo: mocks.removeMailBrandLogo,
  },
}));

describe('IntegrationsManagement', () => {
  beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: false,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
    globalThis.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  });

  beforeEach(() => {
    mocks.canWrite = true;
    mocks.roles = ['ADMIN'];
    mocks.uploadMailBrandLogo.mockResolvedValue({
      url: 'https://cdn.example.com/mail-brand-logos/org-1/new.webp',
    });
    mocks.removeMailBrandLogo.mockResolvedValue({ url: null });
    mocks.listConfigs.mockResolvedValue(
      [
        'mail',
        'ai',
        'tencent-meeting',
        'lark',
        'wechat-shop',
        'wecom',
        'storage',
        'drive',
        'file-scanning',
        'stripe',
        'aliyun-sms',
      ].map((module) => ({
        orgId: 'org-1',
        module,
        configured: module === 'mail' || module === 'storage',
        source: module === 'mail' ? 'database' : 'default',
        updatedAt: null,
        environmentImportedAt: module === 'mail' ? '2026-09-01T00:00:00.000Z' : null,
        environmentImportedFields: module === 'mail' ? ['host', 'user'] : [],
      }))
    );
    mocks.getConfig.mockImplementation((module: string) =>
      Promise.resolve({
        orgId: 'org-1',
        module,
        configured: module === 'mail',
        source: module === 'mail' ? 'database' : 'default',
        updatedAt: null,
        environmentImportedAt: module === 'mail' ? '2026-09-01T00:00:00.000Z' : null,
        environmentImportedFields: module === 'mail' ? ['host', 'user'] : [],
        value: {
          mail: {
            host: 'smtp.example.com',
            port: 465,
            secure: true,
            user: 'noreply@example.com',
            pass: '********',
            from: 'noreply@example.com',
            brandName: 'Nove System',
            brandPrimaryColor: '#2563eb',
            brandLogoUrl: '',
            brandPublicBaseUrl: 'https://app.example.com',
            brandFooterText: '系统邮件页脚',
          },
          ai: {
            provider: 'ark',
            model: 'doubao-pro',
            baseUrl: 'https://ark.example.com/v3',
            apiKey: '********',
            maxTokens: 16000,
            temperature: 0.7,
          },
          'tencent-meeting': {
            appId: 'tencent-app',
            sdkId: 'tencent-sdk',
            secretId: '********',
            secretKey: '********',
            userId: 'default-user',
            webhookToken: '',
            encodingAesKey: '********',
          },
          lark: {
            appId: 'lark-app',
            appSecret: '********',
            eventEncryptKey: '********',
            eventVerificationToken: '********',
          },
          'wechat-shop': {
            appId: 'wechat-app',
            appSecret: '********',
            webhookToken: '********',
            encodingAesKey: '',
            apiBaseUrl: 'https://api.weixin.qq.com',
          },
          wecom: {
            corpId: 'ww123456789',
            corpSecret: '********',
            webhookToken: '********',
            encodingAesKey: '********',
            apiBaseUrl: 'https://qyapi.weixin.qq.com',
          },
          storage: {
            provider: 'OSS',
            region: 'oss-cn-hangzhou',
            bucket: 'test-bucket',
            accessKeyId: 'test-ak',
            accessKeySecret: '********',
            publicBaseUrl: 'https://cdn.example.com',
            signedUrlExpiresSeconds: 600,
          },
          drive: {
            allowedExtensions: ['.pdf', '.docx'],
            imageMaxMiB: 20,
            documentMaxMiB: 100,
            audioMaxMiB: 2048,
            videoMaxMiB: 20480,
            downloadUrlExpiresSeconds: 600,
            recycleRetentionDays: 30,
          },
          'file-scanning': {
            malwareScanProvider: 'ALIYUN_SAS',
            aliyunSasRegionId: 'cn-beijing',
            scanTimeoutMs: 300000,
            scanPollIntervalMs: 3000,
            clamAvPort: 3310,
            clamAvTimeoutMs: 600000,
          },
          stripe: {
            secretKey: '********',
            publishableKey: 'pk_test_123',
            webhookSecret: '********',
            currency: 'USD',
          },
          'aliyun-sms': {
            accessKeyId: '********',
            accessKeySecret: '********',
            signName: '测试签名',
            verificationTemplateCode: 'SMS_VERIFICATION1',
            securityChangeTemplateCode: 'SMS_SECURITY1',
          },
        }[module],
      })
    );
  });

  it('renders grouped service navigation and the Lark restart boundary', async () => {
    render(<IntegrationsManagement />);

    expect(await screen.findByText('邮件服务配置')).toBeInTheDocument();
    expect(screen.getByLabelText('查看配置说明')).toBeInTheDocument();
    expect(screen.queryByText('密钥更新说明')).not.toBeInTheDocument();
    expect(screen.getByText('通知服务')).toBeInTheDocument();
    expect(screen.getByText('AI 能力')).toBeInTheDocument();
    expect(screen.getByText('会议集成')).toBeInTheDocument();
    expect(screen.getByText('通讯与协同')).toBeInTheDocument();
    expect(screen.getByText('交易集成')).toBeInTheDocument();
    expect(screen.getByLabelText('只读配置详情')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /编辑配置/ })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /编辑配置/ }));

    const passwordInput = await screen.findByPlaceholderText('输入新密码以替换');
    expect(passwordInput).toHaveValue('********');
    await userEvent.clear(passwordInput);
    await userEvent.type(passwordInput, 'replacement-secret');
    expect(passwordInput).toHaveValue('replacement-secret');

    await userEvent.click(screen.getByRole('button', { name: '取消编辑' }));
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /编辑配置/ })).toBeInTheDocument();

    await userEvent.click(screen.getByLabelText('查看配置说明'));
    expect(await screen.findByText('初始配置来源')).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText('查看配置说明'));

    await userEvent.click(screen.getByText('飞书'));
    await waitFor(() => expect(mocks.getConfig).toHaveBeenCalledWith('lark'));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    await userEvent.click(screen.getByLabelText('查看配置说明'));
    expect(await screen.findByText('飞书长连接')).toBeInTheDocument();
  }, 15_000);

  it('uploads a local mail brand logo without exposing URL fields', async () => {
    const user = userEvent.setup();
    render(<IntegrationsManagement />);
    await screen.findByText('邮件服务配置');
    await user.click(screen.getByRole('button', { name: /编辑配置/ }));

    expect(await screen.findByText('上传 Logo')).toBeInTheDocument();
    expect(screen.queryByLabelText('Logo URL')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('公开访问地址')).not.toBeInTheDocument();

    const input = document.querySelector('input[type="file"]');
    expect(input).not.toBeNull();
    const file = new File(['logo'], 'logo.png', { type: 'image/png' });
    await user.upload(input as HTMLInputElement, file);

    await waitFor(() => expect(mocks.uploadMailBrandLogo).toHaveBeenCalledWith(file));
  }, 15_000);

  it('renders a content-only detail view without edit controls for read-only users', async () => {
    mocks.canWrite = false;
    const { container } = render(<IntegrationsManagement />);

    expect(await screen.findByText('smtp.example.com')).toBeInTheDocument();
    expect(screen.getByLabelText('只读配置详情')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
    expect(container.querySelector('.ant-form-item-required')).toBeNull();
    expect(screen.queryByRole('button', { name: '删除数据库配置' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '测试连接' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /保存配置/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /刷新/ })).toBeInTheDocument();
    expect(screen.getByLabelText('查看配置说明')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /编辑配置/ })).not.toBeInTheDocument();
    expect(screen.getByText('已启用')).toBeInTheDocument();
    expect(screen.getByText('#2563eb')).toBeInTheDocument();
    expect(screen.getAllByText('已配置（不可查看）')).toHaveLength(1);
    expect(screen.getAllByText('未配置').length).toBeGreaterThan(0);

    await userEvent.click(screen.getByText('AI 模型'));
    expect(await screen.findByText('模型服务')).toBeInTheDocument();
    expect(screen.getByText('生成参数')).toBeInTheDocument();
    expect(screen.getByText('火山方舟')).toBeInTheDocument();
    expect(screen.getByText('doubao-pro')).toBeInTheDocument();

    await userEvent.click(screen.getByText('腾讯会议'));
    expect(await screen.findByText('API 凭证')).toBeInTheDocument();
    expect(screen.getByText('default-user')).toBeInTheDocument();
    expect(screen.getAllByText('已配置（不可查看）')).toHaveLength(3);

    await userEvent.click(screen.getByText('飞书'));
    expect(await screen.findByText('应用配置')).toBeInTheDocument();
    expect(screen.getByText('事件订阅')).toBeInTheDocument();
    expect(screen.getByText('lark-app')).toBeInTheDocument();

    await userEvent.click(screen.getByText('微信小店'));
    expect(await screen.findByText('应用凭证')).toBeInTheDocument();
    expect(screen.getByText('API 地址')).toBeInTheDocument();
    expect(screen.getByText('https://api.weixin.qq.com')).toBeInTheDocument();
    expect(screen.getAllByText('未配置').length).toBeGreaterThan(0);

    await userEvent.click(screen.getByText('企业微信'));
    expect(await screen.findByText('企业凭证')).toBeInTheDocument();
    expect(screen.getByText('ww123456789')).toBeInTheDocument();
    expect(screen.getAllByText('已配置（不可查看）').length).toBeGreaterThan(0);
  }, 15_000);

  it('edits drive policies without unsupported connection test', async () => {
    const user = userEvent.setup();
    render(<IntegrationsManagement />);
    await user.click(await screen.findByText('云盘策略'));
    await waitFor(() => expect(mocks.getConfig).toHaveBeenCalledWith('drive'));
    await user.click(await screen.findByRole('button', { name: /编辑配置/ }));
    expect(await screen.findByLabelText('允许扩展名')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '测试连接' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /保存配置/ })).toBeInTheDocument();
  }, 15_000);

  it('displays and edits storage configurations with connection testing', async () => {
    const user = userEvent.setup();
    render(<IntegrationsManagement />);
    await user.click(await screen.findByText('对象存储'));
    await waitFor(() => expect(mocks.getConfig).toHaveBeenCalledWith('storage'));
    expect(await screen.findByText('存储服务商')).toBeInTheDocument();
    expect(screen.getByText('test-bucket')).toBeInTheDocument();
    expect(screen.getByText('复用私有存储桶')).toBeInTheDocument();

    await user.click(await screen.findByRole('button', { name: /编辑配置/ }));
    expect(await screen.findByLabelText(/私有存储桶/)).toBeInTheDocument();
    expect(screen.getByLabelText(/公共存储桶/)).toBeInTheDocument();
    expect(screen.getByLabelText('AccessKey ID')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '测试连接' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /保存配置/ })).toBeInTheDocument();
  }, 15_000);

  it('edits file scanning configurations', async () => {
    const user = userEvent.setup();
    render(<IntegrationsManagement />);
    await user.click(await screen.findByText('病毒扫描'));
    await waitFor(() => expect(mocks.getConfig).toHaveBeenCalledWith('file-scanning'));
    await user.click(await screen.findByRole('button', { name: /编辑配置/ }));
    expect(await screen.findByLabelText('扫描服务')).toBeInTheDocument();
    await user.click(screen.getByRole('combobox', { name: '扫描服务' }));
    await user.click(screen.getByText('ClamAV', { selector: '.ant-select-item-option-content' }));
    expect(screen.getByLabelText('ClamAV 主机')).toBeVisible();
    expect(screen.getByLabelText('阿里云地域')).not.toBeVisible();
    await user.click(screen.getByRole('combobox', { name: '扫描服务' }));
    await user.click(
      screen.getByText('阿里云安全中心', { selector: '.ant-select-item-option-content' })
    );
    expect(screen.getByLabelText('阿里云地域')).toBeVisible();
    expect(screen.getByLabelText('ClamAV 主机')).not.toBeVisible();
    expect(screen.getByRole('button', { name: /保存配置/ })).toBeInTheDocument();
  }, 15_000);
});

it('shows Aliyun SMS only to super administrators', async () => {
  const { unmount } = render(<IntegrationsManagement />);
  expect(await screen.findByText('邮件服务配置')).toBeInTheDocument();
  expect(screen.queryByText('阿里云短信')).not.toBeInTheDocument();
  unmount();

  mocks.roles = ['SUPER_ADMIN'];
  render(<IntegrationsManagement />);
  const user = userEvent.setup();
  await user.click(await screen.findByText('阿里云短信'));
  await waitFor(() => expect(mocks.getConfig).toHaveBeenCalledWith('aliyun-sms'));
  expect(await screen.findByText('访问凭据与签名')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /编辑配置/ }));
  expect(await screen.findByLabelText('AccessKey ID')).toHaveValue('********');
  await user.click(screen.getByRole('button', { name: /发送测试短信/ }));
  expect(await screen.findByText(/真实发送短信并可能产生费用/)).toBeInTheDocument();
});
