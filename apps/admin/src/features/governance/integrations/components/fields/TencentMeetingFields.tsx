import Col from 'antd/es/col';
import Divider from 'antd/es/divider';
import Form from 'antd/es/form';
import Input from 'antd/es/input';
import Row from 'antd/es/row';
import type { TencentMeetingConfig } from '../../types';
import { SecretInput } from '../SecretInput';

export function TencentMeetingFields({
  form,
}: {
  form: ReturnType<typeof Form.useForm<TencentMeetingConfig>>[0];
}) {
  return (
    <Form className="integrations-form" form={form} layout="vertical">
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item label="App ID" name="appId" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item label="SDK ID" name="sdkId" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item label="Secret ID" name="secretId" rules={[{ required: true }]}>
            <SecretInput placeholder="输入新 Secret ID 以替换" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item label="默认用户 ID" name="userId" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item label="Secret Key" name="secretKey" rules={[{ required: true }]}>
        <SecretInput placeholder="输入新 Secret Key 以替换" />
      </Form.Item>
      <Divider titlePlacement="start">Webhook</Divider>
      <Form.Item label="Webhook Token" name="webhookToken">
        <SecretInput placeholder="输入新 Token 以替换" />
      </Form.Item>
      <Form.Item label="Encoding AES Key" name="encodingAesKey">
        <SecretInput placeholder="输入新 AES Key 以替换" />
      </Form.Item>
    </Form>
  );
}
