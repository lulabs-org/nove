import {
  ApiOutlined,
  CloudOutlined,
  CloudServerOutlined,
  ClusterOutlined,
  MailOutlined,
  MessageOutlined,
  RobotOutlined,
  SecurityScanOutlined,
  ShopOutlined,
  CreditCardOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import type { ReactNode } from 'react';
import type { IntegrationSummary, IntegrationModule } from './types';

export const MODULE_META: Record<
  IntegrationModule,
  { label: string; title: string; description: string; icon: ReactNode }
> = {
  mail: {
    label: '邮件服务',
    title: '邮件服务配置',
    description: '用于系统通知、验证码、账号找回和邮件品牌展示',
    icon: <MailOutlined />,
  },
  'aliyun-sms': {
    label: '阿里云短信',
    title: '阿里云短信配置',
    description: '用于注册、登录、密码重置和安全通知短信',
    icon: <MessageOutlined />,
  },
  ai: {
    label: 'AI 模型',
    title: 'AI 模型服务配置',
    description: '用于妙记总结、参会者总结和其他智能生成任务',
    icon: <RobotOutlined />,
  },
  'tencent-meeting': {
    label: '腾讯会议',
    title: '腾讯会议配置',
    description: '用于会议记录同步、智能纪要和 Webhook 验证',
    icon: <VideoCameraOutlined />,
  },
  lark: {
    label: '飞书',
    title: '飞书开放平台配置',
    description: '用于飞书会议事件接收与开放平台集成',
    icon: <ApiOutlined />,
  },
  'wechat-shop': {
    label: '微信小店',
    title: '微信小店配置',
    description: '用于微信小店回调验证和订单同步',
    icon: <ShopOutlined />,
  },
  wecom: {
    label: '企业微信',
    title: '企业微信配置',
    description: '用于企业微信通讯录同步、外部联系人回调验证及 API 对接',
    icon: <ClusterOutlined />,
  },
  storage: {
    label: '对象存储',
    title: '对象存储配置',
    description: '配置阿里云 OSS 或兼容存储，用于云盘、头像及附件存储',
    icon: <CloudServerOutlined />,
  },
  drive: {
    label: '云盘策略',
    title: '云盘策略配置',
    description: '控制文件白名单、容量限制和下载回收站策略',
    icon: <CloudOutlined />,
  },
  'file-scanning': {
    label: '病毒扫描',
    title: '病毒扫描服务配置',
    description: '选择扫描引擎并配置 ClamAV 或阿里云安全中心参数',
    icon: <SecurityScanOutlined />,
  },
  stripe: {
    label: 'Stripe 支付',
    title: 'Stripe 支付配置',
    description: '配置国际支付与退款网关 Stripe API 凭据、Webhook 签名秘钥与默认货币',
    icon: <CreditCardOutlined />,
  },
};

export function buildIntegrationMenu(
  summaryMap: Map<IntegrationModule, IntegrationSummary>,
  showAliyunSms = false
) {
  return [
    {
      type: 'group' as const,
      label: '通知服务',
      children: [
        menuItem('mail', summaryMap.get('mail')),
        ...(showAliyunSms ? [menuItem('aliyun-sms', summaryMap.get('aliyun-sms'))] : []),
      ],
    },
    {
      type: 'group' as const,
      label: 'AI 能力',
      children: [menuItem('ai', summaryMap.get('ai'))],
    },
    {
      type: 'group' as const,
      label: '会议集成',
      children: [menuItem('tencent-meeting', summaryMap.get('tencent-meeting'))],
    },
    {
      type: 'group' as const,
      label: '通讯与协同',
      children: [
        menuItem('wecom', summaryMap.get('wecom')),
        menuItem('lark', summaryMap.get('lark')),
      ],
    },
    {
      type: 'group' as const,
      label: '交易集成',
      children: [
        menuItem('wechat-shop', summaryMap.get('wechat-shop')),
        menuItem('stripe', summaryMap.get('stripe')),
      ],
    },
    {
      type: 'group' as const,
      label: '存储服务',
      children: [
        menuItem('storage', summaryMap.get('storage')),
        menuItem('drive', summaryMap.get('drive')),
      ],
    },
    {
      type: 'group' as const,
      label: '安全服务',
      children: [menuItem('file-scanning', summaryMap.get('file-scanning'))],
    },
  ];
}
function menuItem(module: IntegrationModule, summary?: IntegrationSummary) {
  return {
    key: module,
    icon: MODULE_META[module].icon,
    label: (
      <span className="integrations-menu-label">
        <span>{MODULE_META[module].label}</span>
        <span className={summary?.configured ? 'is-configured' : ''} />
      </span>
    ),
  };
}
