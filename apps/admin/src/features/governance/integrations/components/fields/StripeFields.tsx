import Divider from 'antd/es/divider';
import Form from 'antd/es/form';
import Input from 'antd/es/input';
import Select from 'antd/es/select';
import type { StripeConfig } from '../../types';
import { SecretInput } from '../SecretInput';

export function StripeFields({ form }: { form: ReturnType<typeof Form.useForm<StripeConfig>>[0] }) {
  return (
    <Form className="integrations-form" form={form} layout="vertical">
      <Divider titlePlacement="start">API 凭据</Divider>
      <Form.Item
        label="Secret Key"
        name="secretKey"
        rules={[{ required: true, message: '请输入 Stripe Secret Key' }]}
        tooltip="Stripe 密钥（以 sk_live_ 或 sk_test_ 开头），敏感信息已加密存储"
      >
        <SecretInput placeholder="输入新 Secret Key 以替换" />
      </Form.Item>
      <Form.Item
        label="Publishable Key"
        name="publishableKey"
        tooltip="Stripe 公钥（以 pk_live_ 或 pk_test_ 开头），可用于前端支付组件直接唤起支付"
      >
        <Input placeholder="例如 pk_live_51..." />
      </Form.Item>

      <Divider titlePlacement="start">Webhook 回调与防伪</Divider>
      <Form.Item
        label="Webhook Secret"
        name="webhookSecret"
        tooltip="用于验证 Stripe Webhook 回调签名的 Endpoint Secret（以 whsec_ 开头）"
      >
        <SecretInput placeholder="输入新 Webhook Secret 以替换" />
      </Form.Item>

      <Divider titlePlacement="start">交易默认配置</Divider>
      <Form.Item
        label="默认交易币种"
        name="currency"
        initialValue="USD"
        tooltip="系统未显式指定币种时的默认结算币种"
      >
        <Select
          options={[
            { label: 'USD (美元)', value: 'USD' },
            { label: 'EUR (欧元)', value: 'EUR' },
            { label: 'CNY (人民币)', value: 'CNY' },
            { label: 'GBP (英镑)', value: 'GBP' },
            { label: 'JPY (日元)', value: 'JPY' },
            { label: 'HKD (港币)', value: 'HKD' },
            { label: 'SGD (新加坡元)', value: 'SGD' },
            { label: 'AUD (澳元)', value: 'AUD' },
            { label: 'CAD (加元)', value: 'CAD' },
          ]}
        />
      </Form.Item>
    </Form>
  );
}
