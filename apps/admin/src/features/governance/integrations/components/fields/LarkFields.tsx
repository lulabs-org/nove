import Col from 'antd/es/col';
import Divider from 'antd/es/divider';
import Form from 'antd/es/form';
import Input from 'antd/es/input';
import Row from 'antd/es/row';
import type { LarkConfig } from '../../types';
import { SecretInput } from '../SecretInput';

export function LarkFields({ form }: { form: ReturnType<typeof Form.useForm<LarkConfig>>[0] }) {
  return (
    <Form className="integrations-form" form={form} layout="vertical">
      <Divider titlePlacement="start">应用配置</Divider>
      <Form.Item label="App ID" name="appId" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item label="App Secret" name="appSecret" rules={[{ required: true }]}>
        <SecretInput placeholder="输入新 App Secret 以替换" />
      </Form.Item>
      <Divider titlePlacement="start">事件订阅</Divider>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item label="事件 Encrypt Key" name="eventEncryptKey">
            <SecretInput placeholder="输入新 Encrypt Key 以替换" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item label="事件 Verification Token" name="eventVerificationToken">
            <SecretInput placeholder="输入新 Verification Token 以替换" />
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
}
