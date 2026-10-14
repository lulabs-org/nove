import {
  MoreOutlined,
  AudioOutlined,
  VideoCameraOutlined,
  FileImageOutlined,
  DeleteOutlined,
  FileOutlined,
  FolderAddOutlined,
  FolderOpenOutlined,
  InboxOutlined,
  ReloadOutlined,
  RestOutlined,
} from '@ant-design/icons';
import Breadcrumb from 'antd/es/breadcrumb';
import Button from 'antd/es/button';
import Card from 'antd/es/card';
import Dropdown from 'antd/es/dropdown';
import Empty from 'antd/es/empty';
import Tooltip from 'antd/es/tooltip';
import type { MenuProps } from 'antd';
import { useAuth } from '../../../shared/hooks/useAuth';
import Input from 'antd/es/input';
import message from 'antd/es/message';
import Modal from 'antd/es/modal';
import Progress from 'antd/es/progress';
import Select from 'antd/es/select';
import Space from 'antd/es/space';
import Table from 'antd/es/table';
import Tag from 'antd/es/tag';
import Upload from 'antd/es/upload';
import { isAxiosError } from 'axios';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Perm } from '../../../app/guards/Perm';
import { PERMISSIONS } from '../../../shared/utils/permissions';
import { driveApi } from '../api/driveApi';
import { DriveDetailModal } from '../components/DriveDetailModal';
import { DrivePermissionModal } from '../components/DrivePermissionModal';
import type { DriveNode, DriveSpace } from '../model/types';
import './DrivePage.css';

const PART_SIZE = 16 * 1024 * 1024;
const MEDIA_EXTENSIONS = new Set(['mp3', 'm4a', 'wav', 'aac', 'ogg', 'mp4', 'mov', 'webm']);

function requiresCloudScan(fileName: string): boolean {
  const extension = fileName.split('.').pop()?.toLowerCase() ?? '';
  return !MEDIA_EXTENSIONS.has(extension);
}

async function calculateSha256(file: File): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
  return Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, '0')).join(
    ''
  );
}

function uploadErrorMessage(error: unknown, fileName: string): string {
  if (isAxiosError(error)) {
    const data = error.response?.data;
    if (data && typeof data === 'object' && 'message' in data && typeof data.message === 'string') {
      return data.message;
    }
  }
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return '无法连接 OSS，请检查 Bucket CORS 是否允许当前 Admin 来源并暴露 ETag';
  }
  return error instanceof Error ? error.message : `${fileName} 上传失败`;
}

