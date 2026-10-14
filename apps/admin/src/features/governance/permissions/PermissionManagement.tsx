import { useState } from 'react';
import Space from 'antd/es/space';
import Tabs from 'antd/es/tabs';
import Tooltip from 'antd/es/tooltip';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { DataRuleTab } from './components/data-rules/DataRuleTab';
import { PermissionTab } from './components/permissions/PermissionTab';
import type { ActiveTab } from './types';
import './PermissionManagement.css';

export function PermissionManagement() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('permissions');
  const [permissionTotal, setPermissionTotal] = useState(0);
  const [dataRuleTotal, setDataRuleTotal] = useState(0);

  return (
    <div className="permission-management-page">
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as ActiveTab)}
        tabBarExtraContent={
          <div className="permission-tab-summary">
            <span>权限项 {permissionTotal}</span>
            <span>数据规则 {dataRuleTotal}</span>
          </div>
        }
        items={[
          {
            key: 'permissions',
            label: '权限项',
            children: <PermissionTab onTotalChange={setPermissionTotal} />,
          },
          {
            key: 'dataRules',
            label: (
              <Space size={4}>
                <span>数据规则</span>
                <Tooltip title="数据规则创建后不会自动生效。请前往「组织架构 → 角色管理 → 配置权限 → 数据规则」将规则分配给角色。普通用户未绑定订单数据规则时默认看不到任何订单；公海订单也必须显式授权。">
                  <QuestionCircleOutlined aria-label="数据规则生效说明" />
                </Tooltip>
              </Space>
            ),
            forceRender: true,
            children: <DataRuleTab onTotalChange={setDataRuleTotal} />,
          },
        ]}
      />
    </div>
  );
}
