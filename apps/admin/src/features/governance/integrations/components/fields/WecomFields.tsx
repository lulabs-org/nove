import Divider from 'antd/es/divider';
import Form from 'antd/es/form';
import Input from 'antd/es/input';
import type { WecomConfig } from '../../types';
import { SecretInput } from '../SecretInput';

export function WecomFields({ form }: { form: ReturnType<typeof Form.useForm<WecomConfig>>[0] }) {
  return (
    <Form
      className="integrations-form"
      form={form}
      layout="vertical"
      initialValues={{
        apiBaseUrl: 'https://qyapi.weixin.qq.com',
      }}
    >
      <Divider titlePlacement="start">企业凭证</Divider>
      <Form.Item label="企业 ID (Corp ID)" name="corpId" rules={[{ required: true }]}>
        <Input placeholder="ww..." />
      </Form.Item>
      <Form.Item label="应用 Secret (Corp Secret)" name="corpSecret" rules={[{ required: true }]}>
        <SecretInput placeholder="输入新 Corp Secret 以替换" />
      </Form.Item>
      <Divider titlePlacement="start">Webhook</Divider>
      <Form.Item label="Webhook Token" name="webhookToken">
        <SecretInput placeholder="输入新 Webhook Token 以替换" />
      </Form.Item>
      <Form.Item label="Encoding AES Key" name="encodingAesKey">
        <SecretInput placeholder="输入新 Encoding AES Key 以替换" />
      </Form.Item>
      <Divider titlePlacement="start">API 地址</Divider>
      <Form.Item label="API Base URL" name="apiBaseUrl" rules={[{ required: true, type: 'url' }]}>
        <Input placeholder="https://qyapi.weixin.qq.com" />
      </Form.Item>
    </Form>
  );
}
