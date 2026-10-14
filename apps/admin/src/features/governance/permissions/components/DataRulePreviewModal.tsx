import Button from 'antd/es/button';
import Card from 'antd/es/card';
import Descriptions from 'antd/es/descriptions';
import Input from 'antd/es/input';
import Modal from 'antd/es/modal';
import Space from 'antd/es/space';
import Tag from 'antd/es/tag';
import Typography from 'antd/es/typography';
import {
  CheckOutlined,
  CopyOutlined,
  EyeOutlined,
  PlayCircleOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useMemo, useState } from 'react';
import type { DataPermissionRule } from '../api/permissionManagementApi';
import { explainCondition, getActionMeta, simulateCondition } from './dataRuleConstants';
import './DataRulePreviewModal.css';

const { Text } = Typography;

export interface DataRulePreviewModalProps {
  open: boolean;
  onClose: () => void;
  rule: DataPermissionRule | null;
}

export function DataRulePreviewModal({ open, onClose, rule }: DataRulePreviewModalProps) {
  const [copied, setCopied] = useState(false);
  const [mockUserId, setMockUserId] = useState('usr_alice_001');
  const [mockDeptId, setMockDeptId] = useState('dept_sales_east');
  const [mockDeptIds, setMockDeptIds] = useState('["dept_sales_east", "dept_sales_team2"]');

  const mockContext = useMemo(() => {
    let parsedDeptIds = ['dept_sales_east'];
    try {
      parsedDeptIds = JSON.parse(mockDeptIds);
    } catch {
      // fallback
    }
    return {
      '${user.id}': mockUserId,
      '${user.departmentId}': mockDeptId,
      '${user.departmentIds}': parsedDeptIds,
      '${user.roles}': ['SALES_REPRESENTATIVE'],
      '${user.companyId}': 'org_nove_enterprise',
    };
  }, [mockUserId, mockDeptId, mockDeptIds]);

  const explanation = useMemo(() => {
    if (!rule) return '';
    return explainCondition(rule.condition, rule.resource);
  }, [rule]);

  const resolvedFilter = useMemo(() => {
    if (!rule) return {};
    return simulateCondition(rule.condition, mockContext);
  }, [rule, mockContext]);

  const resolvedJsonString = useMemo(() => {
    return JSON.stringify(resolvedFilter, null, 2);
  }, [resolvedFilter]);

  const handleCopy = () => {
    navigator.clipboard.writeText(resolvedJsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!rule) return null;

  return (
    <Modal
      title={
        <Space>
          <EyeOutlined />
          <span>数据规则模拟预览与解析</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="close" type="primary" onClick={onClose}>
          完成
        </Button>,
      ]}
      width={780}
      destroyOnHidden
    >
      <div className="data-rule-preview-shell">
        {/* 基本信息 */}
        <Descriptions bordered size="small" column={2} style={{ marginBottom: 16 }}>
          <Descriptions.Item label="规则名称">{rule.name}</Descriptions.Item>
          <Descriptions.Item label="规则编码">
            <span className="permission-code">{rule.code}</span>
          </Descriptions.Item>
          <Descriptions.Item label="资源标识">
            <Tag color="cyan">{rule.resource}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="操作类型">
            <Tag color={getActionMeta(rule.action).color}>{getActionMeta(rule.action).label}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="状态" span={2}>
            <Tag color={rule.active ? 'success' : 'default'}>
              {rule.active ? '启用中' : '已停用'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="业务释义" span={2}>
            <Text strong style={{ color: '#1677ff' }}>
              {explanation}
            </Text>
          </Descriptions.Item>
        </Descriptions>

        {/* 模拟运行上下文参数 */}
        <Card
          size="small"
          title={
            <Space>
              <UserOutlined />
              <span>模拟运行用户上下文 (Mock User Context)</span>
            </Space>
          }
          style={{ marginBottom: 16, background: '#fafbfc' }}
        >
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  当前用户 ID (`${`{user.id}`}`):
                </Text>
                <Input
                  size="small"
                  value={mockUserId}
                  onChange={(e) => setMockUserId(e.target.value)}
                  placeholder="例如 usr_alice_001"
                />
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  当前部门 ID (`${`{user.departmentId}`}`):
                </Text>
                <Input
                  size="small"
                  value={mockDeptId}
                  onChange={(e) => setMockDeptId(e.target.value)}
                  placeholder="例如 dept_sales_east"
                />
              </div>
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                本部门及所有子部门 IDs (`${`{user.departmentIds}`}`):
              </Text>
              <Input
                size="small"
                value={mockDeptIds}
                onChange={(e) => setMockDeptIds(e.target.value)}
                placeholder='例如 ["dept_sales_east", "dept_sales_team2"]'
              />
            </div>
          </Space>
        </Card>

        {/* 解析对比结果 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <div style={{ marginBottom: 6 }}>
              <Text strong>配置的原始条件 (Condition Template):</Text>
            </div>
            <div className="data-rule-code-preview">
              <pre>{rule.condition}</pre>
            </div>
          </div>

          <div>
            <div
              style={{
                marginBottom: 6,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Space size="small">
                <PlayCircleOutlined style={{ color: '#52c41a' }} />
                <Text strong>最终生效的数据库查询条件:</Text>
              </Space>
              <Button
                size="small"
                type="text"
                icon={copied ? <CheckOutlined style={{ color: '#52c41a' }} /> : <CopyOutlined />}
                onClick={handleCopy}
              >
                {copied ? '已复制' : '复制'}
              </Button>
            </div>
            <div className="data-rule-code-preview is-result">
              <pre>{resolvedJsonString}</pre>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
