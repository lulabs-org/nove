import { DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import Button from 'antd/es/button';
import Col from 'antd/es/col';
import ColorPicker from 'antd/es/color-picker';
import type { Color } from 'antd/es/color-picker';
import Divider from 'antd/es/divider';
import Form from 'antd/es/form';
import Image from 'antd/es/image';
import Input from 'antd/es/input';
import InputNumber from 'antd/es/input-number';
import message from 'antd/es/message';
import Popconfirm from 'antd/es/popconfirm';
import Row from 'antd/es/row';
import Space from 'antd/es/space';
import Switch from 'antd/es/switch';
import Typography from 'antd/es/typography';
import Upload from 'antd/es/upload';
import type { UploadProps } from 'antd/es/upload';
import { useState } from 'react';
import type { MailConfig } from '../../types';
import { integrationsApi } from '../../api/integrationsApi';
import { SecretInput } from '../SecretInput';

const { Text } = Typography;

export function MailFields({
  form,
  onBrandLogoChanged,
}: {
  form: ReturnType<typeof Form.useForm<MailConfig>>[0];
  onBrandLogoChanged?: () => Promise<void>;
}) {
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [removingLogo, setRemovingLogo] = useState(false);
  const logoUrl = Form.useWatch('brandLogoUrl', form);

  const validateLogo = (file: File) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      message.error('Logo 仅支持 JPEG、PNG 或 WebP 格式');
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      message.error('Logo 文件不能超过 5 MB');
      return false;
    }
    return true;
  };

  const uploadLogo: UploadProps['customRequest'] = async ({
    file,
    onError,
    onProgress,
    onSuccess,
  }) => {
    setUploadingLogo(true);
    try {
      onProgress?.({ percent: 10 });
      const result = await integrationsApi.uploadMailBrandLogo(file as Blob);
      form.setFieldValue('brandLogoUrl', result.url);
      await onBrandLogoChanged?.();
      onProgress?.({ percent: 100 });
      onSuccess?.(result);
      message.success('邮件品牌 Logo 已更新');
    } catch (error) {
      const uploadError = error instanceof Error ? error : new Error('Logo 上传失败');
      onError?.(uploadError);
      message.error('Logo 上传失败');
    } finally {
      setUploadingLogo(false);
    }
  };

  const removeLogo = async () => {
    setRemovingLogo(true);
    try {
      await integrationsApi.removeMailBrandLogo();
      form.setFieldValue('brandLogoUrl', undefined);
      await onBrandLogoChanged?.();
      message.success('邮件品牌 Logo 已移除');
    } catch {
      message.error('Logo 移除失败');
    } finally {
      setRemovingLogo(false);
    }
  };

  return (
    <Form className="integrations-form" form={form} layout="vertical">
      <Divider titlePlacement="start">SMTP 设置</Divider>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item label="SMTP 主机" name="host" rules={[{ required: true }]}>
            <Input placeholder="smtp.example.com" />
          </Form.Item>
        </Col>
        <Col xs={24} md={6}>
          <Form.Item label="端口" name="port" rules={[{ required: true }]}>
            <InputNumber min={1} max={65535} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item label="用户名" name="user" rules={[{ required: true }]}>
            <Input autoComplete="username" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item label="发件人地址" name="from" rules={[{ required: true, type: 'email' }]}>
            <Input placeholder="noreply@example.com" />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item label="密码" name="pass" rules={[{ required: true }]}>
        <SecretInput placeholder="输入新密码以替换" />
      </Form.Item>
      <div className="integrations-switch-row">
        <div>
          <div className="integrations-switch-title">SSL/TLS 加密</div>
          <div className="integrations-switch-description">根据邮件服务商端口要求启用</div>
        </div>
        <Form.Item name="secure" valuePropName="checked" noStyle>
          <Switch checkedChildren="启用" unCheckedChildren="关闭" />
        </Form.Item>
      </div>
      <Divider titlePlacement="start">邮件品牌</Divider>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item label="品牌名称" name="brandName">
            <Input placeholder="Nove System" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            label="主题色"
            name="brandPrimaryColor"
            getValueFromEvent={(color: Color) => color.toHexString()}
            rules={[{ pattern: /^#[0-9a-fA-F]{6}$/ }]}
          >
            <ColorPicker
              disabledAlpha
              format="hex"
              showText={(color) => color.toHexString()}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item name="brandLogoUrl" hidden>
        <Input />
      </Form.Item>
      <Form.Item label="邮件 Logo">
        <div className="integrations-logo-editor">
          <div className="integrations-logo-preview">
            {logoUrl ? (
              <Image src={logoUrl} alt="邮件品牌 Logo" preview={false} />
            ) : (
              <span>未上传</span>
            )}
          </div>
          <div className="integrations-logo-editor-main">
            <Space size="small" wrap>
              <Upload
                accept="image/jpeg,image/png,image/webp"
                showUploadList={false}
                beforeUpload={(file) => validateLogo(file)}
                customRequest={uploadLogo}
                disabled={uploadingLogo || removingLogo}
              >
                <Button icon={<UploadOutlined />} loading={uploadingLogo}>
                  {logoUrl ? '替换 Logo' : '上传 Logo'}
                </Button>
              </Upload>
              {logoUrl ? (
                <Popconfirm
                  title="移除邮件品牌 Logo？"
                  description="移除后，邮件顶部将显示品牌名称。"
                  okText="移除"
                  cancelText="取消"
                  onConfirm={() => void removeLogo()}
                >
                  <Button danger icon={<DeleteOutlined />} loading={removingLogo}>
                    移除 Logo
                  </Button>
                </Popconfirm>
              ) : null}
            </Space>
            <Text type="secondary">
              支持 JPEG、PNG、WebP，最大 5 MB；上传后立即应用到邮件品牌。
            </Text>
          </div>
        </div>
      </Form.Item>
      <Form.Item label="页脚文字" name="brandFooterText">
        <Input.TextArea rows={3} />
      </Form.Item>
    </Form>
  );
}
