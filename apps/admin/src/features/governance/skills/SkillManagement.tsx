import { useCallback, useEffect, useState } from 'react';
import Button from 'antd/es/button';
import Drawer from 'antd/es/drawer';
import Form from 'antd/es/form';
import Input from 'antd/es/input';
import Modal from 'antd/es/modal';
import Popconfirm from 'antd/es/popconfirm';
import Select from 'antd/es/select';
import Space from 'antd/es/space';
import Table from 'antd/es/table';
import Tag from 'antd/es/tag';
import Upload from 'antd/es/upload';
import message from 'antd/es/message';
import Typography from 'antd/es/typography';
import { useAuth } from '../../../shared/hooks/useAuth';
import { PERMISSIONS } from '../../../shared/utils/permissions';
import {
  skillApi,
  type Skill,
  type SkillCategory,
  type SkillDetail,
  type SkillPage,
  type SkillStatus,
  type SkillVersion,
} from './skillApi';

const categories: SkillCategory[] = ['MEETING', 'SPEAKER', 'TASK', 'REPORT', 'GENERAL'];
const statuses: SkillStatus[] = ['ACTIVE', 'DISABLED', 'DEPRECATED'];
const categoryNames: Record<SkillCategory, string> = {
  MEETING: '会议',
  SPEAKER: '发言人',
  TASK: '任务',
  REPORT: '报告',
  GENERAL: '通用',
};
const statusNames: Record<SkillStatus, string> = {
  ACTIVE: '启用',
  DISABLED: '停用',
  DEPRECATED: '已弃用',
};

type UploadValues = { version: string; changelog?: string };
type EditValues = Pick<Skill, 'name' | 'description' | 'category' | 'status'>;

