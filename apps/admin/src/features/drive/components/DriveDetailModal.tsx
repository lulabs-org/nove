import {
  ApartmentOutlined,
  AudioOutlined,
  BankOutlined,
  CheckCircleOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  CloudUploadOutlined,
  CopyOutlined,
  DatabaseOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  EyeOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  FileZipOutlined,
  FolderAddOutlined,
  FolderOpenOutlined,
  HistoryOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  RestOutlined,
  SafetyCertificateOutlined,
  SyncOutlined,
  UndoOutlined,
  UserOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import Avatar from 'antd/es/avatar';
import Badge from 'antd/es/badge';
import Button from 'antd/es/button';
import Empty from 'antd/es/empty';
import message from 'antd/es/message';
import Modal from 'antd/es/modal';
import Space from 'antd/es/space';
import Spin from 'antd/es/spin';
import Tabs from 'antd/es/tabs';
import Tag from 'antd/es/tag';
import Timeline from 'antd/es/timeline';
import Tooltip from 'antd/es/tooltip';
import dayjs from 'dayjs';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { driveApi } from '../api/driveApi';
import type { DriveNode, DriveSpace } from '../model/types';
import './DriveDetailModal.css';

export interface DriveDetailModalProps {
  node: DriveNode | null;
  space?: DriveSpace;
  path?: DriveNode[];
  open: boolean;
  onClose: () => void;
  onOpenPermissions?: (node: DriveNode) => void;
  onDownload?: (node: DriveNode) => void;
}

interface FileDetailState {
  version?: {
    version: number;
    contentType: string;
    sizeBytes: string;
    checksumSha256: string | null;
    status: string;
  };
  bindings: Array<{
    id: string;
    targetType: string;
    targetId: string;
    purpose: string;
    active: boolean;
  }>;
  audit: Array<{
    id: string;
    action: string;
    createdAt: string;
    actor: { username: string | null; email: string | null; id?: string } | null;
    metadata?: Record<string, unknown> | null;
  }>;
}

function formatBytes(value: string | null | undefined): string {
  if (!value) return '-';
  let size = Number(value);
  if (isNaN(size)) return '-';
  const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB'];
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size.toFixed(unit ? 1 : 0)} ${units[unit]}`;
}

function formatExactBytes(value: string | null | undefined): string {
  if (!value) return '';
  const num = Number(value);
  if (isNaN(num)) return '';
  return `${num.toLocaleString()} 字节`;
}

interface ActionMeta {
  label: string;
  color: string;
  icon: React.ReactNode;
}

const AUDIT_ACTION_MAP: Record<string, ActionMeta> = {
  CREATE_FOLDER: { label: '创建文件夹', color: 'success', icon: <FolderAddOutlined /> },
  UPLOAD_FILE: { label: '上传文件', color: 'blue', icon: <CloudUploadOutlined /> },
  RENAME_NODE: { label: '重命名', color: 'purple', icon: <EditOutlined /> },
  MOVE_NODE: { label: '移动位置', color: 'cyan', icon: <FolderOpenOutlined /> },
  TRASH_NODE: { label: '移入回收站', color: 'warning', icon: <RestOutlined /> },
  RESTORE_NODE: { label: '恢复文件', color: 'green', icon: <UndoOutlined /> },
  PURGE_TRASH: { label: '彻底删除', color: 'error', icon: <DeleteOutlined /> },
  PUT_GRANT: { label: '配置权限', color: 'gold', icon: <SafetyCertificateOutlined /> },
  DELETE_GRANT: { label: '移除权限', color: 'red', icon: <SafetyCertificateOutlined /> },
  DOWNLOAD: { label: '下载文件', color: 'blue', icon: <DownloadOutlined /> },
  VIEW: { label: '预览查看', color: 'default', icon: <EyeOutlined /> },
};

const BINDING_TARGET_MAP: Record<string, string> = {
  PRODUCT: '产品',
  MINUTE: '会议纪要',
  MEETING: '会议实体',
  ORGANIZATION: '企业组织',
  USER: '用户画像',
};

const BINDING_PURPOSE_MAP: Record<string, string> = {
  RECORDING: '会议原声录音',
  ATTACHMENT: '业务文档附件',
  TRANSCRIPT: '文本转写成果',
  SUMMARY: '会议纪要报告',
  AVATAR: '头像素材',
  COVER: '项目封面',
  PRODUCT_IMAGE: '产品图片',
  PRODUCT_VIDEO: '产品视频',
};

export function DriveDetailModal({
  node,
  space,
  path = [],
  open,
  onClose,
  onOpenPermissions,
  onDownload,
}: DriveDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'bindings' | 'audit'>('overview');
  const [details, setDetails] = useState<FileDetailState>({
    bindings: [],
    audit: [],
  });

  const loadDetails = useCallback(async (targetNode: DriveNode) => {
    setLoading(true);
    try {
      const [audit, file, bindings] = await Promise.all([
        driveApi.listAudit(targetNode.id),
        targetNode.fileId ? driveApi.getFile(targetNode.fileId) : Promise.resolve(null),
        targetNode.fileId ? driveApi.listBindings(targetNode.fileId) : Promise.resolve([]),
      ]);
      setDetails({
        version: file?.version,
        bindings,
        audit,
      });
    } catch {
      message.error('加载项目详情失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open && node) {
      setActiveTab('overview');
      void loadDetails(node);
    } else if (!open) {
      setDetails({ bindings: [], audit: [] });
      setCopiedKey(null);
    }
  }, [open, node, loadDetails]);

  const handleCopy = (text: string, key: string, label: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopiedKey(key);
        message.success(`已复制 ${label}`);
        setTimeout(() => {
          setCopiedKey((curr) => (curr === key ? null : curr));
        }, 1500);
      })
      .catch(() => {
        message.error('复制失败，请手动选择复制');
      });
  };

  const fileTypeIcon = useMemo(() => {
    if (!node) return null;
    if (node.type === 'FOLDER') {
      return (
        <div className="drive-detail-icon is-folder">
          <FolderOpenOutlined />
        </div>
      );
    }
    const contentType = node.contentType || details.version?.contentType || '';
    if (contentType.startsWith('audio/')) {
      return (
        <div className="drive-detail-icon is-audio">
          <AudioOutlined />
        </div>
      );
    }
    if (contentType.startsWith('video/')) {
      return (
        <div className="drive-detail-icon is-video">
          <VideoCameraOutlined />
        </div>
      );
    }
    if (contentType.startsWith('image/')) {
      return (
        <div className="drive-detail-icon is-image">
          <FileImageOutlined />
        </div>
      );
    }
    if (contentType.includes('pdf')) {
      return (
        <div className="drive-detail-icon is-pdf">
          <FilePdfOutlined />
        </div>
      );
    }
    if (
      contentType.includes('zip') ||
      contentType.includes('archive') ||
      contentType.includes('tar')
    ) {
      return (
        <div className="drive-detail-icon is-archive">
          <FileZipOutlined />
        </div>
      );
    }
    return (
      <div className="drive-detail-icon is-generic">
        <FileTextOutlined />
      </div>
    );
  }, [node, details.version?.contentType]);

  const pathDisplay = useMemo(() => {
    const spaceName = space?.name || '空间根目录';
    const folderNames = path.map((item) => item.name);
    return [spaceName, ...folderNames].join(' / ');
  }, [space, path]);

  if (!node) return null;

  const isFolder = node.type === 'FOLDER';
  const sizeFormatted = formatBytes(details.version?.sizeBytes || node.sizeBytes);
  const exactBytes = formatExactBytes(details.version?.sizeBytes || node.sizeBytes);

  return (
    <Modal
      open={open}
      footer={null}
      width={680}
      onCancel={onClose}
      className="drive-detail-modal"
      centered
      destroyOnHidden
    >
      {/* Modal Header */}
      <div className="drive-detail-header">
        {fileTypeIcon}
        <div className="drive-detail-header-info">
          <div className="drive-detail-title-row">
            <h2 className="drive-detail-name" title={node.name}>
              {node.name}
            </h2>
            <Button
              type="text"
              size="small"
              className="drive-detail-copy-name-btn"
              icon={copiedKey === 'name' ? <CheckOutlined /> : <CopyOutlined />}
              onClick={() => handleCopy(node.name, 'name', '名称')}
              title="复制名称"
            />
          </div>
          <div className="drive-detail-meta-line">
            <Tag color={isFolder ? 'gold' : 'blue'} className="drive-detail-type-tag">
              {isFolder ? '文件夹' : node.contentType || details.version?.contentType || '文件'}
            </Tag>
            {!isFolder && (
              <span className="drive-detail-size-chip">
                {sizeFormatted}
                {exactBytes && ` (${exactBytes})`}
              </span>
            )}
            <span className="drive-detail-breadcrumb" title={`路径：${pathDisplay}`}>
              <FolderOpenOutlined /> {pathDisplay}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Spin spinning={loading} tip="正在同步详情...">
        <Tabs
          activeKey={activeTab}
          onChange={(k) => setActiveTab(k as typeof activeTab)}
          className="drive-detail-tabs"
          items={[
            {
              key: 'overview',
              label: '基本属性',
              children: (
                <div className="drive-detail-overview">
                  {/* Storage & Specification Section */}
                  <div className="drive-detail-card">
                    <div className="drive-detail-card-title">
                      <DatabaseOutlined /> 规格与位置
                    </div>
                    <div className="drive-detail-grid">
                      <div className="drive-detail-grid-item">
                        <span className="drive-detail-label">所属空间</span>
                        <span className="drive-detail-value">
                          <Space size={6}>
                            {space?.type === 'ORG' ? <ApartmentOutlined /> : <BankOutlined />}
                            <strong>{space?.name || '默认空间'}</strong>
                          </Space>
                        </span>
                      </div>

                      <div className="drive-detail-grid-item">
                        <span className="drive-detail-label">项目类型</span>
                        <span className="drive-detail-value">
                          {isFolder ? (
                            <Tag color="gold">文件夹目录</Tag>
                          ) : (
                            <Tag color="cyan">
                              {node.contentType || details.version?.contentType || '未知格式'}
                            </Tag>
                          )}
                        </span>
                      </div>

                      {!isFolder && (
                        <div className="drive-detail-grid-item">
                          <span className="drive-detail-label">存储大小</span>
                          <span className="drive-detail-value">
                            <strong>{sizeFormatted}</strong>
                            {exactBytes && (
                              <span className="drive-detail-subtext"> ({exactBytes})</span>
                            )}
                          </span>
                        </div>
                      )}

                      {!isFolder && (
                        <div className="drive-detail-grid-item">
                          <span className="drive-detail-label">文件版本</span>
                          <span className="drive-detail-value">
                            {details.version ? (
                              <Tag color="purple">v{details.version.version} (最新)</Tag>
                            ) : (
                              'v1'
                            )}
                          </span>
                        </div>
                      )}

                      <div className="drive-detail-grid-item">
                        <span className="drive-detail-label">可用状态</span>
                        <span className="drive-detail-value">
                          {node.fileStatus === 'ACTIVE' || (!node.fileStatus && !isFolder) ? (
                            <Tag color="success" icon={<CheckCircleOutlined />}>
                              正常可用
                            </Tag>
                          ) : node.fileStatus === 'VERIFYING' ? (
                            <Tag color="processing" icon={<SyncOutlined spin />}>
                              安全校验中
                            </Tag>
                          ) : node.fileStatus === 'REJECTED' ? (
                            <Tag color="error" icon={<CloseCircleOutlined />}>
                              已拦截 / 违规
                            </Tag>
                          ) : (
                            <Tag color="default">正常</Tag>
                          )}
                        </span>
                      </div>

                      <div className="drive-detail-grid-item">
                        <span className="drive-detail-label">权限策略</span>
                        <span className="drive-detail-value">
                          {node.inheritAcl ? (
                            <Tag color="blue">继承空间权限</Tag>
                          ) : (
                            <Tag color="geekblue">独立自定义 ACL</Tag>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Identifiers & Security Section */}
                  <div className="drive-detail-card">
                    <div className="drive-detail-card-title">
                      <SafetyCertificateOutlined /> 标识与安全校验
                    </div>
                    <div className="drive-detail-grid">
                      <div className="drive-detail-grid-item full-row">
                        <span className="drive-detail-label">节点标识 (Node ID)</span>
                        <div className="drive-detail-code-row">
                          <code className="drive-detail-code">{node.id}</code>
                          <Button
                            type="text"
                            size="small"
                            icon={copiedKey === 'nodeId' ? <CheckOutlined /> : <CopyOutlined />}
                            onClick={() => handleCopy(node.id, 'nodeId', 'Node ID')}
                          />
                        </div>
                      </div>

                      {node.fileId && (
                        <div className="drive-detail-grid-item full-row">
                          <span className="drive-detail-label">物理存储标识 (File ID)</span>
                          <div className="drive-detail-code-row">
                            <code className="drive-detail-code">{node.fileId}</code>
                            <Button
                              type="text"
                              size="small"
                              icon={copiedKey === 'fileId' ? <CheckOutlined /> : <CopyOutlined />}
                              onClick={() => handleCopy(node.fileId!, 'fileId', 'File ID')}
                            />
                          </div>
                        </div>
                      )}

                      {!isFolder && (
                        <div className="drive-detail-grid-item full-row">
                          <span className="drive-detail-label">
                            SHA-256 完整性校验和
                            <Tooltip title="基于文件二进制内容的防篡改加密哈希">
                              <InfoCircleOutlined style={{ marginLeft: 6, color: '#94a3b8' }} />
                            </Tooltip>
                          </span>
                          <div className="drive-detail-code-row">
                            <code className="drive-detail-code hash-code">
                              {details.version?.checksumSha256 || '未记录哈希'}
                            </code>
                            {details.version?.checksumSha256 && (
                              <Button
                                type="text"
                                size="small"
                                icon={copiedKey === 'sha256' ? <CheckOutlined /> : <CopyOutlined />}
                                onClick={() =>
                                  handleCopy(details.version!.checksumSha256!, 'sha256', 'SHA-256')
                                }
                              />
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Lifecycle & Timestamps Section */}
                  <div className="drive-detail-card">
                    <div className="drive-detail-card-title">
                      <ClockCircleOutlined /> 时间与生命周期
                    </div>
                    <div className="drive-detail-grid">
                      <div className="drive-detail-grid-item">
                        <span className="drive-detail-label">创建时间</span>
                        <span className="drive-detail-value">
                          {node.createdAt
                            ? dayjs(node.createdAt).format('YYYY-MM-DD HH:mm:ss')
                            : '-'}
                        </span>
                      </div>
                      <div className="drive-detail-grid-item">
                        <span className="drive-detail-label">最近更新</span>
                        <span className="drive-detail-value">
                          {node.updatedAt
                            ? dayjs(node.updatedAt).format('YYYY-MM-DD HH:mm:ss')
                            : '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ),
            },
            {
              key: 'bindings',
              label: (
                <span>
                  业务关联
                  {details.bindings.length > 0 && (
                    <Badge count={details.bindings.length} className="drive-detail-tab-badge" />
                  )}
                </span>
              ),
              children: (
                <div className="drive-detail-tab-pane">
                  {details.bindings.length === 0 ? (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="无业务关联"
                      className="drive-detail-empty"
                    >
                      <span className="drive-detail-empty-desc">
                        当前项目未绑定任何会议录音、转写纪要或组织业务实体
                      </span>
                    </Empty>
                  ) : (
                    <div className="drive-detail-bindings-list">
                      {details.bindings.map((item) => (
                        <div key={item.id} className="drive-detail-binding-card">
                          <div className="drive-detail-binding-head">
                            <Space size={8}>
                              <Tag color="cyan">
                                {BINDING_TARGET_MAP[item.targetType] || item.targetType}
                              </Tag>
                              {item.purpose && (
                                <Tag color="blue">
                                  {BINDING_PURPOSE_MAP[item.purpose] || item.purpose}
                                </Tag>
                              )}
                              <Tag color={item.active ? 'success' : 'default'}>
                                {item.active ? '生效中' : '已归档'}
                              </Tag>
                            </Space>
                          </div>
                          <div className="drive-detail-binding-body">
                            <div className="drive-detail-binding-field">
                              <span className="label">关联目标 ID：</span>
                              <code>{item.targetId}</code>
                              <Button
                                type="text"
                                size="small"
                                icon={
                                  copiedKey === item.targetId ? <CheckOutlined /> : <CopyOutlined />
                                }
                                onClick={() => handleCopy(item.targetId, item.targetId, '目标 ID')}
                              />
                            </div>
                            <div className="drive-detail-binding-field">
                              <span className="label">关联记录 ID：</span>
                              <code>{item.id}</code>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ),
            },
            {
              key: 'audit',
              label: (
                <span>
                  审计记录
                  {details.audit.length > 0 && (
                    <Badge count={details.audit.length} className="drive-detail-tab-badge" />
                  )}
                </span>
              ),
              children: (
                <div className="drive-detail-tab-pane">
                  {details.audit.length === 0 ? (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="暂无审计记录"
                      className="drive-detail-empty"
                    />
                  ) : (
                    <div className="drive-detail-timeline-container">
                      <Timeline
                        items={details.audit.map((item) => {
                          const meta = AUDIT_ACTION_MAP[item.action] || {
                            label: item.action,
                            color: 'blue',
                            icon: <HistoryOutlined />,
                          };
                          const actorName =
                            item.actor?.username ||
                            item.actor?.email ||
                            (item.actor?.id ? `用户 (${item.actor.id.slice(0, 8)})` : '系统操作');
                          return {
                            icon: <span className="drive-detail-timeline-dot">{meta.icon}</span>,
                            content: (
                              <div className="drive-detail-audit-item">
                                <div className="drive-detail-audit-top">
                                  <Tag color={meta.color} className="drive-detail-action-tag">
                                    {meta.label}
                                  </Tag>
                                  <span className="drive-detail-audit-time">
                                    {dayjs(item.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                                  </span>
                                </div>
                                <div className="drive-detail-audit-actor">
                                  <Avatar
                                    size={20}
                                    icon={<UserOutlined />}
                                    className="drive-detail-actor-avatar"
                                  />
                                  <span className="drive-detail-actor-name">{actorName}</span>
                                  {item.actor?.email && item.actor?.username && (
                                    <span className="drive-detail-actor-email">
                                      ({item.actor.email})
                                    </span>
                                  )}
                                </div>
                                {item.metadata && Object.keys(item.metadata).length > 0 && (
                                  <div className="drive-detail-audit-meta">
                                    <pre>{JSON.stringify(item.metadata, null, 2)}</pre>
                                  </div>
                                )}
                              </div>
                            ),
                          };
                        })}
                      />
                    </div>
                  )}
                </div>
              ),
            },
          ]}
        />
      </Spin>

      {/* Footer Controls */}
      <div className="drive-detail-footer">
        <div className="drive-detail-footer-left">
          {!isFolder && onDownload && (
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={() => onDownload(node)}
              className="drive-detail-action-btn"
            >
              下载文件
            </Button>
          )}
          {onOpenPermissions && (
            <Button
              icon={<SafetyCertificateOutlined />}
              onClick={() => onOpenPermissions(node)}
              className="drive-detail-action-btn"
            >
              管理权限
            </Button>
          )}
          <Tooltip title="刷新最新信息">
            <Button
              icon={<ReloadOutlined spin={loading} />}
              onClick={() => void loadDetails(node)}
            />
          </Tooltip>
        </div>
        <div className="drive-detail-footer-right">
          <Button onClick={onClose}>关闭</Button>
        </div>
      </div>
    </Modal>
  );
}
