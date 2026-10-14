export type IntegrationModule =
  | 'mail'
  | 'ai'
  | 'tencent-meeting'
  | 'lark'
  | 'wechat-shop'
  | 'wecom'
  | 'storage'
  | 'drive'
  | 'file-scanning'
  | 'stripe'
  | 'aliyun-sms';

export type IntegrationSource = 'database' | 'default';

export interface IntegrationSummary {
  readonly orgId: string;
  module: IntegrationModule;
  configured: boolean;
  source: IntegrationSource;
  updatedAt: string | null;
  environmentImportedAt: string | null;
  environmentImportedFields: string[];
}

export interface IntegrationDetail<T> extends IntegrationSummary {
  value: T;
}

export interface MailConfig {
  host?: string;
  port?: number;
  secure?: boolean;
  user?: string;
  pass?: string;
  from?: string;
  brandName?: string;
  brandLogoUrl?: string;
  brandPrimaryColor?: string;
  brandFooterText?: string;
  brandPublicBaseUrl?: string;
}

export interface AiConfig {
  provider?: 'ark' | 'openai' | 'custom';
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface TencentMeetingConfig {
  appId?: string;
  sdkId?: string;
  secretId?: string;
  secretKey?: string;
  userId?: string;
  webhookToken?: string;
  encodingAesKey?: string;
}

export interface LarkConfig {
  appId?: string;
  appSecret?: string;
  eventEncryptKey?: string;
  eventVerificationToken?: string;
}

export interface WechatShopConfig {
  appId?: string;
  appSecret?: string;
  webhookToken?: string;
  encodingAesKey?: string;
  apiBaseUrl?: string;
}

export interface WecomConfig {
  corpId?: string;
  corpSecret?: string;
  webhookToken?: string;
  encodingAesKey?: string;
  apiBaseUrl?: string;
}

export interface DriveConfig {
  downloadUrlExpiresSeconds?: number;
  recycleRetentionDays?: number;
  allowedExtensions?: string[];
  imageMaxMiB?: number;
  documentMaxMiB?: number;
  audioMaxMiB?: number;
  videoMaxMiB?: number;
}

export interface FileScanningConfig {
  malwareScanProvider?: 'ALIYUN_SAS' | 'CLAMAV';
  aliyunSasRegionId?: string;
  scanTimeoutMs?: number;
  scanPollIntervalMs?: number;
  clamAvHost?: string;
  clamAvPort?: number;
  clamAvTimeoutMs?: number;
}

export interface StorageConfig {
  provider?: 'OSS' | 'COS' | 'S3' | 'LOCAL';
  region?: string;
  bucket?: string;
  publicBucket?: string;
  accessKeyId?: string;
  accessKeySecret?: string;
  publicBaseUrl?: string;
  signedUrlExpiresSeconds?: number;
}

export interface StripeConfig {
  secretKey?: string;
  publishableKey?: string;
  webhookSecret?: string;
  currency?: string;
}

export type IntegrationConfigMap = {
  mail: MailConfig;
  ai: AiConfig;
  'tencent-meeting': TencentMeetingConfig;
  lark: LarkConfig;
  'wechat-shop': WechatShopConfig;
  wecom: WecomConfig;
  storage: StorageConfig;
  drive: DriveConfig;
  'file-scanning': FileScanningConfig;
  stripe: StripeConfig;
  'aliyun-sms': AliyunSmsConfig;
};

export interface SaveIntegrationResult {
  readonly orgId: string;
  success: boolean;
  message: string;
  restartRequired: boolean;
}

export interface TestIntegrationResult {
  readonly orgId: string;
  success: boolean;
  message: string;
}

export interface AliyunSmsConfig {
  accessKeyId?: string;
  accessKeySecret?: string;
  signName?: string;
  verificationTemplateCode?: string;
  securityChangeTemplateCode?: string;
}

export interface TestAliyunSmsInput {
  testCountryCode: string;
  testPhoneNumber: string;
}
