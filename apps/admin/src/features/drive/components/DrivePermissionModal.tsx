import {
  ApartmentOutlined,
  BankOutlined,
  CheckCircleOutlined,
  CrownOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  StopOutlined,
  UserOutlined,
} from '@ant-design/icons';
import Alert from 'antd/es/alert';
import Avatar from 'antd/es/avatar';
import Button from 'antd/es/button';
import Checkbox from 'antd/es/checkbox';
import Empty from 'antd/es/empty';
import Input from 'antd/es/input';
import message from 'antd/es/message';
import Modal from 'antd/es/modal';
import Popconfirm from 'antd/es/popconfirm';
import Popover from 'antd/es/popover';
import Radio from 'antd/es/radio';
import Segmented from 'antd/es/segmented';
import Select from 'antd/es/select';
import Spin from 'antd/es/spin';
import Tag from 'antd/es/tag';
import Tooltip from 'antd/es/tooltip';
import TreeSelect from 'antd/es/tree-select';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../../shared/hooks/useAuth';
import type { DepartmentTreeDto, RoleDto } from '../../../shared/lib/api/orval/business/schemas';
import { orgMemberApi, type OrgMember } from '../../organization/members/api/orgMemberApi';
import { driveApi } from '../api/driveApi';
import type { DriveNode, DriveSpace } from '../model/types';
import './DrivePermissionModal.css';

export interface DrivePermissionModalProps {
  node: DriveNode | null;
  space: DriveSpace | undefined;
  open: boolean;
  onClose: () => void;
}

interface GrantRecord {
  id: string;
  principalType: string;
  principalId: string;
  effect: string;
  actions: string[];
}

const ACTION_LABELS: Record<string, { label: string; desc: string }> = {
  VIEW: { label: '预览', desc: '查看文件内容' },
  DOWNLOAD: { label: '下载', desc: '下载原始文件' },
  UPLOAD: { label: '上传', desc: '在此处添加新文件' },
  RENAME: { label: '重命名', desc: '修改名称' },
  MOVE: { label: '移动', desc: '移动文件位置' },
  SHARE: { label: '分享', desc: '创建共享链接' },
  DELETE: { label: '删除', desc: '移入回收站' },
  MANAGE_ACL: { label: '管理权限', desc: '修改访问控制' },
};

const ACTION_CATEGORIES = [
  {
    title: '读取权限',
    actions: ['VIEW', 'DOWNLOAD'],
  },
  {
    title: '写入操作',
    actions: ['UPLOAD', 'RENAME', 'MOVE'],
  },
  {
    title: '管理与处置',
    actions: ['SHARE', 'DELETE', 'MANAGE_ACL'],
  },
];

const PRESETS = {
  READONLY: {
    key: 'READONLY',
    label: '只读',
    icon: <EyeOutlined />,
    actions: ['VIEW', 'DOWNLOAD'],
  },
  EDITABLE: {
    key: 'EDITABLE',
    label: '读写协作',
    icon: <EditOutlined />,
    actions: ['VIEW', 'DOWNLOAD', 'UPLOAD', 'RENAME', 'MOVE'],
  },
  FULL_CONTROL: {
    key: 'FULL_CONTROL',
    label: '完全控制',
    icon: <CrownOutlined />,
    actions: ['VIEW', 'DOWNLOAD', 'UPLOAD', 'RENAME', 'MOVE', 'SHARE', 'DELETE', 'MANAGE_ACL'],
  },
};

type PresetKey = 'READONLY' | 'EDITABLE' | 'FULL_CONTROL' | 'CUSTOM';

