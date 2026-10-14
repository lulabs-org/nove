import { useEffect, useState } from 'react';
import {
  Button,
  Empty,
  Form,
  Input,
  message,
  Modal,
  Skeleton,
  Space,
  Switch,
  Tag,
  Typography,
  Upload,
} from 'antd';
import { DeleteOutlined, EditOutlined, UploadOutlined } from '@ant-design/icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../shared/hooks/useAuth';
import {
  getOrganizationControllerGetOrganizationQueryKey,
  useOrganizationControllerGetOrganization,
} from '../../../shared/lib/api/orval/business/admin-organizations';
import type { UpdateOrganizationDto } from '../../../shared/lib/api/orval/business/schemas';
import { PERMISSIONS } from '../../../shared/utils/permissions';
import { saveOrganizationProfile } from './organizationProfileApi';
import './OrganizationInfoPage.css';

const { Text, Title, Paragraph } = Typography;

function textValue(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : '-';
}

function formatDate(value?: string) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function OrganizationInfoPage() {
  const [form] = Form.useForm<UpdateOrganizationDto>();
  const [messageApi, contextHolder] = message.useMessage();
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedLogo, setSelectedLogo] = useState<{ file: File; url: string }>();
  const logoFile = selectedLogo?.file;
  const logoPreview = selectedLogo?.url;
  const setLogoFile = (file?: File) => {
    setSelectedLogo(file ? { file, url: URL.createObjectURL(file) } : undefined);
  };
  const [removeLogo, setRemoveLogo] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
    };
  }, [logoPreview]);
  const { user, checkPermission } = useAuth();
  const orgId = user?.currentOrgId || '';
  const canUpdate = checkPermission(PERMISSIONS.ORGANIZATION.UPDATE);

  const organizationQuery = useOrganizationControllerGetOrganization(orgId, {
    query: { enabled: !!orgId },
  });
  const updateOrganization = useMutation({
    mutationFn: (values: UpdateOrganizationDto) =>
      saveOrganizationProfile(orgId, values, logoFile, removeLogo),
    onSuccess: (updated) => {
      queryClient.setQueryData(getOrganizationControllerGetOrganizationQueryKey(orgId), updated);
      void queryClient.invalidateQueries({
        queryKey: getOrganizationControllerGetOrganizationQueryKey(orgId),
      });
      messageApi.success('企业信息已更新');
      setEditorOpen(false);
      setLogoFile(undefined);
    },
    onError: () => messageApi.error('企业信息保存失败，请重试'),
  });

  const organization = organizationQuery.data;

  const openEditor = () => {
    if (!organization) return;
    setLogoFile(undefined);
    setRemoveLogo(false);
    form.setFieldsValue({
      name: organization.name,
      description:
        textValue(organization.description) === '-' ? undefined : String(organization.description),
      active: organization.active,
    });
    setEditorOpen(true);
  };

  if (!orgId) {
    return <Empty description="当前账号尚未加入企业" />;
  }

  if (organizationQuery.isLoading) {
    return <Skeleton active paragraph={{ rows: 8 }} />;
  }

  if (!organization) {
    return <Empty description="企业信息加载失败" />;
  }

  const logo = textValue(organization.logo);
  const editorLogo = logoPreview || (!removeLogo && logo !== '-' ? logo : undefined);
  const logoFallback = organization.name.trim().slice(0, 1).toUpperCase() || 'N';

  return (
    <div className="organization-info-page">
      {contextHolder}
      <Modal
        title="编辑企业信息"
        width={560}
        open={editorOpen}
        okText="保存"
        cancelText="取消"
        confirmLoading={updateOrganization.isPending}
        onCancel={() => {
          if (updateOrganization.isPending) return;
          setEditorOpen(false);
          setLogoFile(undefined);
        }}
        cancelButtonProps={{ disabled: updateOrganization.isPending }}
        closable={!updateOrganization.isPending}
        maskClosable={!updateOrganization.isPending}
        keyboard={!updateOrganization.isPending}
        onOk={() => form.submit()}
        destroyOnHidden
        forceRender
      >
        <Form
          form={form}
          onFinish={(values) => updateOrganization.mutate(values)}
          layout="vertical"
          className="organization-info-form"
          disabled={updateOrganization.isPending}
        >
          <Form.Item
            name="name"
            label="企业名称"
            rules={[{ required: true, message: '请输入企业名称' }]}
          >
            <Input placeholder="请输入企业名称" />
          </Form.Item>
          <Form.Item label="企业编码" extra="企业编码由系统分配，创建后不可修改。">
            <Input value={organization.code} readOnly aria-label="企业编码" />
          </Form.Item>
          <Form.Item label="企业 Logo">
            <div className="organization-logo-editor">
              <div className="organization-logo-preview">
                {editorLogo ? <img src={editorLogo} alt="企业 Logo 预览" /> : <span>未上传</span>}
              </div>
              <div className="organization-logo-controls">
                <Space wrap>
                  <Upload
                    accept="image/jpeg,image/png,image/webp"
                    showUploadList={false}
                    disabled={updateOrganization.isPending}
                    beforeUpload={(file) => {
                      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
                        messageApi.error('Logo 仅支持 JPEG、PNG 或 WebP 格式');
                        return Upload.LIST_IGNORE;
                      }
                      if (file.size > 5 * 1024 * 1024) {
                        messageApi.error('Logo 文件不能超过 5 MB');
                        return Upload.LIST_IGNORE;
                      }
                      setLogoFile(file);
                      setRemoveLogo(false);
                      return false;
                    }}
                  >
                    <Button icon={<UploadOutlined />}>
                      {editorLogo ? '替换 Logo' : '上传 Logo'}
                    </Button>
                  </Upload>
                  {editorLogo && (
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => {
                        setLogoFile(undefined);
                        setRemoveLogo(true);
                      }}
                    >
                      移除 Logo
                    </Button>
                  )}
                </Space>
                <Text type="secondary">支持 JPEG、PNG、WebP，最大 5 MB；保存后生效。</Text>
              </div>
            </div>
          </Form.Item>
          <Form.Item name="description" label="企业简介">
            <Input.TextArea rows={4} maxLength={500} showCount placeholder="填写企业简介" />
          </Form.Item>
          <Form.Item name="active" label="企业状态" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="停用" />
          </Form.Item>
        </Form>
      </Modal>
      <div className="organization-info-tabs" role="tablist" aria-label="企业设置">
        <button
          className="organization-info-tab is-active"
          type="button"
          role="tab"
          aria-selected="true"
        >
          企业信息管理
        </button>
      </div>

      <section className="organization-info-section">
        <Title level={5} className="organization-info-section-title">
          基础信息
        </Title>
        <div className="organization-info-hero">
          <div className={`organization-info-logo${logo === '-' ? ' is-fallback' : ''}`}>
            {logo !== '-' ? <img src={logo} alt={`${organization.name} Logo`} /> : logoFallback}
          </div>
          <div className="organization-info-hero-main">
            <Space size={8} wrap>
              <Title level={4}>{organization.name}</Title>
              <Tag color={organization.active ? 'success' : 'default'}>
                {organization.active ? '正常启用' : '已停用'}
              </Tag>
            </Space>
            <Paragraph>{textValue(organization.description)}</Paragraph>
          </div>
        </div>
      </section>

      <section className="organization-info-section organization-info-details">
        <div className="organization-info-section-header">
          <Title level={5} className="organization-info-section-title">
            更多信息
          </Title>
          {canUpdate && (
            <Button icon={<EditOutlined />} onClick={openEditor}>
              编辑
            </Button>
          )}
        </div>
        <dl className="organization-info-grid">
          <div>
            <dt>企业名称</dt>
            <dd>{organization.name}</dd>
          </div>
          <div>
            <dt>企业编码</dt>
            <dd className="organization-info-code">{organization.code}</dd>
          </div>
          <div>
            <dt>企业 ID</dt>
            <dd className="organization-info-code">{organization.id}</dd>
          </div>
          <div>
            <dt>企业状态</dt>
            <dd>{organization.active ? '启用' : '停用'}</dd>
          </div>
          <div>
            <dt>组织层级</dt>
            <dd>{organization.level}</dd>
          </div>
          <div>
            <dt>排序值</dt>
            <dd>{organization.sortOrder}</dd>
          </div>
          <div>
            <dt>创建时间</dt>
            <dd>{formatDate(organization.createdAt)}</dd>
          </div>
          <div>
            <dt>更新时间</dt>
            <dd>{formatDate(organization.updatedAt)}</dd>
          </div>
        </dl>
        <div className="organization-info-description">
          <Text type="secondary">企业简介</Text>
          <Paragraph>{textValue(organization.description)}</Paragraph>
        </div>
      </section>
    </div>
  );
}
