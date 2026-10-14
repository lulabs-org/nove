import { useEffect } from 'react';
import AutoComplete from 'antd/es/auto-complete';
import Form from 'antd/es/form';
import Input from 'antd/es/input';
import message from 'antd/es/message';
import Modal from 'antd/es/modal';
import Select from 'antd/es/select';
import Switch from 'antd/es/switch';
import Tag from 'antd/es/tag';
import Typography from 'antd/es/typography';
import { useMutation } from '@tanstack/react-query';
import {
  permissionManagementApi,
  type CreateDataPermissionRule,
  type DataPermissionRule,
  type UpdateDataPermissionRule,
} from '../../api/permissionManagementApi';
import type { DataRuleFormValues, DataRuleModalMode } from '../../types';
import { displayNullableText } from '../../utils';
import { DataRuleBuilder } from '../DataRuleBuilder';
import { SYSTEM_ACTIONS, SYSTEM_RESOURCES, validateConditionJson } from '../dataRuleConstants';

const { Text } = Typography;
const { TextArea } = Input;

interface DataRuleFormModalProps {
  open: boolean;
  mode: DataRuleModalMode;
  editingDataRule: DataPermissionRule | null;
  onCancel: () => void;
  onSuccess: () => void;
}

export function DataRuleFormModal({
  open,
  mode,
  editingDataRule,
  onCancel,
  onSuccess,
}: DataRuleFormModalProps) {
  const [form] = Form.useForm<DataRuleFormValues>();
  const selectedResource = Form.useWatch('resource', form);
  const selectedResourceDefinition = SYSTEM_RESOURCES.find(
    (resource) => resource.resource === selectedResource
  );

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && editingDataRule) {
        form.setFieldsValue({
          name: editingDataRule.name,
          description: displayNullableText(editingDataRule.description),
          resource: editingDataRule.resource,
          action: editingDataRule.action || '*',
          condition: editingDataRule.condition,
          active: editingDataRule.active,
        });
      } else {
        form.setFieldsValue({
          name: '',
          description: '',
          resource: 'order',
          action: '*',
          condition: '{\n  \n}',
          active: true,
        });
      }
    }
  }, [open, mode, editingDataRule, form]);

  const saveMutation = useMutation({
    mutationFn: (values: DataRuleFormValues) => {
      const basePayload = {
        name: values.name?.trim() || '',
        description: values.description?.trim() || undefined,
        resource: values.resource?.trim() || '',
        action: values.action?.trim() || '*',
        condition: values.condition?.trim() || '',
        active: values.active ?? true,
      };

      if (mode === 'edit' && editingDataRule) {
        const updatePayload: UpdateDataPermissionRule = basePayload;
        return permissionManagementApi.updateDataRule(editingDataRule.id, updatePayload);
      }

      const createPayload: CreateDataPermissionRule = {
        ...basePayload,
      };
      return permissionManagementApi.createDataRule(createPayload);
    },
    onSuccess: () => {
      message.success(mode === 'edit' ? '数据规则已更新' : '数据规则已创建');
      form.resetFields();
      onSuccess();
    },
    onError: () => {
      message.error(mode === 'edit' ? '更新数据规则失败' : '创建数据规则失败');
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
      title={mode === 'edit' ? '编辑数据规则' : '新建数据规则'}
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={saveMutation.isPending}
      okText="保存"
      cancelText="取消"
      width={860}
      destroyOnHidden
    >
      <Form form={form} layout="vertical">
        <div className="permission-form-section">规则信息</div>
        <div className="data-rule-info-row">
          <Form.Item
            label="规则名称"
            name="name"
            className="data-rule-name-field"
            rules={[{ required: true, message: '请输入规则名称' }]}
          >
            <Input placeholder="例如：订单仅本人负责" />
          </Form.Item>
          <div
            className="data-rule-resource-field"
            title={
              selectedResourceDefinition
                ? `${selectedResourceDefinition.label} - ${selectedResourceDefinition.description}`
                : selectedResource
            }
          >
            <Form.Item
              label="关联资源"
              name="resource"
              rules={[{ required: true, message: '请选择或输入资源标识' }]}
              tooltip="请选择系统预置资源（如 order 订单）或直接输入自定义资源名称"
            >
              <Select
                placeholder="选择或输入资源标识（例如 order、user、project）"
                showSearch
                allowClear
                options={SYSTEM_RESOURCES.map((r) => ({
                  label: `${r.label} - ${r.description}`,
                  value: r.resource,
                }))}
              />
            </Form.Item>
          </div>
          <div className="data-rule-action-field">
            <Form.Item
              label="操作类型"
              name="action"
              rules={[{ required: true, message: '请选择或输入操作类型' }]}
              tooltip="指定规则生效的操作类型（如全部 *、查看 read、修改 update、删除 delete 等），支持直接输入自定义操作"
            >
              <AutoComplete
                placeholder="选择或输入操作类型，默认 *"
                options={SYSTEM_ACTIONS.map((a) => ({
                  label: (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span>
                        <Tag color={a.color} style={{ marginRight: 6 }}>
                          {a.key}
                        </Tag>
                        {a.label}
                      </span>
                    </div>
                  ),
                  value: a.key,
                }))}
              />
            </Form.Item>
          </div>
        </div>
        {mode === 'edit' && editingDataRule ? (
          <Form.Item label="规则编码（系统生成）" tooltip="该编码用于系统内部引用，创建后不可修改">
            <Text code copyable>
              {editingDataRule.code}
            </Text>
          </Form.Item>
        ) : null}

        <Form.Item
          label="权限条件与规则配置"
          name="condition"
          dependencies={['resource']}
          rules={[
            { required: true, message: '请配置权限条件' },
            {
              validator: (_, value: string | undefined) => {
                if (!value) return Promise.resolve();
                const error = validateConditionJson(
                  value,
                  form.getFieldValue('resource') as string | undefined
                );
                return error ? Promise.reject(new Error(error)) : Promise.resolve();
              },
            },
          ]}
        >
          <DataRuleBuilder resource={selectedResource} />
        </Form.Item>

        <Form.Item label="启用状态" name="active" valuePropName="checked">
          <Switch checkedChildren="启用" unCheckedChildren="停用" />
        </Form.Item>
        <Form.Item label="规则说明" name="description">
          <TextArea rows={2} placeholder="请输入规则说明（选填）" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
