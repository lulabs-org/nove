import {
  AppstoreOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import Alert from 'antd/es/alert';
import Button from 'antd/es/button';
import Checkbox from 'antd/es/checkbox';
import Input from 'antd/es/input';
import Result from 'antd/es/result';
import Select from 'antd/es/select';
import Spin from 'antd/es/spin';
import Tag from 'antd/es/tag';
import Typography from 'antd/es/typography';
import message from 'antd/es/message';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useAuthStore } from '../model/authStore';
import {
  approveOAuthAuthorizationRequest,
  denyOAuthAuthorizationRequest,
  getOAuthAuthorizationRequest,
  type OAuthAuthorizationRequest,
  type OAuthPermission,
} from './api';
import './OAuthConsentPage.css';

const DANGEROUS_ACTIONS = new Set(['create', 'update', 'delete', 'import', 'write']);
const RESOURCE_LABELS: Record<string, string> = {
  meeting: '会议',
  minute: '妙记',
  'speaker-summary': '发言人总结',
  'tracking-report': '长期追踪报告',
  user: '用户',
};

function isDefaultPermission(permission: OAuthPermission) {
  return permission.action === 'read' || permission.action === 'stats_view';
}

function groupPermissions(permissions: OAuthPermission[]) {
  return permissions.reduce<Record<string, OAuthPermission[]>>((groups, permission) => {
    (groups[permission.resource] ??= []).push(permission);
    return groups;
  }, {});
}