export function SkillManagement() {
  const { checkPermission } = useAuth();
  const [page, setPage] = useState<SkillPage>({ items: [], total: 0, page: 1, pageSize: 20 });
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState<SkillCategory>();
  const [status, setStatus] = useState<SkillStatus>();
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<SkillDetail>();
  const [uploadTarget, setUploadTarget] = useState<SkillDetail | null>();
  const [uploadFile, setUploadFile] = useState<File>();
  const [editOpen, setEditOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploadForm] = Form.useForm<UploadValues>();
  const [editForm] = Form.useForm<EditValues>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setPage(
        await skillApi.list({
          page: pageNumber,
          pageSize,
          keyword: keyword || undefined,
          category,
          status,
        })
      );
    } catch {
      message.error('加载技能列表失败');
    } finally {
      setLoading(false);
    }
  }, [pageNumber, pageSize, keyword, category, status]);

  useEffect(() => {
    void load();
  }, [load]);

  const openDetail = async (id: string) => {
    try {
      setDetail(await skillApi.get(id));
    } catch {
      message.error('加载技能详情失败');
    }
  };

  const refresh = async (id?: string) => {
    await load();
    if (id) await openDetail(id);
  };

  const submitUpload = async (values: UploadValues) => {
    if (!uploadFile) return message.error('请选择 Zip 文件');
    setBusy(true);
    try {
      const targetId = uploadTarget?.id;
      await skillApi.upload(uploadFile, values.version, values.changelog, targetId);
      message.success(targetId ? '版本上传成功' : '技能导入成功');
      setUploadTarget(undefined);
      setUploadFile(undefined);
      uploadForm.resetFields();
      await refresh(targetId);
    } catch {
      message.error('上传失败，请检查 Zip 包、技能编码和版本号');
    } finally {
      setBusy(false);
    }
  };

  const submitEdit = async (values: EditValues) => {
    if (!detail) return;
    setBusy(true);
    try {
      await skillApi.update(detail.id, values);
      message.success('技能信息已更新');
      setEditOpen(false);
      await refresh(detail.id);
    } catch {
      message.error('更新技能失败');
    } finally {
      setBusy(false);
    }
  };

  const activate = async (version: string) => {
    if (!detail) return;
    setBusy(true);
    try {
      await skillApi.activate(detail.id, version);
      message.success('当前版本已切换');
      await refresh(detail.id);
    } catch {
      message.error('切换版本失败');
    } finally {
      setBusy(false);
    }
  };

  const removeVersion = async (version: string) => {
    if (!detail) return;
    setBusy(true);
    try {
      await skillApi.deleteVersion(detail.id, version);
      message.success('版本已删除');
      await refresh(detail.id);
    } catch {
      message.error('删除版本失败');
    } finally {
      setBusy(false);
    }
  };

  const removeSkill = async (skill: Skill) => {
    setBusy(true);
    try {
      await skillApi.delete(skill.id);
      message.success('技能已删除');
      setDetail(undefined);
      await load();
    } catch {
      message.error('删除技能失败');
    } finally {
      setBusy(false);
    }
  };

  const download = async (version: string) => {
    if (!detail) return;
    try {
      const blob = await skillApi.download(detail.id, version);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${detail.code}-${version}.zip`;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      message.error('下载版本失败');
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 20 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          技能管理
        </Typography.Title>
        {checkPermission(PERMISSIONS.SKILL.CREATE) && (
          <Button
            type="primary"
            onClick={() => {
              uploadForm.resetFields();
              setUploadFile(undefined);
              setUploadTarget(null);
            }}
          >
            导入技能 Zip
          </Button>
        )}
      </Space>
      <Space wrap style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="搜索名称、编码或描述"
          allowClear
          onSearch={(value) => {
            setKeyword(value.trim());
            setPageNumber(1);
          }}
          style={{ width: 260 }}
        />
        <Select
          allowClear
          placeholder="分类"
          style={{ width: 130 }}
          options={categories.map((value) => ({ value, label: categoryNames[value] }))}
          onChange={(value: SkillCategory | undefined) => {
            setCategory(value);
            setPageNumber(1);
          }}
        />
        <Select
          allowClear
          placeholder="状态"
          style={{ width: 130 }}
          options={statuses.map((value) => ({ value, label: statusNames[value] }))}
          onChange={(value: SkillStatus | undefined) => {
            setStatus(value);
            setPageNumber(1);
          }}
        />
      </Space>
      <Table<Skill>
        rowKey="id"
        loading={loading}
        dataSource={page.items}
        pagination={{
          current: pageNumber,
          pageSize,
          total: page.total,
          showSizeChanger: true,
          onChange: (next, size) => {
            setPageNumber(next);
            setPageSize(size);
          },
        }}
        columns={[
          {
            title: '名称',
            dataIndex: 'name',
            render: (name: string, skill: Skill) => (
              <Button type="link" onClick={() => void openDetail(skill.id)}>
                {name}
              </Button>
            ),
          },
          { title: '编码', dataIndex: 'code' },
          {
            title: '分类',
            dataIndex: 'category',
            render: (value: SkillCategory) => categoryNames[value],
          },
          {
            title: '状态',
            dataIndex: 'status',
            render: (value: SkillStatus) => (
              <Tag color={value === 'ACTIVE' ? 'green' : 'default'}>{statusNames[value]}</Tag>
            ),
          },
          { title: '当前版本', dataIndex: 'currentVersion' },
          {
            title: '操作',
            render: (_: unknown, skill: Skill) => (
              <Space>
                <Button size="small" onClick={() => void openDetail(skill.id)}>
                  查看版本
                </Button>
                {checkPermission(PERMISSIONS.SKILL.DELETE) && (
                  <Popconfirm
                    title="删除此技能及所有版本？"
                    onConfirm={() => void removeSkill(skill)}
                  >
                    <Button size="small" danger disabled={busy}>
                      删除
                    </Button>
                  </Popconfirm>
                )}
              </Space>
            ),
          },
        ]}
      />
      <Drawer
        title={detail?.name}
        open={!!detail}
        size={760}
        onClose={() => setDetail(undefined)}
        extra={
          detail && (
            <Space>
              {checkPermission(PERMISSIONS.SKILL.UPDATE) && (
                <>
                  <Button
                    onClick={() => {
                      editForm.setFieldsValue({
                        name: detail.name,
                        description: detail.description ?? '',
                        category: detail.category,
                        status: detail.status,
                      });
                      setEditOpen(true);
                    }}
                  >
                    编辑
                  </Button>
                  <Button
                    type="primary"
                    onClick={() => {
                      uploadForm.resetFields();
                      setUploadFile(undefined);
                      setUploadTarget(detail);
                    }}
                  >
                    上传新版本
                  </Button>
                </>
              )}
            </Space>
          )
        }
      >
        {detail && (
          <>
            <Typography.Paragraph>
              <strong>编码：</strong>
              {detail.code}
            </Typography.Paragraph>
            <Typography.Paragraph>
              <strong>描述：</strong>
              {detail.description || '暂无'}
            </Typography.Paragraph>
            <Typography.Paragraph>
              <strong>当前版本：</strong>
              {detail.currentVersion}
            </Typography.Paragraph>
            <Table<SkillVersion>
              rowKey="id"
              dataSource={detail.versions}
              pagination={false}
              columns={[
                {
                  title: '版本',
                  dataIndex: 'version',
                  render: (value: string) =>
                    value === detail.currentVersion ? (
                      <Space>
                        {value}
                        <Tag color="blue">当前</Tag>
                      </Space>
                    ) : (
                      value
                    ),
                },
                {
                  title: '更新说明',
                  dataIndex: 'changelog',
                  render: (value: string | null) => value || '—',
                },
                {
                  title: '大小',
                  dataIndex: 'sizeBytes',
                  render: (value: string) => `${(Number(value) / 1024).toFixed(1)} KB`,
                },
                {
                  title: '操作',
                  render: (_: unknown, version: SkillVersion) => (
                    <Space>
                      <Button size="small" onClick={() => void download(version.version)}>
                        下载
                      </Button>
                      {version.version !== detail.currentVersion &&
                        checkPermission(PERMISSIONS.SKILL.UPDATE) && (
                          <Button
                            size="small"
                            disabled={busy}
                            onClick={() => void activate(version.version)}
                          >
                            设为当前
                          </Button>
                        )}
                      {version.version !== detail.currentVersion &&
                        checkPermission(PERMISSIONS.SKILL.DELETE) && (
                          <Popconfirm
                            title="删除此版本？"
                            onConfirm={() => void removeVersion(version.version)}
                          >
                            <Button size="small" danger disabled={busy}>
                              删除
                            </Button>
                          </Popconfirm>
                        )}
                    </Space>
                  ),
                },
              ]}
            />
          </>
        )}
      </Drawer>
      <Modal
        title={uploadTarget ? `为 ${uploadTarget.name} 上传新版本` : '导入技能 Zip'}
        open={uploadTarget !== undefined}
        onCancel={() => {
          setUploadTarget(undefined);
          setUploadFile(undefined);
        }}
        onOk={() => void uploadForm.submit()}
        confirmLoading={busy}
        destroyOnHidden
      >
        <Form form={uploadForm} layout="vertical" onFinish={(values) => void submitUpload(values)}>
          <Form.Item label="Zip 包" required>
            <Upload
              accept=".zip,application/zip"
              maxCount={1}
              beforeUpload={(file) => {
                setUploadFile(file);
                return false;
              }}
              onRemove={() => {
                setUploadFile(undefined);
              }}
            >
              <Button>选择 Zip 文件</Button>
            </Upload>
          </Form.Item>
          <Form.Item
            name="version"
            label="版本号"
            rules={[
              { required: true, message: '请输入版本号' },
              { pattern: /^[a-zA-Z0-9][a-zA-Z0-9._+-]{0,49}$/, message: '版本号格式无效' },
            ]}
          >
            <Input placeholder="例如 1.0.0" />
          </Form.Item>
          <Form.Item name="changelog" label="更新说明">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="编辑技能"
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        onOk={() => void editForm.submit()}
        confirmLoading={busy}
        destroyOnHidden
      >
        <Form form={editForm} layout="vertical" onFinish={(values) => void submitEdit(values)}>
          <Form.Item name="name" label="名称" rules={[{ required: true }]}>
            <Input maxLength={150} />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} maxLength={10000} />
          </Form.Item>
          <Form.Item name="category" label="分类" rules={[{ required: true }]}>
            <Select options={categories.map((value) => ({ value, label: categoryNames[value] }))} />
          </Form.Item>
          <Form.Item name="status" label="状态" rules={[{ required: true }]}>
            <Select options={statuses.map((value) => ({ value, label: statusNames[value] }))} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
