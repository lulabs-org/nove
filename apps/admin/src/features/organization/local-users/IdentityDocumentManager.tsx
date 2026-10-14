import {
  CheckOutlined,
  DeleteOutlined,
  EditOutlined,
  FileProtectOutlined,
  PlusOutlined,
  SendOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Button from 'antd/es/button';
import Checkbox from 'antd/es/checkbox';
import Form from 'antd/es/form';
import Input from 'antd/es/input';
import message from 'antd/es/message';
import Modal from 'antd/es/modal';
import Popconfirm from 'antd/es/popconfirm';
import Select from 'antd/es/select';
import Space from 'antd/es/space';
import Table from 'antd/es/table';
import Tag from 'antd/es/tag';
import Typography from 'antd/es/typography';
import type { TableProps } from 'antd/es/table';
import { useState } from 'react';
import { Perm } from '../../../app/guards/Perm';
import { DriveMediaPicker } from '../../drive/components/DriveMediaPicker';
import { getDriveFileId, toDriveFileReference } from '../../drive/lib/driveFileReference';
import { useAuthStore } from '../../auth/model/authStore';
import { PERMISSIONS } from '../../../shared/utils/permissions';
import { userApi } from './api/userApi';
import type {
  AdminUser,
  IdentityDocument,
  IdentityDocumentType,
  IdentityDocumentWritePayload,
} from './types';

const { Text } = Typography;

const DOCUMENT_TYPES: Array<{ value: IdentityDocumentType; label: string }> = [
  { value: 'ID_CARD', label: '居民身份证' },
  { value: 'PASSPORT', label: '护照' },
  { value: 'HOUSEHOLD_REGISTER', label: '居民户口簿' },
  { value: 'HK_MACAO_PERMIT', label: '港澳居民来往内地通行证' },
  { value: 'TAIWAN_PERMIT', label: '台湾居民来往大陆通行证' },
  { value: 'FOREIGN_PERMANENT_RESIDENT', label: '外国人永久居留身份证' },
  { value: 'OTHER', label: '其他证件' },
];

const STATUS = {
  UNVERIFIED: { text: '草稿', color: 'default' },
  PENDING: { text: '待审核', color: 'processing' },
  VERIFIED: { text: '已认证', color: 'success' },
  REJECTED: { text: '已驳回', color: 'error' },
  EXPIRED: { text: '已过期', color: 'warning' },
} as const;

interface IdentityDocumentFormValues extends IdentityDocumentWritePayload {
  frontReference?: string;
  backReference?: string;
}

interface Props {
  open: boolean;
  user: AdminUser | null;
  onClose: () => void;
}

export function IdentityDocumentManager({ open, user, onClose }: Props) {
  const queryClient = useQueryClient();
  const currentOrgId = useAuthStore((state) => state.user?.currentOrgId);
  const [form] = Form.useForm<IdentityDocumentFormValues>();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<IdentityDocument | null>(null);
  const queryKey = ['identity-documents', user?.id];

  const documentsQuery = useQuery({
    queryKey,
    queryFn: () => userApi.listIdentityDocuments(user!.id),
    enabled: open && Boolean(user),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey });

  const saveMutation = useMutation({
    mutationFn: (values: IdentityDocumentFormValues) => {
      const payload: IdentityDocumentWritePayload = {
        ...values,
        issuingCountry: values.issuingCountry?.trim().toUpperCase(),
        frontDriveFileId: values.frontReference
          ? getDriveFileId(values.frontReference)
          : values.frontReference === undefined
            ? undefined
            : null,
        backDriveFileId: values.backReference
          ? getDriveFileId(values.backReference)
          : values.backReference === undefined
            ? undefined
            : null,
      };
      delete (payload as IdentityDocumentFormValues).frontReference;
      delete (payload as IdentityDocumentFormValues).backReference;
      return editing
        ? userApi.updateIdentityDocument(user!.id, editing.id, payload)
        : userApi.createIdentityDocument(user!.id, payload);
    },
    onSuccess: () => {
      void message.success(editing ? '身份凭证已更新' : '身份凭证草稿已创建');
      setFormOpen(false);
      setEditing(null);
      form.resetFields();
      void refresh();
    },
    onError: () => void message.error('保存身份凭证失败'),
  });

  const actionMutation = useMutation({
    mutationFn: async (action: {
      type: 'submit' | 'approve' | 'reject' | 'delete';
      documentId: string;
      reason?: string;
    }) => {
      if (action.type === 'submit')
        return userApi.submitIdentityDocument(user!.id, action.documentId);
      if (action.type === 'approve')
        return userApi.reviewIdentityDocument(user!.id, action.documentId, 'VERIFIED');
      if (action.type === 'reject')
        return userApi.reviewIdentityDocument(
          user!.id,
          action.documentId,
          'REJECTED',
          action.reason
        );
      return userApi.deleteIdentityDocument(user!.id, action.documentId);
    },
    onSuccess: () => {
      void message.success('操作成功');
      void refresh();
    },
    onError: () => void message.error('身份凭证操作失败'),
  });

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ issuingCountry: 'CHN', isPermanent: false, isPrimary: false });
    setFormOpen(true);
  };

  const openEdit = (document: IdentityDocument) => {
    setEditing(document);
    form.resetFields();
    form.setFieldsValue({
      documentType: document.documentType,
      issuingCountry: document.issuingCountry,
      holderName: document.holderName,
      issueDate: document.issueDate?.slice(0, 10),
      expiryDate: document.expiryDate?.slice(0, 10),
      isPermanent: document.isPermanent,
      issuingAuthority: document.issuingAuthority,
      isPrimary: document.isPrimary,
      frontReference: document.frontFile
        ? toDriveFileReference(document.frontFile.driveFileId)
        : undefined,
      backReference: document.backFile
        ? toDriveFileReference(document.backFile.driveFileId)
        : undefined,
    });
    setFormOpen(true);
  };

  const reject = (documentId: string) => {
    let reason = '';
    Modal.confirm({
      title: '驳回身份凭证',
      content: (
        <Input.TextArea
          autoFocus
          rows={3}
          maxLength={255}
          placeholder="请输入驳回原因"
          onChange={(event) => {
            reason = event.target.value.trim();
          }}
        />
      ),
      okText: '确认驳回',
      okType: 'danger',
      onOk: () => {
        if (!reason) {
          void message.error('请输入驳回原因');
          return Promise.reject(new Error('missing reason'));
        }
        return actionMutation.mutateAsync({ type: 'reject', documentId, reason });
      },
    });
  };

  const columns: TableProps<IdentityDocument>['columns'] = [
    {
      title: '证件',
      key: 'document',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Space>
            <Text strong>
              {DOCUMENT_TYPES.find((item) => item.value === record.documentType)?.label}
            </Text>
            {record.isPrimary ? <Tag color="blue">主证件</Tag> : null}
          </Space>
          <Text type="secondary">{record.maskedNumber}</Text>
        </Space>
      ),
    },
    { title: '持证人', dataIndex: 'holderName', width: 130 },
    { title: '签发地', dataIndex: 'issuingCountry', width: 90 },
    {
      title: '有效期',
      key: 'validity',
      width: 190,
      render: (_, record) =>
        record.isPermanent
          ? `${record.issueDate?.slice(0, 10) ?? '—'} 至 长期`
          : `${record.issueDate?.slice(0, 10) ?? '—'} 至 ${record.expiryDate?.slice(0, 10) ?? '—'}`,
    },
    {
      title: '影印件',
      key: 'files',
      width: 150,
      render: (_, record) => (
        <Text type="secondary">
          {[record.frontFile ? '正面' : '', record.backFile ? '反面' : '']
            .filter(Boolean)
            .join('、') || '未上传'}
        </Text>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 110,
      render: (value: IdentityDocument['status'], record) => (
        <Space direction="vertical" size={0}>
          <Tag color={STATUS[value].color}>{STATUS[value].text}</Tag>
          {record.rejectReason ? (
            <Text
              type="danger"
              ellipsis={{ tooltip: record.rejectReason }}
              style={{ maxWidth: 120 }}
            >
              {record.rejectReason}
            </Text>
          ) : null}
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      fixed: 'right',
      width: 210,
      render: (_, record) => (
        <Space size={2} wrap>
          <Perm permission={PERMISSIONS.IDENTITY_DOCUMENT.WRITE}>
            {record.status !== 'PENDING' ? (
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => openEdit(record)}
              >
                编辑
              </Button>
            ) : null}
            {record.status === 'UNVERIFIED' || record.status === 'REJECTED' ? (
              <Popconfirm
                title="提交后将等待审核，确认提交？"
                onConfirm={() => actionMutation.mutate({ type: 'submit', documentId: record.id })}
              >
                <Button type="text" size="small" icon={<SendOutlined />}>
                  提交
                </Button>
              </Popconfirm>
            ) : null}
          </Perm>
          <Perm permission={PERMISSIONS.IDENTITY_DOCUMENT.REVIEW}>
            {record.status === 'PENDING' ? (
              <>
                <Popconfirm
                  title="确认该身份凭证审核通过？"
                  onConfirm={() =>
                    actionMutation.mutate({ type: 'approve', documentId: record.id })
                  }
                >
                  <Button type="text" size="small" icon={<CheckOutlined />}>
                    通过
                  </Button>
                </Popconfirm>
                <Button
                  type="text"
                  danger
                  size="small"
                  icon={<StopOutlined />}
                  onClick={() => reject(record.id)}
                >
                  驳回
                </Button>
              </>
            ) : null}
          </Perm>
          <Perm permission={PERMISSIONS.IDENTITY_DOCUMENT.WRITE}>
            <Popconfirm
              title="确定删除该身份凭证？"
              onConfirm={() => actionMutation.mutate({ type: 'delete', documentId: record.id })}
            >
              <Button type="text" danger size="small" icon={<DeleteOutlined />} />
            </Popconfirm>
          </Perm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Modal
        title={
          <Space>
            <FileProtectOutlined />
            <span>身份凭证 · {user?.profile?.displayName ?? user?.username ?? user?.email}</span>
          </Space>
        }
        open={open}
        width={1100}
        footer={<Button onClick={onClose}>关闭</Button>}
        onCancel={onClose}
        destroyOnHidden
      >
        <div className="identity-document-toolbar">
          <Text type="secondary">证件号码只显示脱敏结果；影印件保存在组织云盘。</Text>
          <Perm permission={PERMISSIONS.IDENTITY_DOCUMENT.WRITE}>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              登记身份凭证
            </Button>
          </Perm>
        </div>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={documentsQuery.data ?? []}
          loading={documentsQuery.isFetching}
          pagination={false}
          scroll={{ x: 1000 }}
        />
      </Modal>

      <Modal
        title={editing ? '编辑身份凭证' : '登记身份凭证'}
        open={formOpen}
        width={820}
        onCancel={() => setFormOpen(false)}
        onOk={() => void form.validateFields().then((values) => saveMutation.mutate(values))}
        okText="保存"
        cancelText="取消"
        confirmLoading={saveMutation.isPending}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" preserve={false}>
          <div className="identity-document-form-grid">
            <Form.Item
              name="documentType"
              label="证件类型"
              rules={[{ required: true, message: '请选择证件类型' }]}
            >
              <Select options={DOCUMENT_TYPES} />
            </Form.Item>
            <Form.Item
              name="issuingCountry"
              label="签发国家或地区"
              rules={[
                { required: true, message: '请输入三位国家或地区代码' },
                { pattern: /^[A-Za-z]{3}$/, message: '请输入 ISO 3166-1 三位代码' },
              ]}
            >
              <Input maxLength={3} placeholder="CHN" />
            </Form.Item>
            <Form.Item
              name="holderName"
              label="持证人姓名"
              rules={[{ required: true, message: '请输入持证人姓名' }]}
            >
              <Input maxLength={100} />
            </Form.Item>
            <Form.Item
              name="documentNumber"
              label="证件号码"
              extra={editing ? '留空则保持原号码不变' : '保存后仅显示脱敏号码'}
              rules={editing ? [] : [{ required: true, message: '请输入证件号码' }]}
            >
              <Input maxLength={100} autoComplete="off" />
            </Form.Item>
            <Form.Item name="issueDate" label="签发日期">
              <Input type="date" />
            </Form.Item>
            <Form.Item
              noStyle
              shouldUpdate={(before, after) => before.isPermanent !== after.isPermanent}
            >
              {({ getFieldValue }) => (
                <Form.Item
                  name="expiryDate"
                  label="到期日期"
                  rules={
                    getFieldValue('isPermanent')
                      ? []
                      : [{ required: true, message: '请选择到期日期' }]
                  }
                >
                  <Input type="date" disabled={getFieldValue('isPermanent')} />
                </Form.Item>
              )}
            </Form.Item>
            <Form.Item name="issuingAuthority" label="签发机构">
              <Input maxLength={100} />
            </Form.Item>
            <Space align="center">
              <Form.Item name="isPermanent" valuePropName="checked" noStyle>
                <Checkbox>长期有效</Checkbox>
              </Form.Item>
              <Form.Item name="isPrimary" valuePropName="checked" noStyle>
                <Checkbox>设为主证件</Checkbox>
              </Form.Item>
            </Space>
            <Form.Item name="frontReference" label="正面照或主信息页">
              <DriveMediaPicker
                orgId={currentOrgId ?? ''}
                mediaType="document"
                label="身份凭证"
                entityLabel="身份凭证"
              />
            </Form.Item>
            <Form.Item name="backReference" label="反面照或副页">
              <DriveMediaPicker
                orgId={currentOrgId ?? ''}
                mediaType="document"
                label="身份凭证"
                entityLabel="身份凭证"
              />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </>
  );
}
