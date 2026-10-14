import Form from 'antd/es/form';
import Input from 'antd/es/input';
import type { WechatShopConfig } from '../../types';
import { SecretInput } from '../SecretInput';

export function WechatShopFields({
  form,
}: {
  form: ReturnType<typeof Form.useForm<WechatShopConfig>>[0];
}) {
  return (
    <Form className="integrations-form" form={form} layout="vertical">
      <Form.Item label="App ID" name="appId" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item label="App Secret" name="appSecret" rules={[{ required: true }]}>
        <SecretInput placeholder="输入新 App Secret 以替换" />
      </Form.Item>
      <Form.Item label="Webhook Token" name="webhookToken">
        <SecretInput placeholder="输入新 Webhook Token 以替换" />
      </Form.Item>
      <Form.Item label="Encoding AES Key" name="encodingAesKey">
        <SecretInput placeholder="输入新 Encoding AES Key 以替换" />
      </Form.Item>
      <Form.Item label="API Base URL" name="apiBaseUrl" rules={[{ required: true, type: 'url' }]}>
        <Input />
      </Form.Item>
    </Form>
  );
}
