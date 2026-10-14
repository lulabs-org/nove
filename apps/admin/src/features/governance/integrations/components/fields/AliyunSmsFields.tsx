import { SendOutlined } from '@ant-design/icons';
import Alert from 'antd/es/alert';
import Button from 'antd/es/button';
import Col from 'antd/es/col';
import Divider from 'antd/es/divider';
import Form from 'antd/es/form';
import Input from 'antd/es/input';
import Modal from 'antd/es/modal';
import Row from 'antd/es/row';
import message from 'antd/es/message';
import { useState } from 'react';
import { integrationsApi } from '../../api/integrationsApi';
import type { AliyunSmsConfig, TestAliyunSmsInput } from '../../types';
import { SecretInput } from '../SecretInput';

export function AliyunSmsFields({
  form,
}: {
  form: ReturnType<typeof Form.useForm<AliyunSmsConfig>>[0];
}) {
  const [testForm] = Form.useForm<TestAliyunSmsInput>();
  const [testOpen, setTestOpen] = useState(false);
  const [testing, setTesting] = useState(false);

  const sendTest = async () => {
    setTesting(true);
    try {
      const target = await testForm.validateFields();
      const config = await form.validateFields();
      const result = await integrationsApi.test('aliyun-sms', {
        ...config,
        ...target,
      });
      if (result.success) {
        message.success(result.message);
        setTestOpen(false);
        testForm.resetFields();
      } else message.error(result.message);
    } finally {
      setTesting(false);
    }
  };

  return (
    <>
      <Form className="integrations-form" form={form} layout="vertical">
        <Alert
          type="info"
          showIcon
          title="配置保存后立即用于注册、登录、密码重置和安全通知短信。"
        />
        <Divider titlePlacement="start">访问凭据与签名</Divider>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item label="AccessKey ID" name="accessKeyId" rules={[{ required: true }]}>
              <SecretInput placeholder="请输入 AccessKey ID" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="AccessKey Secret" name="accessKeySecret" rules={[{ required: true }]}>
              <SecretInput placeholder="请输入 AccessKey Secret" />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item label="短信签名" name="signName" rules={[{ required: true }]}>
          <Input placeholder="请输入审核通过的短信签名" />
        </Form.Item>
        <Divider titlePlacement="start">模板代码</Divider>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label="验证码模板"
              name="verificationTemplateCode"
              rules={[{ required: true }]}
            >
              <Input placeholder="SMS_xxx" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              label="安全通知模板"
              name="securityChangeTemplateCode"
              rules={[{ required: true }]}
            >
              <Input placeholder="SMS_xxx" />
            </Form.Item>
          </Col>
        </Row>
        <Button icon={<SendOutlined />} onClick={() => setTestOpen(true)}>
          发送测试短信
        </Button>
      </Form>
      <Modal
        title="发送测试短信"
        open={testOpen}
        okText="确认发送"
        cancelText="取消"
        confirmLoading={testing}
        onOk={() => void sendTest()}
        onCancel={() => setTestOpen(false)}
      >
        <p className="integrations-test-warning">
          将真实发送短信并可能产生费用。测试不会创建登录验证码记录。
        </p>
        <Form form={testForm} layout="vertical" initialValues={{ testCountryCode: '+86' }}>
          <Form.Item label="国家代码" name="testCountryCode" rules={[{ required: true }]}>
            <Input placeholder="+86" />
          </Form.Item>
          <Form.Item label="手机号" name="testPhoneNumber" rules={[{ required: true }]}>
            <Input placeholder="13800138000" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
