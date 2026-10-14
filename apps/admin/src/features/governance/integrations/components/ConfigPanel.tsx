import {
  EditOutlined,
  QuestionCircleOutlined,
  ReloadOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import Alert from 'antd/es/alert';
import Button from 'antd/es/button';
import Card from 'antd/es/card';
import Divider from 'antd/es/divider';
import Popconfirm from 'antd/es/popconfirm';
import Popover from 'antd/es/popover';
import Space from 'antd/es/space';
import Tag from 'antd/es/tag';
import type { ReactNode } from 'react';
import type { IntegrationSummary, IntegrationModule, TestIntegrationResult } from '../types';
import { MODULE_META } from '../moduleRegistry';

interface ConfigPanelProps {
  module: IntegrationModule;
  summary?: IntegrationSummary;
  loading: boolean;
  saving: boolean;
  testing: boolean;
  deleting: boolean;
  canWrite: boolean;
  isEditing: boolean;
  testResult?: TestIntegrationResult;
  onRefresh: () => void;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onTest: () => void;
  onDelete: () => void;
  children: ReactNode;
}

export function ConfigPanel({
  module,
  summary,
  loading,
  saving,
  testing,
  deleting,
  canWrite,
  isEditing,
  testResult,
  onRefresh,
  onEdit,
  onCancelEdit,
  onSave,
  onTest,
  onDelete,
  children,
}: ConfigPanelProps) {
  const meta = MODULE_META[module];
  const canDelete = summary?.source === 'database';

  return (
    <Card
      className="integrations-card"
      loading={loading}
      title={
        <div className="integrations-card-heading">
          <span className="integrations-card-title-line">
            <span>{meta.title}</span>
            <Popover
              placement="bottomLeft"
              title="配置说明"
              content={
                <div className="integrations-secret-help">
                  <div className="integrations-help-section">
                    <div className="integrations-help-section-title">密钥更新</div>
                    <div>
                      已配置的敏感字段会以 <code>********</code>{' '}
                      显示。保持原样或留空会继续使用当前密钥；输入新值后才会替换。
                    </div>
                  </div>
                  {summary?.source === 'database' &&
                    (summary.environmentImportedFields?.length ?? 0) > 0 && (
                      <div className="integrations-help-section">
                        <div className="integrations-help-section-title">初始配置来源</div>
                        <div>
                          此配置首次由环境变量导入数据库，当前及后续运行均以数据库配置为准。
                        </div>
                      </div>
                    )}
                  {module === 'lark' && (
                    <div className="integrations-help-section">
                      <div className="integrations-help-section-title">飞书长连接</div>
                      <div>
                        HTTP API 和事件配置会立即生效；App ID 或 App Secret
                        变更后，事件长连接需要重启 API。
                      </div>
                    </div>
                  )}
                </div>
              }
            >
              <Button
                type="text"
                size="small"
                className="integrations-help-button"
                aria-label="查看配置说明"
                icon={<QuestionCircleOutlined />}
              />
            </Popover>
          </span>
          <span>{meta.description}</span>
        </div>
      }
      extra={
        <Space>
          {summary && (
            <Tag color={summary.configured ? 'success' : 'default'}>
              {summary.configured ? '已配置' : '未配置'}
            </Tag>
          )}
          {canWrite && !isEditing && (
            <Button type="primary" icon={<EditOutlined />} onClick={onEdit}>
              编辑配置
            </Button>
          )}
          <Button icon={<ReloadOutlined />} onClick={onRefresh}>
            刷新
          </Button>
        </Space>
      }
    >
      {isEditing && testResult && (
        <Alert
          className="integrations-test-result"
          type={testResult.success ? 'success' : 'error'}
          showIcon
          title={testResult.message}
        />
      )}
      {children}
      {isEditing && (
        <>
          <Divider className="integrations-divider" />
          <div className="integrations-actions">
            <Popconfirm
              title={`删除${meta.label}数据库配置？`}
              description={
                module === 'drive'
                  ? '删除后将恢复默认文件策略；扫描服务仍按部署配置选择。'
                  : '删除后服务将变为未配置，重启时也不会从环境变量恢复。'
              }
              okText="删除"
              cancelText="取消"
              disabled={!canDelete}
              okButtonProps={{ danger: true, loading: deleting }}
              onConfirm={onDelete}
            >
              <Button danger disabled={!canDelete} loading={deleting}>
                删除数据库配置
              </Button>
            </Popconfirm>
            <Space>
              <Button onClick={onCancelEdit}>取消编辑</Button>
              {module !== 'drive' && module !== 'aliyun-sms' && (
                <Button loading={testing} onClick={onTest}>
                  测试连接
                </Button>
              )}
              <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={onSave}>
                保存配置
              </Button>
            </Space>
          </div>
        </>
      )}
    </Card>
  );
}
