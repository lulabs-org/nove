import { useEffect } from 'react';
import Form from 'antd/es/form';
import Input from 'antd/es/input';
import InputNumber from 'antd/es/input-number';
import message from 'antd/es/message';
import Modal from 'antd/es/modal';
import Select from 'antd/es/select';
import Space from 'antd/es/space';
import Switch from 'antd/es/switch';
import { useMutation } from '@tanstack/react-query';
import {
  permissionManagementApi,
  type CreatePermission,
  type PermissionItem,
  type UpdatePermission,
} from '../../api/permissionManagementApi';
import {
  PERMISSION_TYPE_OPTIONS,
  type PermissionFormValues,
  type PermissionModalMode,
} from '../../types';
import { displayNullableText, displayString } from '../../utils';

const { TextArea } = Input;

interface PermissionFormModalProps {
  open: boolean;
  mode: PermissionModalMode;
  editingPermission: PermissionItem | null;
  parentOptions: Array<{ label: string; value: string }>;
  defaultResource?: string;
  initialParentId?: string;
  onCancel: () => void;
  onSuccess: () => void;
}

export function PermissionFormModal({
  open,
  mode,
  editingPermission,
  parentOptions,
  defaultResource,
  initialParentId,
  onCancel,
  onSuccess,
}: PermissionFormModalProps) {
  const [form] = Form.useForm<PermissionFormValues>();

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && editingPermission) {
        form.setFieldsValue({
          name: editingPermission.name,
          code: editingPermission.code,
          description: displayNullableText(editingPermission.description),
          resource: editingPermission.resource,
          action: editingPermission.action,
          type: editingPermission.type,
          parentId: displayString(editingPermission.parentId) || undefined,
          level: editingPermission.level,
          sortOrder: editingPermission.sortOrder,
          active: editingPermission.active,
          oauthDelegatable: editingPermission.oauthDelegatable,
        });
      } else {
        form.setFieldsValue({
          name: '',
          code: '',
          description: '',
          resource: defaultResource || '',
          action: '',
          type: 'API',
          parentId: initialParentId,
          level: initialParentId ? 2 : 1,
          sortOrder: 0,
          active: true,
          oauthDelegatable: false,
        });
      }
    }
  }, [open, mode, editingPermission, defaultResource, initialParentId, form]);

  const saveMutation = useMutation({
    mutationFn: (values: PermissionFormValues) => {
      const basePayload = {
        name: values.name?.trim() || '',
        description: values.description?.trim() || undefined,
        resource: values.resource?.trim() || '',
        action: values.action?.trim() || '',
        type: values.type || 'API',
        parentId: values.parentId || undefined,
        level: values.level ?? 1,
        sortOrder: values.sortOrder ?? 0,
        active: values.active ?? true,
        oauthDelegatable: values.oauthDelegatable ?? false,
      };

      if (mode === 'edit' && editingPermission) {
        const updatePayload: UpdatePermission = basePayload;
        return permissionManagementApi.updatePermission(editingPermission.id, updatePayload);
      }

      const createPayload: CreatePermission = {
        ...basePayload,
        code: values.code?.trim() || '',
      };
      return permissionManagementApi.createPermission(createPayload);
    },
    onSuccess: () => {
      message.success(mode === 'edit' ? '权限已更新' : '权限已创建');
      form.resetFields();
      onSuccess();
    },
    onError: () => {
      message.error(mode === 'edit' ? '更新权限失败' : '创建权限失败');
    },
  });

  const handleOk = () => {
    form.validateFields().then((values) => saveMutation.mutate(values));
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title={mode === 'edit' ? '编辑权限' : '新建权限'}
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={saveMutation.isPending}
      okText="保存"
      cancelText="取消"
      width={680}
      destroyOnHidden
    >
      <Form form={form} layout="vertical">
        <div className="permission-form-section">权限信息</div>
        <Form.Item
          label="权限名称"
          name="name"
          rules={[{ required: true, message: '请输入权限名称' }]}
        >
          <Input placeholder="请输入权限名称" />
        </Form.Item>
        <Form.Item
          label="权限编码"
          name="code"
          rules={[{ required: mode === 'create', message: '请输入权限编码' }]}
        >
          <Input disabled={mode === 'edit'} placeholder="例如 user:read" />
        </Form.Item>
        <Space size="middle" style={{ width: '100%' }} align="start">
          <Form.Item
            label="资源标识"
            name="resource"
            rules={[{ required: true, message: '请输入资源标识' }]}
          >
            <Input placeholder="例如 user" style={{ width: 200 }} />
          </Form.Item>
          <Form.Item
            label="操作类型"
            name="action"
            rules={[{ required: true, message: '请输入操作类型' }]}
          >
            <Input placeholder="例如 read" style={{ width: 200 }} />
          </Form.Item>
          <Form.Item
            label="权限类型"
            name="type"
            rules={[{ required: true, message: '请选择权限类型' }]}
          >
            <Select
              style={{ width: 160 }}
              options={PERMISSION_TYPE_OPTIONS.map(({ label, value }) => ({ label, value }))}
            />
          </Form.Item>
        </Space>
        <Form.Item label="父权限" name="parentId">
          <Select
            allowClear
            showSearch={{ optionFilterProp: 'label' }}
            placeholder="请选择父权限"
            options={parentOptions}
          />
        </Form.Item>
        <Space size="middle" style={{ width: '100%' }} align="start">
          <Form.Item label="权限层级" name="level">
            <InputNumber min={1} max={20} style={{ width: 200 }} />
          </Form.Item>
          <Form.Item label="排序" name="sortOrder">
            <InputNumber min={0} max={9999} style={{ width: 200 }} />
          </Form.Item>
          <Form.Item label="启用状态" name="active" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="停用" />
          </Form.Item>
          <Form.Item
            label="OAuth 委托"
            name="oauthDelegatable"
            valuePropName="checked"
            tooltip="启用后，该权限可被配置为 OAuth 客户端 Scope"
          >
            <Switch checkedChildren="可委托" unCheckedChildren="不可委托" />
          </Form.Item>
        </Space>
        <Form.Item label="权限说明" name="description">
          <TextArea rows={3} placeholder="请输入权限说明" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
