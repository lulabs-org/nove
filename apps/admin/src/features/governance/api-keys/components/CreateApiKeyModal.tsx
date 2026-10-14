import Modal from 'antd/es/modal';
import Form from 'antd/es/form';
import Input from 'antd/es/input';
import DatePicker from 'antd/es/date-picker';
import Button from 'antd/es/button';
import message from 'antd/es/message';
import Alert from 'antd/es/alert';
import Descriptions from 'antd/es/descriptions';
import Tag from 'antd/es/tag';
import { CheckCircleFilled, CheckOutlined, CopyOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { useAuth } from '../../../../shared/hooks/useAuth';
import type { CreateApiKeyResult } from '../types';
import { ScopeSelector } from './ScopeSelector';

interface CreateApiKeyModalProps {
  open: boolean;
  onCancel: () => void;
  onSubmit: (data: { name: string; scopes?: string[]; expiresAt?: string }) => void;
  loading: boolean;
  result?: CreateApiKeyResult;
  onComplete?: () => void;
}

export function CreateApiKeyModal({
  open,
  onCancel,
  onSubmit,
  loading,
  result,
  onComplete,
}: CreateApiKeyModalProps) {
  const [form] = Form.useForm();
  const [copied, setCopied] = useState(false);
  const { user } = useAuth();

  const userPermissions = user?.permissions || [];

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const data: { name: string; scopes?: string[]; expiresAt?: string } = {
        name: values.name,
        scopes: values.scopes,
      };
      if (values.expiresAt && values.expiresAt.$d) {
        data.expiresAt = values.expiresAt.$d.toISOString();
      }
      onSubmit(data);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setCopied(false);
    onCancel();
  };

  const handleComplete = () => {
    setCopied(false);
    onComplete?.();
  };

  const handleClose = () => {
    if (result) handleComplete();
    else handleCancel();
  };

  const handleCopyKey = async () => {
    if (result?.key) {
      try {
        await navigator.clipboard.writeText(result.key);
        setCopied(true);
        message.success('API Key 已复制到剪贴板');
      } catch {
        message.error('复制失败，请手动复制 API Key');
      }
    }
  };

  return (
    <Modal
      title="创建 API Key"
      open={open}
      onOk={result ? handleComplete : handleSubmit}
      onCancel={handleClose}
      okText={result ? '我已保存，完成' : '创建'}
      cancelButtonProps={result ? { style: { display: 'none' } } : undefined}
      confirmLoading={result ? false : loading}
      width={720}
    >
      {result ? (
        <div style={{ padding: '8px 0 4px' }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <CheckCircleFilled style={{ color: '#52c41a', fontSize: 48 }} />
            <div style={{ marginTop: 10, fontSize: 20, fontWeight: 600 }}>API Key 创建成功</div>
            <div style={{ marginTop: 4, color: '#666' }}>现在可以使用此密钥访问已授权的服务</div>
          </div>

          <div
            style={{
              padding: 16,
              backgroundColor: '#f0f7ff',
              border: '1px solid #91caff',
              borderRadius: 8,
            }}
          >
            <div style={{ marginBottom: 8, color: '#666', fontSize: 12, fontWeight: 500 }}>
              API Key
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <code
                style={{
                  flex: 1,
                  fontSize: 14,
                  lineHeight: 1.6,
                  wordBreak: 'break-all',
                }}
              >
                {result.key}
              </code>
              <Button
                type="primary"
                icon={copied ? <CheckOutlined /> : <CopyOutlined />}
                onClick={handleCopyKey}
              >
                {copied ? '已复制' : '复制密钥'}
              </Button>
            </div>
          </div>

          <Alert
            showIcon
            type="warning"
            title="请立即复制并妥善保存"
            description="关闭此窗口后，完整 API Key 将无法再次查看。请勿通过聊天、邮件或截图分享密钥。"
            style={{ marginTop: 16 }}
          />

          <Descriptions
            size="small"
            column={2}
            style={{ marginTop: 20 }}
            items={[
              { key: 'name', label: '名称', children: result.name },
              {
                key: 'status',
                label: '状态',
                children: <Tag color="success">有效</Tag>,
              },
              {
                key: 'prefix',
                label: '识别前缀',
                children: <code>{result.prefix}</code>,
              },
              {
                key: 'scopes',
                label: '权限范围',
                children: `${result.scopes.length} 项`,
              },
            ]}
          />
        </div>
      ) : (
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item
            label="名称"
            name="name"
            rules={[{ required: true, message: '请输入 API Key 名称' }]}
          >
            <Input placeholder="例如：生产环境 API Key" />
          </Form.Item>

          <Form.Item label="权限范围" name="scopes" tooltip="指定 API Key 可以访问的资源范围">
            <ScopeSelector options={userPermissions} />
          </Form.Item>

          <Form.Item label="过期时间" name="expiresAt" tooltip="留空表示永不过期">
            <DatePicker
              showTime
              style={{ width: '100%' }}
              placeholder="选择过期时间"
              disabledDate={(date) => date && date.valueOf() < Date.now()}
            />
          </Form.Item>
        </Form>
      )}
    </Modal>
  );
}
