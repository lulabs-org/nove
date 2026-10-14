import Tag from 'antd/es/tag';
import type { ReactNode } from 'react';
import type { IntegrationConfigMap, IntegrationModule } from '../types';

type ReadonlyFieldKind = 'boolean' | 'color' | 'image' | 'provider' | 'secret' | 'text';

interface ReadonlyField {
  key: string;
  label: string;
  kind?: ReadonlyFieldKind;
  fullWidth?: boolean;
  scanProvider?: string;
}

interface ReadonlySection {
  title: string;
  fields: ReadonlyField[];
}

const PROVIDER_LABELS: Record<string, string> = {
  ark: '火山方舟',
  openai: 'OpenAI',
  custom: '自定义兼容服务',
  ALIYUN_SAS: '阿里云安全中心',
  CLAMAV: 'ClamAV',
  OSS: '阿里云 OSS',
  COS: '腾讯云 COS',
  S3: 'AWS S3',
  LOCAL: '本地存储',
};

const READONLY_SECTIONS: Record<IntegrationModule, ReadonlySection[]> = {
  mail: [
    {
      title: 'SMTP 设置',
      fields: [
        { key: 'host', label: 'SMTP 主机' },
        { key: 'port', label: '端口' },
        { key: 'user', label: '用户名' },
        { key: 'from', label: '发件人地址' },
        { key: 'pass', label: '密码', kind: 'secret', fullWidth: true },
        { key: 'secure', label: 'SSL/TLS 加密', kind: 'boolean', fullWidth: true },
      ],
    },
    {
      title: '邮件品牌',
      fields: [
        { key: 'brandName', label: '品牌名称' },
        { key: 'brandPrimaryColor', label: '主题色', kind: 'color' },
        { key: 'brandLogoUrl', label: '邮件 Logo', kind: 'image', fullWidth: true },
        { key: 'brandFooterText', label: '页脚文字', fullWidth: true },
      ],
    },
  ],
  'aliyun-sms': [
    {
      title: '访问凭据与签名',
      fields: [
        { key: 'accessKeyId', label: 'AccessKey ID', kind: 'secret' },
        { key: 'accessKeySecret', label: 'AccessKey Secret', kind: 'secret' },
        { key: 'signName', label: '短信签名', fullWidth: true },
      ],
    },
    {
      title: '模板代码',
      fields: [
        { key: 'verificationTemplateCode', label: '验证码模板' },
        { key: 'securityChangeTemplateCode', label: '安全通知模板' },
      ],
    },
  ],
  ai: [
    {
      title: '模型服务',
      fields: [
        { key: 'provider', label: '服务商', kind: 'provider' },
        { key: 'model', label: '模型' },
        { key: 'baseUrl', label: 'API Base URL', fullWidth: true },
        { key: 'apiKey', label: 'API Key', kind: 'secret', fullWidth: true },
      ],
    },
    {
      title: '生成参数',
      fields: [
        { key: 'maxTokens', label: '最大 Tokens' },
        { key: 'temperature', label: 'Temperature' },
      ],
    },
  ],
  'tencent-meeting': [
    {
      title: 'API 凭证',
      fields: [
        { key: 'appId', label: 'App ID' },
        { key: 'sdkId', label: 'SDK ID' },
        { key: 'secretId', label: 'Secret ID', kind: 'secret' },
        { key: 'userId', label: '默认用户 ID' },
        { key: 'secretKey', label: 'Secret Key', kind: 'secret', fullWidth: true },
      ],
    },
    {
      title: 'Webhook',
      fields: [
        { key: 'webhookToken', label: 'Webhook Token', kind: 'secret', fullWidth: true },
        {
          key: 'encodingAesKey',
          label: 'Encoding AES Key',
          kind: 'secret',
          fullWidth: true,
        },
      ],
    },
  ],
  lark: [
    {
      title: '应用配置',
      fields: [
        { key: 'appId', label: 'App ID', fullWidth: true },
        { key: 'appSecret', label: 'App Secret', kind: 'secret', fullWidth: true },
      ],
    },
    {
      title: '事件订阅',
      fields: [
        { key: 'eventEncryptKey', label: '事件 Encrypt Key', kind: 'secret' },
        {
          key: 'eventVerificationToken',
          label: '事件 Verification Token',
          kind: 'secret',
        },
      ],
    },
  ],
  'wechat-shop': [
    {
      title: '应用凭证',
      fields: [
        { key: 'appId', label: 'App ID' },
        { key: 'appSecret', label: 'App Secret', kind: 'secret' },
      ],
    },
    {
      title: 'Webhook',
      fields: [
        { key: 'webhookToken', label: 'Webhook Token', kind: 'secret' },
        {
          key: 'encodingAesKey',
          label: 'Encoding AES Key',
          kind: 'secret',
        },
      ],
    },
    {
      title: 'API 地址',
      fields: [{ key: 'apiBaseUrl', label: 'API Base URL', fullWidth: true }],
    },
  ],
  wecom: [
    {
      title: '企业凭证',
      fields: [
        { key: 'corpId', label: '企业 ID (Corp ID)', fullWidth: true },
        { key: 'corpSecret', label: '应用 Secret (Corp Secret)', kind: 'secret', fullWidth: true },
      ],
    },
    {
      title: 'Webhook',
      fields: [
        { key: 'webhookToken', label: 'Webhook Token', kind: 'secret', fullWidth: true },
        {
          key: 'encodingAesKey',
          label: 'Encoding AES Key',
          kind: 'secret',
          fullWidth: true,
        },
      ],
    },
    {
      title: 'API 地址',
      fields: [{ key: 'apiBaseUrl', label: 'API Base URL', fullWidth: true }],
    },
  ],
  drive: [
    {
      title: '文件策略',
      fields: [
        { key: 'allowedExtensions', label: '允许扩展名', fullWidth: true },
        { key: 'imageMaxMiB', label: '图片上限 MiB' },
        { key: 'documentMaxMiB', label: '文档上限 MiB' },
        { key: 'audioMaxMiB', label: '音频上限 MiB' },
        { key: 'videoMaxMiB', label: '视频上限 MiB' },
      ],
    },
    {
      title: '下载与回收站',
      fields: [
        { key: 'downloadUrlExpiresSeconds', label: '下载 URL 有效期（秒）' },
        { key: 'recycleRetentionDays', label: '回收站保留天数' },
      ],
    },
  ],
  'file-scanning': [
    {
      title: '病毒扫描',
      fields: [
        { key: 'malwareScanProvider', label: '扫描服务', kind: 'provider' },
        { key: 'aliyunSasRegionId', label: '阿里云 SAS 地域', scanProvider: 'ALIYUN_SAS' },
        { key: 'scanTimeoutMs', label: '扫描超时（毫秒）', scanProvider: 'ALIYUN_SAS' },
        { key: 'scanPollIntervalMs', label: '轮询间隔（毫秒）', scanProvider: 'ALIYUN_SAS' },
        { key: 'clamAvHost', label: 'ClamAV 主机', scanProvider: 'CLAMAV' },
        { key: 'clamAvPort', label: 'ClamAV 端口', scanProvider: 'CLAMAV' },
        { key: 'clamAvTimeoutMs', label: '扫描超时（毫秒）', scanProvider: 'CLAMAV' },
      ],
    },
  ],
  storage: [
    {
      title: '存储配置',
      fields: [
        { key: 'provider', label: '存储服务商', kind: 'provider' },
        { key: 'region', label: '地域 (Region)' },
        { key: 'bucket', label: '私有存储桶' },
        { key: 'publicBucket', label: '公共存储桶' },
        { key: 'publicBaseUrl', label: '公开访问地址', fullWidth: true },
        { key: 'signedUrlExpiresSeconds', label: '签名有效时长（秒）' },
      ],
    },
    {
      title: '访问凭据',
      fields: [
        { key: 'accessKeyId', label: 'AccessKey ID', fullWidth: true },
        { key: 'accessKeySecret', label: 'AccessKey Secret', kind: 'secret', fullWidth: true },
      ],
    },
  ],
  stripe: [
    {
      title: 'API 凭证',
      fields: [
        { key: 'secretKey', label: 'Secret Key', kind: 'secret' },
        { key: 'publishableKey', label: 'Publishable Key' },
      ],
    },
    {
      title: 'Webhook 签名',
      fields: [{ key: 'webhookSecret', label: 'Webhook Secret', kind: 'secret', fullWidth: true }],
    },
    {
      title: '交易默认设置',
      fields: [{ key: 'currency', label: '默认币种', fullWidth: true }],
    },
  ],
};