export function OAuthConsentPage() {
  const [searchParams] = useSearchParams();
  const requestId = searchParams.get('request_id');
  const user = useAuthStore((state) => state.user);
  const [request, setRequest] = useState<OAuthAuthorizationRequest | null>(null);
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
  const [activeResource, setActiveResource] = useState<string>();
  const [resourceQuery, setResourceQuery] = useState('');
  const [organizationId, setOrganizationId] = useState<string>();
  const [loading, setLoading] = useState(Boolean(requestId));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>(
    requestId ? undefined : '授权请求缺少 request_id'
  );

  useEffect(() => {
    if (!requestId) {
      return;
    }

    getOAuthAuthorizationRequest(requestId)
      .then((data) => {
        setRequest(data);
        setSelectedScopes(data.permissions.filter(isDefaultPermission).map(({ code }) => code));
        setActiveResource(data.permissions[0]?.resource);
        setOrganizationId(
          data.organizations.find(({ id }) => id === user?.currentOrgId)?.id ??
            data.organizations[0]?.id
        );
      })
      .catch(() => setError('授权请求无效、已过期或已经处理'))
      .finally(() => setLoading(false));
  }, [requestId, user?.currentOrgId]);

  const groupedPermissions = useMemo(
    () => groupPermissions(request?.permissions ?? []),
    [request?.permissions]
  );
  const activePermissions = activeResource ? (groupedPermissions[activeResource] ?? []) : [];
  const resourceEntries = useMemo(() => Object.entries(groupedPermissions), [groupedPermissions]);
  const filteredResourceEntries = useMemo(() => {
    const query = resourceQuery.trim().toLocaleLowerCase();
    if (!query) return resourceEntries;
    return resourceEntries.filter(([resource]) =>
      `${RESOURCE_LABELS[resource] ?? resource} ${resource}`.toLocaleLowerCase().includes(query)
    );
  }, [resourceEntries, resourceQuery]);

  function changeResourceQuery(value: string) {
    setResourceQuery(value);
    const query = value.trim().toLocaleLowerCase();
    const matches = resourceEntries.filter(([resource]) =>
      `${RESOURCE_LABELS[resource] ?? resource} ${resource}`.toLocaleLowerCase().includes(query)
    );
    if (matches.length > 0 && !matches.some(([resource]) => resource === activeResource)) {
      setActiveResource(matches[0][0]);
    }
  }

  async function approve() {
    if (!requestId || !organizationId || selectedScopes.length === 0) return;
    setSubmitting(true);
    try {
      const result = await approveOAuthAuthorizationRequest(
        requestId,
        selectedScopes,
        organizationId
      );
      window.location.assign(result.redirect_uri);
    } catch {
      message.error('授权失败，请重新发起登录');
      setSubmitting(false);
    }
  }

  async function deny() {
    if (!requestId) return;
    setSubmitting(true);
    try {
      const result = await denyOAuthAuthorizationRequest(requestId);
      window.location.assign(result.redirect_uri);
    } catch {
      message.error('无法取消授权，请直接关闭页面');
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="oauth-consent oauth-consent--centered">
        <Spin size="large" tip="正在校验授权请求" />
      </main>
    );
  }

  if (error || !request) {
    return (
      <main className="oauth-consent oauth-consent--centered">
        <Result status="error" title="无法继续授权" subTitle={error} />
      </main>
    );
  }

  return (
    <main className="oauth-consent">
      <section className="oauth-consent__card">
        <aside className="oauth-consent__summary">
          <div className="oauth-consent__app-identity">
            <div className="oauth-consent__app-icon">
              <AppstoreOutlined />
            </div>
            <div className="oauth-consent__app-copy">
              <Typography.Title level={3}>{request.client.name} 请求访问</Typography.Title>
              <Typography.Text type="secondary">
                {request.client.description ?? '命令行客户端将代表你访问 Nove 数据。'}
              </Typography.Text>
            </div>
          </div>

          <div className="oauth-consent__account" role="note">
            <SafetyCertificateOutlined />
            <span>
              <small>当前账号</small>
              <strong>{user?.name ?? user?.email ?? '已登录用户'}</strong>
            </span>
          </div>

          <div className="oauth-consent__organization">
            <Typography.Text strong>授权组织</Typography.Text>
            <Select
              value={organizationId}
              onChange={setOrganizationId}
              options={request.organizations.map((organization) => ({
                value: organization.id,
                label: `${organization.name} (${organization.code})`,
              }))}
              placeholder="选择组织"
            />
          </div>

          <div className="oauth-consent__security-note">
            <SafetyCertificateOutlined />
            <div>
              <strong>安全授权</strong>
              <p>只能授予当前账号已有的权限，写入和删除权限需要你主动选择。</p>
            </div>
          </div>

          <div className="oauth-consent__overview">
            <Typography.Text type="secondary">授权概览</Typography.Text>
            <div>
              <span aria-label={`请求 ${request.permissions.length} 项权限`}>
                <strong>{request.permissions.length}</strong>
                <small>请求权限</small>
              </span>
              <span aria-label={`已选择 ${selectedScopes.length} 项权限`}>
                <strong>{selectedScopes.length}</strong>
                <small>已选择</small>
              </span>
            </div>
          </div>

          <Typography.Text type="secondary" className="oauth-consent__footnote">
            授权完成后浏览器会返回本机 Nove CLI，授权码不会暴露给其他网站。
          </Typography.Text>
        </aside>

        <section className="oauth-consent__workspace">
          <header className="oauth-consent__workspace-header">
            <div>
              <Typography.Text className="oauth-consent__eyebrow">ACCESS CONTROL</Typography.Text>
              <Typography.Title level={3}>选择授权权限</Typography.Title>
              <Typography.Text type="secondary">
                读取权限已默认勾选，你可以按资源检查并调整授权范围。
              </Typography.Text>
            </div>
          </header>

          {request.organizations.length === 0 && (
            <Alert type="error" showIcon title="当前账号不属于任何可授权组织" />
          )}

          <section className="oauth-consent__permissions">
            <div className="oauth-consent__resource-browser">
              <aside className="oauth-consent__resource-nav">
                <Input
                  allowClear
                  prefix={<SearchOutlined />}
                  value={resourceQuery}
                  onChange={(event) => changeResourceQuery(event.target.value)}
                  placeholder="搜索权限资源"
                />
                <div className="oauth-consent__resource-list" role="tablist" aria-label="权限资源">
                  {filteredResourceEntries.map(([resource, permissions]) => {
                    const selectedCount = permissions.filter(({ code }) =>
                      selectedScopes.includes(code)
                    ).length;
                    const resourceLabel = RESOURCE_LABELS[resource] ?? resource;

                    return (
                      <button
                        type="button"
                        role="tab"
                        aria-selected={activeResource === resource}
                        aria-label={`${resourceLabel}，已选 ${selectedCount}/${permissions.length}`}
                        className="oauth-consent__resource-tab"
                        onClick={() => setActiveResource(resource)}
                        key={resource}
                      >
                        <span>{resourceLabel}</span>
                        <small>
                          {selectedCount}/{permissions.length}
                        </small>
                      </button>
                    );
                  })}
                  {filteredResourceEntries.length === 0 && (
                    <Typography.Text type="secondary" className="oauth-consent__resource-empty">
                      没有匹配的资源
                    </Typography.Text>
                  )}
                </div>
              </aside>

              <div className="oauth-consent__permission-content">
                <header className="oauth-consent__permission-content-header">
                  <div>
                    <strong>
                      {activeResource
                        ? (RESOURCE_LABELS[activeResource] ?? activeResource)
                        : '权限'}
                    </strong>
                    <small>{activePermissions.length} 项权限</small>
                  </div>
                  <span>
                    {activePermissions.filter(({ code }) => selectedScopes.includes(code)).length}/
                    {activePermissions.length} 已选
                  </span>
                </header>

                <div className="oauth-consent__permission-panel" role="tabpanel">
                  {activePermissions.map((permission) => {
                    const dangerous = DANGEROUS_ACTIONS.has(permission.action);
                    return (
                      <label className="oauth-consent__permission" key={permission.code}>
                        <Checkbox
                          checked={selectedScopes.includes(permission.code)}
                          onChange={(event) =>
                            setSelectedScopes((current) =>
                              event.target.checked
                                ? [...current, permission.code]
                                : current.filter((scope) => scope !== permission.code)
                            )
                          }
                        />
                        <span>
                          <strong>{permission.name}</strong>
                          <small>{permission.description ?? permission.code}</small>
                        </span>
                        {dangerous ? (
                          <Tag color="warning" icon={<ExclamationCircleOutlined />}>
                            高风险
                          </Tag>
                        ) : (
                          <CheckCircleOutlined className="oauth-consent__safe" />
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {request.permissions.length === 0 && (
            <Alert type="warning" showIcon title="当前账号没有 CLI 请求的任何权限" />
          )}

          <footer className="oauth-consent__actions">
            <Typography.Text type="secondary">
              请确认所选组织和授权范围，完成后将返回 Nove CLI
            </Typography.Text>
            <div>
              <Button size="large" onClick={deny} disabled={submitting}>
                取消
              </Button>
              <Button
                type="primary"
                size="large"
                loading={submitting}
                disabled={!organizationId || selectedScopes.length === 0}
                onClick={approve}
              >
                同意授权
              </Button>
            </div>
          </footer>
        </section>
      </section>
    </main>
  );
}
