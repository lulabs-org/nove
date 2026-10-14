/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2026-01-23 13:27:26
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2026-01-23 16:52:58
 * @FilePath: /nove-admin/src/features/platform-governance/api-keys/components/EditApiKeyModal.tsx
 * @Description:
 *
 * Copyright (c) 2026 by LuLab-Team, All Rights Reserved.
 */
import Modal from 'antd/es/modal';
import Form from 'antd/es/form';
import Input from 'antd/es/input';
import DatePicker from 'antd/es/date-picker';
import dayjs from 'dayjs';
import { useAuth } from '../../../../shared/hooks/useAuth';
import type { ApiKey, UpdateApiKey } from '../types';
import { ScopeSelector } from './ScopeSelector';

interface EditApiKeyModalProps {
  open: boolean;
  apiKey: ApiKey;
  onCancel: () => void;
  onSubmit: (data: UpdateApiKey) => void;
  loading: boolean;
}

export function EditApiKeyModal({
  open,
  apiKey,
  onCancel,
  onSubmit,
  loading,
}: EditApiKeyModalProps) {
  const [form] = Form.useForm();
  const { user } = useAuth();

  const userPermissions = user?.permissions || [];

  const formatExpiresAt = (expiresAt: unknown): dayjs.Dayjs | undefined => {
    if (!expiresAt) return undefined;
    if (typeof expiresAt === 'string') return dayjs(expiresAt);
    if (expiresAt instanceof Date) return dayjs(expiresAt);
    if (dayjs.isDayjs(expiresAt)) return expiresAt;
    return undefined;
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const data: UpdateApiKey = {
        name: values.name,
        scopes: values.scopes,
      };
      if (values.expiresAt && values.expiresAt.$d) {
        data.expiresAt = values.expiresAt.$d.toISOString();
      } else {
        data.expiresAt = undefined;
      }
      onSubmit(data);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title="编辑 API Key"
      open={open}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      width={720}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          name: apiKey.name,
          scopes: apiKey.scopes,
          expiresAt: formatExpiresAt(apiKey.expiresAt),
        }}
      >
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
    </Modal>
  );
}