function formatBytes(value: string | null) {
  if (!value) return '-';
  let size = Number(value);
  const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB'];
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size.toFixed(unit ? 1 : 0)} ${units[unit]}`;
}

export function DrivePage() {
  const { checkPermission } = useAuth();
  const [spaces, setSpaces] = useState<DriveSpace[]>([]);
  const [spaceId, setSpaceId] = useState<string>();
  const [nodes, setNodes] = useState<DriveNode[]>([]);
  const [path, setPath] = useState<DriveNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [trash, setTrash] = useState(false);
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState<Record<string, number>>({});
  const [detailNode, setDetailNode] = useState<DriveNode | null>(null);
  const [grantNode, setGrantNode] = useState<DriveNode | null>(null);

  const parentId = path.at(-1)?.id ?? null;

  const loadNodes = useCallback(async () => {
    if (!spaceId) return;
    setLoading(true);
    try {
      const result = trash
        ? await driveApi.listTrash(spaceId)
        : await driveApi.listNodes(spaceId, parentId);
      setNodes(result.items);
    } catch {
      message.error('读取云盘目录失败');
    } finally {
      setLoading(false);
    }
  }, [parentId, spaceId, trash]);

  useEffect(() => {
    driveApi
      .listSpaces()
      .then((items) => {
        setSpaces(items);
        setSpaceId((current) => current ?? items[0]?.id);
      })
      .catch(() => message.error('读取云盘空间失败'));
  }, []);

  useEffect(() => {
    void loadNodes();
  }, [loadNodes]);

  const visibleNodes = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return query ? nodes.filter((node) => node.name.toLocaleLowerCase().includes(query)) : nodes;
  }, [nodes, search]);

  const createFolder = () => {
    let name = '';
    Modal.confirm({
      title: '新建文件夹',
      content: (
        <Input
          autoFocus
          placeholder="文件夹名称"
          onChange={(event) => (name = event.target.value)}
        />
      ),
      onOk: async () => {
        if (!spaceId || !name.trim()) throw new Error('请输入文件夹名称');
        await driveApi.createFolder(spaceId, parentId, name.trim());
        message.success('文件夹已创建');
        await loadNodes();
      },
    });
  };

  const rename = (node: DriveNode) => {
    let name = node.name;
    Modal.confirm({
      title: '重命名',
      content: <Input defaultValue={node.name} onChange={(event) => (name = event.target.value)} />,
      onOk: async () => {
        await driveApi.rename(node.id, name.trim());
        message.success('重命名成功');
        await loadNodes();
      },
    });
  };

  const uploadFile = async (file: File) => {
    if (!spaceId) return;
    let sessionId: string | undefined;
    setUploading((current) => ({ ...current, [file.name]: 0 }));
    try {
      const checksumSha256 = requiresCloudScan(file.name) ? await calculateSha256(file) : undefined;
      setUploading((current) => ({ ...current, [file.name]: 5 }));
      const session = await driveApi.createUploadSession(spaceId, parentId, file, checksumSha256);
      sessionId = session.id;
      const partSize = session.recommendedPartSizeBytes || PART_SIZE;
      const count = Math.ceil(file.size / partSize);
      const numbers = Array.from({ length: count }, (_, index) => index + 1);
      const signed = await driveApi.signParts(session.id, numbers);
      const completed: Array<{ number: number; etag: string }> = [];
      for (const part of signed.parts) {
        const start = (part.partNumber - 1) * partSize;
        const response = await fetch(part.url, {
          method: 'PUT',
          body: file.slice(start, Math.min(file.size, start + partSize)),
        });
        if (!response.ok) throw new Error(`分片 ${part.partNumber} 上传失败`);
        const etag = response.headers.get('etag');
        if (!etag) throw new Error('OSS CORS 必须暴露 ETag 响应头');
        completed.push({ number: part.partNumber, etag });
        setUploading((current) => ({
          ...current,
          [file.name]: 5 + Math.round((completed.length / count) * 85),
        }));
      }
      setUploading((current) => ({ ...current, [file.name]: 95 }));
      await driveApi.completeUpload(session.id, completed);
      setUploading((current) => ({ ...current, [file.name]: 100 }));
      message.success(
        session.requiresMalwareScan
          ? `${file.name} 已上传，正在后台进行病毒扫描`
          : `${file.name} 上传并校验成功`
      );
      await loadNodes();
    } catch (error) {
      if (sessionId) await driveApi.abortUpload(sessionId).catch(() => undefined);
      message.error(uploadErrorMessage(error, file.name));
    } finally {
      window.setTimeout(
        () =>
          setUploading((current) => {
            const next = { ...current };
            delete next[file.name];
            return next;
          }),
        800
      );
    }
  };

  const download = async (node: DriveNode) => {
    if (!node.fileId) return;
    const result = await driveApi.createDownloadUrl(node.fileId);
    window.location.assign(result.url);
  };

  const openDetails = (node: DriveNode) => {
    setDetailNode(node);
  };

  const openGrants = (node: DriveNode) => {
    setGrantNode(node);
  };

  const moveNode = (node: DriveNode) => {
    let destination: string | null = null;
    Modal.confirm({
      title: '移动项目',
      content: (
        <Select
          defaultValue="__ROOT__"
          style={{ width: '100%' }}
          options={[
            { label: '空间根目录', value: '__ROOT__' },
            ...nodes
              .filter((item) => item.type === 'FOLDER' && item.id !== node.id)
              .map((item) => ({ label: item.name, value: item.id })),
          ]}
          onChange={(value) => {
            destination = value === '__ROOT__' ? null : value;
          }}
        />
      ),
      onOk: async () => {
        await driveApi.move(node.id, destination);
        message.success('移动成功');
        await loadNodes();
      },
    });
  };

  const rowMenu = (node: DriveNode): MenuProps['items'] => [
    { key: 'details', label: '查看详情', onClick: () => void openDetails(node) },
    ...(checkPermission(PERMISSIONS.DRIVE.UPDATE)
      ? [
          { key: 'rename', label: '重命名', onClick: () => rename(node) },
          { key: 'move', label: '移动到…', onClick: () => moveNode(node) },
        ]
      : []),
    ...(checkPermission(PERMISSIONS.DRIVE.MANAGE_ACL)
      ? [{ key: 'permissions', label: '管理权限', onClick: () => void openGrants(node) }]
      : []),
    ...(checkPermission(PERMISSIONS.DRIVE.DELETE)
      ? [
          {
            key: 'trash',
            label: '移至回收站',
            danger: true,
            icon: <DeleteOutlined />,
            onClick: async () => {
              await driveApi.trash(node.id);
              await loadNodes();
            },
          },
        ]
      : []),
  ];

  return (
    <div className="drive-page">
      <Card
        className="drive-surface"
        title={
          <div className="drive-heading">
            <span>{trash ? '回收站' : '文件列表'}</span>
            <span className="drive-count">{visibleNodes.length} 个项目</span>
          </div>
        }
        extra={
          <Space wrap className="drive-header-controls">
            <Select
              value={spaceId}
              className="drive-space-select"
              aria-label="选择云盘空间"
              options={spaces.map((item) => ({ label: item.name, value: item.id }))}
              onChange={(value) => {
                setSpaceId(value);
                setPath([]);
                setTrash(false);
              }}
            />
            <Input.Search
              allowClear
              className="drive-search"
              placeholder="搜索当前目录"
              onSearch={setSearch}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Tooltip title="刷新列表">
              <Button
                aria-label="刷新列表"
                type="text"
                icon={<ReloadOutlined spin={loading} />}
                onClick={() => void loadNodes()}
              />
            </Tooltip>
          </Space>
        }
      >
        <div className="drive-toolbar">
          <Breadcrumb
            items={[
              { title: <a onClick={() => setPath([])}>根目录</a> },
              ...path.map((node, index) => ({
                title: <a onClick={() => setPath(path.slice(0, index + 1))}>{node.name}</a>,
              })),
            ]}
          />
          <Space wrap className="drive-toolbar-actions">
            <Button
              icon={trash ? <FolderOpenOutlined /> : <RestOutlined />}
              onClick={() => setTrash((value) => !value)}
            >
              {trash ? '返回文件' : '回收站'}
            </Button>
            {!trash ? (
              <Perm permission={PERMISSIONS.DRIVE.UPLOAD}>
                <Button icon={<FolderAddOutlined />} onClick={createFolder}>
                  新建文件夹
                </Button>
                <Upload
                  multiple
                  showUploadList={false}
                  beforeUpload={(file) => {
                    void uploadFile(file);
                    return Upload.LIST_IGNORE;
                  }}
                >
                  <Button type="primary" icon={<InboxOutlined />}>
                    上传文件
                  </Button>
                </Upload>
              </Perm>
            ) : null}
          </Space>
        </div>

        {Object.entries(uploading).map(([name, percent]) => (
          <div className="drive-upload-progress" key={name}>
            <span>{name}</span>
            <Progress percent={percent} size="small" />
          </div>
        ))}

        <Table<DriveNode>
          rowKey="id"
          loading={loading}
          dataSource={visibleNodes}
          className="drive-table"
          tableLayout="fixed"
          scroll={{ x: 760 }}
          pagination={false}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  search
                    ? '没有匹配的文件'
                    : trash
                      ? '回收站为空'
                      : '当前目录为空，上传文件或新建文件夹开始使用'
                }
              />
            ),
          }}
          columns={[
            {
              title: '名称',
              dataIndex: 'name',
              ellipsis: true,
              render: (name: string, node) => (
                <button
                  className="drive-file-name"
                  title={name}
                  onClick={() =>
                    node.type === 'FOLDER' && !trash
                      ? setPath([...path, node])
                      : void openDetails(node)
                  }
                >
                  <span className={`drive-file-icon ${node.type === 'FOLDER' ? 'is-folder' : ''}`}>
                    {node.type === 'FOLDER' ? (
                      <FolderOpenOutlined />
                    ) : node.contentType?.startsWith('audio/') ? (
                      <AudioOutlined />
                    ) : node.contentType?.startsWith('video/') ? (
                      <VideoCameraOutlined />
                    ) : node.contentType?.startsWith('image/') ? (
                      <FileImageOutlined />
                    ) : (
                      <FileOutlined />
                    )}
                  </span>
                  <span className="drive-file-label">{name}</span>
                </button>
              ),
            },
            {
              title: '类型',
              dataIndex: 'contentType',
              width: 100,
              render: (value: string | null, node) =>
                node.type === 'FOLDER'
                  ? '文件夹'
                  : value?.startsWith('audio/')
                    ? '音频'
                    : value?.startsWith('video/')
                      ? '视频'
                      : value?.startsWith('image/')
                        ? '图片'
                        : node.name.match(/\.([^.]+)$/)?.[1].toUpperCase() || '文件',
            },
            { title: '大小', dataIndex: 'sizeBytes', width: 100, render: formatBytes },
            {
              title: '状态',
              dataIndex: 'fileStatus',
              width: 110,
              render: (value) =>
                value ? (
                  <Tag
                    bordered={false}
                    color={
                      value === 'ACTIVE' ? 'success' : value === 'REJECTED' ? 'error' : 'processing'
                    }
                  >
                    {value === 'ACTIVE' ? '可用' : value === 'REJECTED' ? '未通过' : '扫描中'}
                  </Tag>
                ) : (
                  <span className="drive-muted">—</span>
                ),
            },
            {
              title: '操作',
              width: trash ? 210 : 146,
              render: (_, node) =>
                trash ? (
                  <Space>
                    <Perm permission={PERMISSIONS.DRIVE.DELETE}>
                      <Button
                        onClick={async () => {
                          await driveApi.restore(node.id);
                          await loadNodes();
                        }}
                      >
                        恢复
                      </Button>
                    </Perm>
                    <Perm permission={PERMISSIONS.DRIVE.ADMIN}>
                      <Button
                        danger
                        onClick={async () => {
                          await driveApi.purgeTrash(node.id);
                          await loadNodes();
                        }}
                      >
                        永久清理
                      </Button>
                    </Perm>
                  </Space>
                ) : (
                  <Space size={4} className="drive-row-actions">
                    {node.fileId ? (
                      <Button
                        type="text"
                        size="small"
                        disabled={node.fileStatus !== 'ACTIVE'}
                        onClick={() => void download(node)}
                      >
                        下载
                      </Button>
                    ) : (
                      <Button type="text" size="small" onClick={() => setPath([...path, node])}>
                        打开
                      </Button>
                    )}
                    <Dropdown
                      menu={{ items: rowMenu(node) }}
                      trigger={['click']}
                      placement="bottomRight"
                    >
                      <Button
                        type="text"
                        size="small"
                        aria-label={`更多操作：${node.name}`}
                        icon={<MoreOutlined />}
                      />
                    </Dropdown>
                  </Space>
                ),
            },
          ]}
        />
      </Card>

      <DriveDetailModal
        node={detailNode}
        space={spaces.find((s) => s.id === (detailNode?.spaceId ?? spaceId))}
        path={path}
        open={Boolean(detailNode)}
        onClose={() => setDetailNode(null)}
        onOpenPermissions={(node) => {
          setDetailNode(null);
          openGrants(node);
        }}
        onDownload={(node) => void download(node)}
      />

      <DrivePermissionModal
        node={grantNode}
        space={spaces.find((s) => s.id === spaceId)}
        open={Boolean(grantNode)}
        onClose={() => setGrantNode(null)}
      />
    </div>
  );
}