function hasValue(value: unknown): boolean {
  return value !== undefined && value !== null && value !== '';
}

function renderValue(field: ReadonlyField, value: unknown): ReactNode {
  if (field.key === 'malwareScanProvider' && !hasValue(value)) return '跟随服务端配置';
  if (field.key === 'publicBucket' && !hasValue(value)) return '复用私有存储桶';
  if (!hasValue(value)) return <span className="integrations-readonly-empty">未配置</span>;

  if (field.kind === 'secret') return <Tag color="success">已配置（不可查看）</Tag>;
  if (field.kind === 'boolean') {
    return (
      <Tag color={value === true ? 'success' : 'default'}>
        {value === true ? '已启用' : '已关闭'}
      </Tag>
    );
  }
  if (field.kind === 'provider') return PROVIDER_LABELS[String(value)] ?? String(value);
  if (field.kind === 'color') {
    const color = String(value);
    return (
      <span className="integrations-readonly-color">
        <span className="integrations-readonly-swatch" style={{ backgroundColor: color }} />
        <span>{color}</span>
      </span>
    );
  }
  if (field.kind === 'image') {
    return <img className="integrations-readonly-logo" src={String(value)} alt={field.label} />;
  }

  return String(value);
}

export function ReadonlyConfigView({
  module,
  value,
}: {
  module: IntegrationModule;
  value?: IntegrationConfigMap[IntegrationModule];
}) {
  const config = (value ?? {}) as Record<string, unknown>;

  return (
    <div className="integrations-readonly" aria-label="只读配置详情">
      {READONLY_SECTIONS[module].map((section) => (
        <section className="integrations-readonly-section" key={section.title}>
          <h3>{section.title}</h3>
          <dl className="integrations-readonly-grid">
            {section.fields
              .filter(
                (field) => !field.scanProvider || field.scanProvider === config.malwareScanProvider
              )
              .map((field) => (
                <div
                  className={
                    field.fullWidth
                      ? 'integrations-readonly-item is-full-width'
                      : 'integrations-readonly-item'
                  }
                  key={field.key}
                >
                  <dt>{field.label}</dt>
                  <dd>{renderValue(field, config[field.key])}</dd>
                </div>
              ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
