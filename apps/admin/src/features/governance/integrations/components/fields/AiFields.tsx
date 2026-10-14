import Col from 'antd/es/col';
import Form from 'antd/es/form';
import Input from 'antd/es/input';
import InputNumber from 'antd/es/input-number';
import Row from 'antd/es/row';
import Select from 'antd/es/select';
import type { AiConfig } from '../../types';
import { SecretInput } from '../SecretInput';

export function AiFields({ form }: { form: ReturnType<typeof Form.useForm<AiConfig>>[0] }) {
  return (
    <Form className="integrations-form" form={form} layout="vertical">
      <Row gutter={16}>
        <Col xs={24} md={8}>
          <Form.Item label="服务商" name="provider" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'ark', label: '火山方舟' },
                { value: 'openai', label: 'OpenAI' },
                { value: 'custom', label: '自定义兼容服务' },
              ]}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={16}>
          <Form.Item label="模型" name="model" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item label="API Base URL" name="baseUrl" rules={[{ required: true, type: 'url' }]}>
        <Input />
      </Form.Item>
      <Form.Item label="API Key" name="apiKey" rules={[{ required: true }]}>
        <SecretInput placeholder="输入新 API Key 以替换" />
      </Form.Item>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item label="最大 Tokens" name="maxTokens" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item label="Temperature" name="temperature" rules={[{ required: true }]}>
            <InputNumber min={0} max={2} step={0.1} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
}