export function DrivePermissionModal({ node, space, open, onClose }: DrivePermissionModalProps) {
  const { user } = useAuth();
  const orgId = space?.orgId || user?.currentOrgId;

  const [grants, setGrants] = useState<GrantRecord[]>([]);
  const [loadingGrants, setLoadingGrants] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Organization directory cache
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [departments, setDepartments] = useState<DepartmentTreeDto[]>([]);
  const [loadingOrgData, setLoadingOrgData] = useState(false);

  // Add grant form state
  const [principalType, setPrincipalType] = useState<'USER' | 'ROLE' | 'DEPARTMENT' | 'ORG'>(
    'USER'
  );
  const [selectedPrincipalId, setSelectedPrincipalId] = useState<string>('');
  const [manualInput, setManualInput] = useState(false);
  const [effect, setEffect] = useState<'ALLOW' | 'DENY'>('ALLOW');
  const [preset, setPreset] = useState<PresetKey>('READONLY');
  const [actions, setActions] = useState<string[]>(PRESETS.READONLY.actions);

  // Load grants
  const loadGrants = useCallback(async () => {
    if (!node) return;
    setLoadingGrants(true);
    try {
      const data = await driveApi.listGrants(node.id);
      setGrants(data);
    } catch (error) {
      console.error('Failed to load drive grants:', error);
      message.error('加载权限列表失败');
    } finally {
      setLoadingGrants(false);
    }
  }, [node]);

  // Load org directory options
  const loadOrgData = useCallback(async () => {
    if (!orgId) return;
    setLoadingOrgData(true);
    try {
      const [membersRes, rolesRes, deptsRes] = await Promise.allSettled([
        orgMemberApi.list(orgId, { page: 1, pageSize: 100 }),
        orgMemberApi.roles(),
        orgMemberApi.departments(orgId),
      ]);

      if (membersRes.status === 'fulfilled') {
        setMembers(membersRes.value.data);
      }
      if (rolesRes.status === 'fulfilled') {
        setRoles(rolesRes.value);
      }
      if (deptsRes.status === 'fulfilled') {
        setDepartments(deptsRes.value);
      }
    } catch (error) {
      console.error('Failed to load org options for drive ACL:', error);
    } finally {
      setLoadingOrgData(false);
    }
  }, [orgId]);

  useEffect(() => {
    if (open && node) {
      void loadGrants();
      void loadOrgData();
      // Reset form
      setPrincipalType('USER');
      setSelectedPrincipalId('');
      setManualInput(false);
      setEffect('ALLOW');
      setPreset('READONLY');
      setActions(PRESETS.READONLY.actions);
    }
  }, [open, node, loadGrants, loadOrgData]);

  // If ORG selected, auto bind orgId
  useEffect(() => {
    if (principalType === 'ORG' && orgId) {
      setSelectedPrincipalId(orgId);
    } else if (principalType !== 'ORG' && selectedPrincipalId === orgId && !manualInput) {
      setSelectedPrincipalId('');
    }
  }, [principalType, orgId, selectedPrincipalId, manualInput]);

  // Flatten departments for lookup
  const deptMap = useMemo(() => {
    const map = new Map<string, string>();
    const walk = (items: DepartmentTreeDto[]) => {
      for (const item of items) {
        map.set(item.id, item.name);
        if (item.children?.length) {
          walk(item.children);
        }
      }
    };
    walk(departments);
    return map;
  }, [departments]);

  // TreeSelect data structure
  const deptTreeData = useMemo(() => {
    interface DeptTreeNode {
      title: string;
      value: string;
      key: string;
      children?: DeptTreeNode[];
    }
    const mapTree = (items: DepartmentTreeDto[]): DeptTreeNode[] =>
      items.map((item) => ({
        title: item.name,
        value: item.id,
        key: item.id,
        children: item.children?.length ? mapTree(item.children) : undefined,
      }));
    return mapTree(departments);
  }, [departments]);

  const roleMap = useMemo(() => {
    return new Map(roles.map((r) => [r.id, r.name]));
  }, [roles]);

  const userMap = useMemo(() => {
    return new Map(
      members.map((m) => [
        m.userId,
        {
          name: m.user?.profile?.displayName || m.user?.username || m.user?.email || m.userId,
          email: m.user?.email || '',
          avatar: m.user?.profile?.avatar,
        },
      ])
    );
  }, [members]);

  // Resolve principal display details
  const resolvePrincipal = (principalType: string, principalId: string) => {
    if (principalType === 'ORG') {
      return {
        name: '全员 (全体组织成员)',
        typeDesc: '组织全员',
        avatarClass: 'is-org',
        icon: <BankOutlined />,
      };
    }
    if (principalType === 'DEPARTMENT') {
      const deptName = deptMap.get(principalId) || `部门 ${principalId}`;
      return {
        name: deptName,
        typeDesc: '组织部门',
        avatarClass: 'is-dept',
        icon: <ApartmentOutlined />,
      };
    }
    if (principalType === 'ROLE') {
      const roleName = roleMap.get(principalId) || `角色 ${principalId}`;
      return {
        name: roleName,
        typeDesc: '组织角色',
        avatarClass: 'is-role',
        icon: <SafetyCertificateOutlined />,
      };
    }
    // USER or ORG_MEMBER
    const userInfo = userMap.get(principalId);
    if (userInfo) {
      return {
        name: userInfo.name,
        typeDesc: userInfo.email ? `${userInfo.email}` : '组织成员',
        avatar: userInfo.avatar,
        avatarClass: 'is-user',
        icon: <UserOutlined />,
      };
    }
    return {
      name: principalId,
      typeDesc: principalType === 'USER' ? '指定用户' : '成员主体',
      avatarClass: 'is-user',
      icon: <UserOutlined />,
    };
  };

  const handleSelectPreset = (key: PresetKey) => {
    setPreset(key);
    if (key !== 'CUSTOM') {
      setActions(PRESETS[key].actions);
    }
  };

  const handleActionChange = (checkedValues: string[]) => {
    setActions(checkedValues);
    const sorted = [...checkedValues].sort().join(',');
    if (sorted === [...PRESETS.READONLY.actions].sort().join(',')) {
      setPreset('READONLY');
    } else if (sorted === [...PRESETS.EDITABLE.actions].sort().join(',')) {
      setPreset('EDITABLE');
    } else if (sorted === [...PRESETS.FULL_CONTROL.actions].sort().join(',')) {
      setPreset('FULL_CONTROL');
    } else {
      setPreset('CUSTOM');
    }
  };

  const handleSubmit = async () => {
    if (!node) return;
    const targetId = selectedPrincipalId.trim();
    if (!targetId) {
      message.warning('请选择或输入授权主体');
      return;
    }
    if (actions.length === 0) {
      message.warning('请至少勾选一项操作权限');
      return;
    }

    setSubmitting(true);
    try {
      await driveApi.putGrant(node.id, {
        principalType,
        principalId: targetId,
        effect,
        actions,
      });
      message.success('授权规则已生效');
      if (principalType !== 'ORG') {
        setSelectedPrincipalId('');
      }
      await loadGrants();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const errorMsg = err.response?.data?.message || '保存授权失败';
      message.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGrant = async (grantId: string) => {
    if (!node) return;
    setDeletingId(grantId);
    try {
      await driveApi.deleteGrant(node.id, grantId);
      message.success('已撤销授权规则');
      await loadGrants();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      message.error(err.response?.data?.message || '删除授权失败');
    } finally {
      setDeletingId(null);
    }
  };

  const isFolder = node?.type === 'FOLDER';

  return (
    <Modal
      className="drive-perm-modal"
      open={open}
      title={null}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8 }}>
          <Button type="primary" onClick={onClose}>
            完成
          </Button>
        </div>
      }
      onCancel={onClose}
      width={680}
      destroyOnHidden
    >
      {/* Header Info */}
      <div className="drive-perm-header">
        <div className={isFolder ? 'drive-perm-icon is-folder' : 'drive-perm-icon'}>
          {isFolder ? <FolderOpenOutlined /> : <FileTextOutlined />}
        </div>
        <div className="drive-perm-title-area">
          <div className="drive-perm-node-title">
            <Tooltip title={node?.name}>
              <span>{node?.name ?? '文件权限管理'}</span>
            </Tooltip>
            <Tag color={isFolder ? 'gold' : 'blue'}>{isFolder ? '文件夹' : '文件'}</Tag>
            <Popover
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                  <InfoCircleOutlined style={{ color: '#2563eb' }} />
                  <span>权限判定规则说明</span>
                </div>
              }
              content={
                <div style={{ maxWidth: 280, fontSize: 13, lineHeight: 1.6, color: '#475569' }}>
                  <div style={{ marginBottom: 6 }}>• 组织成员默认具备基础只读与查看权限。</div>
                  <div>
                    • 若配置了{' '}
                    <span style={{ color: '#dc2626', fontWeight: 600 }}>「显式拒绝 (DENY)」</span>
                    ，其优先级高于任何允许或继承规则，将直接阻断对应操作。
                  </div>
                </div>
              }
              trigger="click"
              placement="bottomLeft"
            >
              <Tooltip title="点击查看权限判定规则说明">
                <Button
                  type="text"
                  shape="circle"
                  size="small"
                  className="drive-perm-help-btn"
                  icon={<QuestionCircleOutlined style={{ fontSize: 14, color: '#94a3b8' }} />}
                  aria-label="查看权限判定规则说明"
                />
              </Tooltip>
            </Popover>
          </div>
          <div className="drive-perm-node-subtitle">
            {space?.name ? `所属空间：${space.name}` : '云盘资源'} ·{' '}
            {node?.inheritAcl ? '已开启父级权限继承' : '独立权限控制'}
          </div>
        </div>
      </div>

      {/* Section 1: Add New Grant */}
      <div className="drive-perm-section">
        <div className="drive-perm-section-title">
          <span>新增授权规则</span>
          <SettingOutlined style={{ color: '#94a3b8' }} />
        </div>

        {/* 1. Principal Type & Selector */}
        <div className="drive-perm-form-item">
          <div className="drive-perm-form-label">
            <span>授权对象类型与主体</span>
            <span className="toggle-btn" onClick={() => setManualInput((prev) => !prev)}>
              {manualInput ? '切换为下拉选择' : '手动输入 ID'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
            <Segmented
              block
              value={principalType}
              onChange={(val) => setPrincipalType(val as typeof principalType)}
              options={[
                { label: '组织成员', value: 'USER', icon: <UserOutlined /> },
                { label: '组织角色', value: 'ROLE', icon: <SafetyCertificateOutlined /> },
                { label: '部门层级', value: 'DEPARTMENT', icon: <ApartmentOutlined /> },
                { label: '全体成员', value: 'ORG', icon: <BankOutlined /> },
              ]}
            />

            {manualInput ? (
              <Input
                placeholder={`请输入 ${principalType} 唯一 ID (如 cuid 或 uuid)`}
                value={selectedPrincipalId}
                onChange={(e) => setSelectedPrincipalId(e.target.value)}
              />
            ) : principalType === 'ORG' ? (
              <Alert
                type="info"
                showIcon
                title="当前机构全体成员"
                description="该规则将对当前组织内的所有成员生效。"
              />
            ) : principalType === 'ROLE' ? (
              <Select
                style={{ width: '100%' }}
                placeholder="请选择组织角色"
                loading={loadingOrgData}
                value={selectedPrincipalId || undefined}
                onChange={setSelectedPrincipalId}
                options={roles.map((r) => ({
                  value: r.id,
                  label: `${r.name} (${r.code})`,
                }))}
                showSearch
                optionFilterProp="label"
              />
            ) : principalType === 'DEPARTMENT' ? (
              <TreeSelect
                style={{ width: '100%' }}
                placeholder="请选择部门"
                treeData={deptTreeData}
                value={selectedPrincipalId || undefined}
                onChange={setSelectedPrincipalId}
                treeDefaultExpandAll
                allowClear
              />
            ) : (
              <Select
                style={{ width: '100%' }}
                placeholder="搜索并选择成员 (支持按用户名/邮箱/昵称搜索)"
                loading={loadingOrgData}
                value={selectedPrincipalId || undefined}
                onChange={setSelectedPrincipalId}
                showSearch
                filterOption={(input, option) =>
                  String(option?.label ?? '')
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                options={members.map((m) => {
                  const displayName =
                    m.user?.profile?.displayName || m.user?.username || m.user?.email || m.userId;
                  const emailStr = m.user?.email ? ` · ${m.user.email}` : '';
                  return {
                    value: m.userId,
                    label: `${displayName}${emailStr}`,
                  };
                })}
              />
            )}
          </div>
        </div>

        {/* 2. Effect Selector */}
        <div className="drive-perm-form-item">
          <div className="drive-perm-form-label">判定效力 (Effect)</div>
          <Radio.Group
            value={effect}
            onChange={(e) => setEffect(e.target.value)}
            buttonStyle="solid"
          >
            <Radio.Button value="ALLOW">
              <span style={{ color: effect === 'ALLOW' ? '#fff' : '#16a34a' }}>
                <CheckCircleOutlined /> 允许 (ALLOW)
              </span>
            </Radio.Button>
            <Radio.Button value="DENY">
              <span style={{ color: effect === 'DENY' ? '#fff' : '#dc2626' }}>
                <StopOutlined /> 显式拒绝 (DENY)
              </span>
            </Radio.Button>
          </Radio.Group>
        </div>

        {/* 3. Actions & Presets */}
        <div className="drive-perm-form-item">
          <div className="drive-perm-form-label">
            <span>权限范围 (Actions)</span>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>已选 {actions.length} 项</span>
          </div>

          <div className="drive-perm-presets">
            {(Object.keys(PRESETS) as Array<keyof typeof PRESETS>).map((key) => (
              <Button
                key={key}
                className="drive-perm-preset-btn"
                type={preset === key ? 'primary' : 'default'}
                icon={PRESETS[key].icon}
                onClick={() => handleSelectPreset(key)}
              >
                {PRESETS[key].label}
              </Button>
            ))}
            <Button
              className="drive-perm-preset-btn"
              type={preset === 'CUSTOM' ? 'primary' : 'dashed'}
              onClick={() => setPreset('CUSTOM')}
            >
              自定义
            </Button>
          </div>

          <Checkbox.Group
            style={{ width: '100%' }}
            value={actions}
            onChange={(vals) => handleActionChange(vals as string[])}
          >
            <div className="drive-perm-actions-grid">
              {ACTION_CATEGORIES.map((cat) => (
                <div key={cat.title} className="drive-perm-action-category">
                  <div className="drive-perm-action-category-title">{cat.title}</div>
                  {cat.actions.map((act) => (
                    <Checkbox key={act} value={act}>
                      <Tooltip title={ACTION_LABELS[act]?.desc}>
                        <span>{ACTION_LABELS[act]?.label || act}</span>
                      </Tooltip>
                    </Checkbox>
                  ))}
                </div>
              ))}
            </div>
          </Checkbox.Group>
        </div>

        {/* Submit button */}
        <div className="drive-perm-submit-row">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            loading={submitting}
            onClick={handleSubmit}
          >
            添加授权规则
          </Button>
        </div>
      </div>

      {/* Section 2: Existing Grants */}
      <div className="drive-perm-section">
        <div className="drive-perm-section-title">
          <span>已配置的显式授权</span>
          <span className="badge-count">{grants.length} 条规则</span>
        </div>

        {loadingGrants ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: '#64748b' }}>
            <Spin />
            <div style={{ marginTop: 8, fontSize: 13 }}>正在加载权限规则...</div>
          </div>
        ) : grants.length === 0 ? (
          <Empty
            className="drive-perm-empty"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="当前节点暂无显式自定义授权，直接继承上级目录或空间默认权限"
          />
        ) : (
          <div className="drive-perm-grants-list">
            {grants.map((grant) => {
              const info = resolvePrincipal(grant.principalType, grant.principalId);
              const isAllow = grant.effect === 'ALLOW';
              return (
                <div key={grant.id} className="drive-perm-grant-item">
                  <div className="drive-perm-grant-principal">
                    <Avatar
                      className={`drive-perm-grant-avatar ${info.avatarClass}`}
                      src={info.avatar}
                      icon={info.icon}
                    />
                    <div className="drive-perm-grant-info">
                      <Tooltip title={info.name}>
                        <div className="drive-perm-grant-name">{info.name}</div>
                      </Tooltip>
                      <div className="drive-perm-grant-type">{info.typeDesc}</div>
                    </div>
                  </div>

                  <div className="drive-perm-grant-rights">
                    <Tag
                      color={isAllow ? 'success' : 'error'}
                      icon={isAllow ? <CheckCircleOutlined /> : <StopOutlined />}
                    >
                      {isAllow ? '允许' : '显式拒绝'}
                    </Tag>

                    <div className="drive-perm-grant-actions-tags">
                      {grant.actions.map((act) => (
                        <Tag key={act} variant="filled">
                          {ACTION_LABELS[act]?.label || act}
                        </Tag>
                      ))}
                    </div>

                    <Popconfirm
                      title="确定撤销此授权规则？"
                      description="撤销后该主体将恢复使用默认继承权限。"
                      okText="确认撤销"
                      cancelText="取消"
                      okButtonProps={{ danger: true }}
                      onConfirm={() => handleDeleteGrant(grant.id)}
                    >
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        loading={deletingId === grant.id}
                      />
                    </Popconfirm>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}
