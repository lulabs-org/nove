import {
  CopyOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Alert from 'antd/es/alert';
import Button from 'antd/es/button';
import Checkbox from 'antd/es/checkbox';
import Descriptions from 'antd/es/descriptions';
import Drawer from 'antd/es/drawer';
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
import { useMemo, useState } from 'react';

import { Perm } from '../../../app/guards/Perm';
import type {
  CreateOAuthClientDto,
  CreateOAuthClientResponseDto,
  OAuthClientAdminControllerListParams,
  OAuthClientDto,
  RotateOAuthClientSecretResponseDto,
  UpdateOAuthClientDto,
} from '../../../shared/lib/api/orval/business/schemas';
import { PERMISSIONS } from '../../../shared/utils/permissions';
import { ScopeSelector } from '../api-keys/components/ScopeSelector';
import { oauthClientApi } from './api/oauthClientApi';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

interface ClientFormValues {
  name: string;
  description?: string;
  logoUri?: string;
  clientType: 'PUBLIC' | 'CONFIDENTIAL';
  redirectUrisText: string;
  scopes: string[];
}

function splitUris(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function SecretModal({
  open,
  clientId,
  secret,
  onClose,
}: {
  open: boolean;
  clientId?: string;
  secret?: string;
  onClose: () => void;
}) {
  const [saved, setSaved] = useState(false);
  const copy = async (value?: string) => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    message.success('已复制到剪贴板');
  };
  return (
    <Modal
      title="请立即保存客户端凭证"
      open={open}
      onOk={() => {
        setSaved(false);
        onClose();
      }}
      okText="我已保存，完成"
      okButtonProps={{ disabled: !saved }}
      cancelButtonProps={{ style: { display: 'none' } }}
      closable={false}
      maskClosable={false}
    >
      <Alert
        type="warning"
        showIcon
        title="Client Secret 只显示一次，关闭后无法再次查看。"
        style={{ marginBottom: 16 }}
      />
      {clientId && (
        <Paragraph copyable={{ text: clientId }}>
          <Text strong>Client ID：</Text>
          <Text code>{clientId}</Text>
        </Paragraph>
      )}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Text code style={{ flex: 1, wordBreak: 'break-all' }}>
          {secret}
        </Text>
        <Button icon={<CopyOutlined />} onClick={() => copy(secret)}>
          复制
        </Button>
      </div>
      <Checkbox
        checked={saved}
        onChange={(event) => setSaved(event.target.checked)}
        style={{ marginTop: 20 }}
      >
        我已将凭证保存到安全位置
      </Checkbox>
    </Modal>
  );
}

export function OAuthClientManagement() {
  const queryClient = useQueryClient();
  const [params, setParams] = useState<OAuthClientAdminControllerListParams>({
    page: 1,
    pageSize: 20,
  });
  const [form] = Form.useForm<ClientFormValues>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<OAuthClientDto | null>(null);
  const [detail, setDetail] = useState<OAuthClientDto | null>(null);
  const [secretResult, setSecretResult] = useState<{ clientId?: string; secret: string } | null>(
    null
  );

  const listQuery = useQuery({
    queryKey: ['oauth-clients', params],
    queryFn: () => oauthClientApi.list(params),
  });
  const scopesQuery = useQuery({
    queryKey: ['oauth-client-delegatable-scopes'],
    queryFn: oauthClientApi.scopes,
  });
  const scopeCodes = useMemo(
    () => (scopesQuery.data || []).map((scope) => scope.code),
    [scopesQuery.data]
  );
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['oauth-clients'] });

  const createMutation = useMutation({
    mutationFn: oauthClientApi.create,
    onSuccess: (result: CreateOAuthClientResponseDto) => {
      message.success('OAuth 客户端创建成功');
      setModalOpen(false);
      form.resetFields();
      refresh();
      if (result.clientSecret)
        setSecretResult({ clientId: result.clientId, secret: result.clientSecret });
    },
    onError: () => message.error('创建 OAuth 客户端失败'),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOAuthClientDto }) =>
      oauthClientApi.update(id, data),
    onSuccess: () => {
      message.success('OAuth 客户端已更新');
      setModalOpen(false);
      setEditing(null);
      form.resetFields();
      refresh();
    },
    onError: () => message.error('更新 OAuth 客户端失败'),
  });
  const statusMutation = useMutation({
    mutationFn: ({ id, enable }: { id: string; enable: boolean }) =>
      enable ? oauthClientApi.enable(id) : oauthClientApi.disable(id),
    onSuccess: () => {
      message.success('客户端状态已更新');
      refresh();
    },
    onError: () => message.error('更新客户端状态失败'),
  });
  const rotateMutation = useMutation({
    mutationFn: (client: OAuthClientDto) =>
      oauthClientApi.rotateSecret(client.id).then((result) => ({ client, result })),
    onSuccess: ({
      client,
      result,
    }: {
      client: OAuthClientDto;
      result: RotateOAuthClientSecretResponseDto;
    }) => {
      message.success('Client Secret 已轮换，已有 Refresh Token 已撤销');
      setSecretResult({ clientId: client.clientId, secret: result.clientSecret });
    },
    onError: () => message.error('轮换 Client Secret 失败'),
  });

  const openCreate = () => {
    setEditing(null);
    form.setFieldsValue({ clientType: 'PUBLIC', scopes: [], redirectUrisText: '' });
    setModalOpen(true);
  };
  const openEdit = (client: OAuthClientDto) => {
    setEditing(client);
    form.setFieldsValue({
      name: client.name,
      description: client.description || undefined,
      logoUri: client.logoUri || undefined,
      clientType: client.clientType,
      redirectUrisText: client.redirectUris.join('\n'),
      scopes: client.scopes,
    });
    setModalOpen(true);
  };
  const submit = async () => {
    const values = await form.validateFields();
    const common = {
      name: values.name,
      description: values.description,
      logoUri: values.logoUri,
      redirectUris: splitUris(values.redirectUrisText),
      scopes: values.scopes,
    };
    if (editing) updateMutation.mutate({ id: editing.id, data: common });
    else
      createMutation.mutate({ ...common, clientType: values.clientType } as CreateOAuthClientDto);
  };

  const columns: TableProps<OAuthClientDto>['columns'] = [
    {
      title: '名称',
      dataIndex: 'name',
      render: (_, client) => (
        <Button type="link" icon={<EyeOutlined />} onClick={() => setDetail(client)}>
          {client.name}
        </Button>
      ),
    },
    {
      title: 'Client ID',
      dataIndex: 'clientId',
      render: (value: string) => (
        <Text code copyable={{ text: value }}>
          {value.slice(0, 12)}…
        </Text>
      ),
    },
    {
      title: '类型',
      dataIndex: 'clientType',
      render: (value) => <Tag color={value === 'PUBLIC' ? 'blue' : 'purple'}>{value}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (value) => (
        <Tag color={value === 'ACTIVE' ? 'success' : 'default'}>
          {value === 'ACTIVE' ? '启用' : '已禁用'}
        </Tag>
      ),
    },
    {
      title: '来源',
      dataIndex: 'isSystem',
      render: (value) => (value ? <Tag color="gold">系统内置</Tag> : '后台创建'),
    },
    { title: 'Scope', dataIndex: 'scopes', render: (value: string[]) => `${value.length} 项` },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      render: (value: string) => new Date(value).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, client) =>
        client.isSystem ? (
          <Text type="secondary">只读</Text>
        ) : (
          <Space>
            <Perm permission={PERMISSIONS.OAUTH_CLIENT.UPDATE}>
              <Button type="link" icon={<EditOutlined />} onClick={() => openEdit(client)}>
                编辑
              </Button>
            </Perm>
            {client.clientType === 'CONFIDENTIAL' && (
              <Perm permission={PERMISSIONS.OAUTH_CLIENT.ROTATE_SECRET}>
                <Popconfirm
                  title="确认轮换 Client Secret？"
                  description="现有 Refresh Token 将全部失效。"
                  onConfirm={() => rotateMutation.mutate(client)}
                >
                  <Button type="link">轮换密钥</Button>
                </Popconfirm>
              </Perm>
            )}
            <Perm permission={PERMISSIONS.OAUTH_CLIENT.DISABLE}>
              <Popconfirm
                title={client.status === 'ACTIVE' ? '确认禁用客户端？' : '确认重新启用客户端？'}
                onConfirm={() =>
                  statusMutation.mutate({ id: client.id, enable: client.status !== 'ACTIVE' })
                }
              >
                <Button type="link" danger={client.status === 'ACTIVE'}>
                  {client.status === 'ACTIVE' ? '禁用' : '启用'}
                </Button>
              </Popconfirm>
            </Perm>
          </Space>
        ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }} wrap>
        <Input.Search
          allowClear
          placeholder="搜索名称或 Client ID"
          onSearch={(keyword) =>
            setParams((current) => ({ ...current, keyword: keyword || undefined, page: 1 }))
          }
          style={{ width: 300 }}
        />
        <Select
          allowClear
          placeholder="客户端类型"
          options={[{ value: 'PUBLIC' }, { value: 'CONFIDENTIAL' }]}
          onChange={(clientType) => setParams((current) => ({ ...current, clientType, page: 1 }))}
          style={{ width: 160 }}
        />
        <Select
          allowClear
          placeholder="状态"
          options={[
            { value: 'ACTIVE', label: '启用' },
            { value: 'DISABLED', label: '已禁用' },
          ]}
          onChange={(status) => setParams((current) => ({ ...current, status, page: 1 }))}
          style={{ width: 140 }}
        />
        <Button
          icon={<ReloadOutlined />}
          onClick={() => listQuery.refetch()}
          loading={listQuery.isFetching}
        >
          刷新
        </Button>
        <Perm permission={PERMISSIONS.OAUTH_CLIENT.CREATE}>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            创建客户端
          </Button>
        </Perm>
      </Space>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={listQuery.data?.items || []}
        loading={listQuery.isLoading}
        pagination={{
          current: Number(params.page) || 1,
          pageSize: Number(params.pageSize) || 20,
          total: listQuery.data?.total || 0,
          showSizeChanger: true,
        }}
        onChange={(pagination) =>
          setParams((current) => ({
            ...current,
            page: pagination.current,
            pageSize: pagination.pageSize,
          }))
        }
      />

      <Modal
        title={editing ? '编辑 OAuth 客户端' : '创建 OAuth 客户端'}
        open={modalOpen}
        onOk={submit}
        onCancel={() => {
          setModalOpen(false);
          setEditing(null);
          form.resetFields();
        }}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        width={760}
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item name="name" label="应用名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <TextArea rows={2} />
          </Form.Item>
          <Form.Item name="logoUri" label="Logo URI" rules={[{ type: 'url', warningOnly: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="clientType" label="客户端类型" rules={[{ required: true }]}>
            <Select
              disabled={!!editing}
              options={[
                { value: 'PUBLIC', label: 'PUBLIC（CLI、桌面或原生应用）' },
                { value: 'CONFIDENTIAL', label: 'CONFIDENTIAL（服务端应用）' },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="redirectUrisText"
            label="Redirect URIs"
            tooltip="每行一个 URI"
            rules={[
              { required: true },
              {
                validator: (_, value) =>
                  splitUris(value || '').length
                    ? Promise.resolve()
                    : Promise.reject(new Error('至少填写一个 Redirect URI')),
              },
            ]}
          >
            <TextArea rows={4} placeholder="https://example.com/oauth/callback" />
          </Form.Item>
          <Form.Item
            name="scopes"
            label="可申请 Scope"
            rules={[{ required: true, type: 'array', min: 1 }]}
          >
            <ScopeSelector options={scopeCodes} />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer title="OAuth 客户端详情" open={!!detail} onClose={() => setDetail(null)} size="large">
        {detail && (
          <Descriptions
            column={1}
            bordered
            items={[
              { key: 'name', label: '名称', children: detail.name },
              {
                key: 'clientId',
                label: 'Client ID',
                children: (
                  <Text code copyable>
                    {detail.clientId}
                  </Text>
                ),
              },
              { key: 'type', label: '类型', children: detail.clientType },
              { key: 'status', label: '状态', children: detail.status },
              {
                key: 'redirectUris',
                label: 'Redirect URIs',
                children: detail.redirectUris.map((uri) => (
                  <div key={uri}>
                    <Text code>{uri}</Text>
                  </div>
                )),
              },
              {
                key: 'scopes',
                label: 'Scopes',
                children: (
                  <Space wrap>
                    {detail.scopes.map((scope) => (
                      <Tag key={scope}>{scope}</Tag>
                    ))}
                  </Space>
                ),
              },
              { key: 'version', label: '凭证版本', children: detail.credentialVersion },
            ]}
          />
        )}
      </Drawer>
      <SecretModal
        open={!!secretResult}
        clientId={secretResult?.clientId}
        secret={secretResult?.secret}
        onClose={() => setSecretResult(null)}
      />
    </div>
  );
}
