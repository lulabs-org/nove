import Empty from 'antd/es/empty';
import Tag from 'antd/es/tag';
import Typography from 'antd/es/typography';
import { ApartmentOutlined, DatabaseOutlined } from '@ant-design/icons';
import type { PermissionResourceGroup } from '../../types';

const { Text } = Typography;

interface PermissionResourceTreeProps {
  loading: boolean;
  resourceGroups: PermissionResourceGroup[];
  totalPermissions: number;
  selectedResource?: string;
  onSelectResource: (resource?: string) => void;
}

export function PermissionResourceTree({
  loading,
  resourceGroups,
  totalPermissions,
  selectedResource,
  onSelectResource,
}: PermissionResourceTreeProps) {
  const renderList = () => {
    if (loading) {
      return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="分组加载中" />;
    }

    if (!resourceGroups.length) {
      return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无权限" />;
    }

    return (
      <>
        <button
          type="button"
          className={`permission-tree-node${!selectedResource ? ' is-active' : ''}`}
          onClick={() => onSelectResource(undefined)}
        >
          <ApartmentOutlined />
          <span className="permission-tree-node-name">
            <span>全部权限</span>
            <span className="permission-resource-meta">{totalPermissions} 项权限</span>
          </span>
        </button>
        {resourceGroups.map((group) => {
          const active = selectedResource === group.resource;
          return (
            <button
              key={group.resource}
              type="button"
              className={`permission-tree-node${active ? ' is-active' : ''}`}
              onClick={() => onSelectResource(group.resource)}
            >
              <DatabaseOutlined />
              <span className="permission-tree-node-name">
                <span>{group.resource}</span>
                <span className="permission-resource-meta">{group.activeCount} 项启用</span>
              </span>
              <Tag>{group.count}</Tag>
            </button>
          );
        })}
      </>
    );
  };

  return (
    <aside className="permission-tree-pane">
      <div className="permission-tree-title">
        <span>资源分组</span>
        <Text type="secondary">{resourceGroups.length}</Text>
      </div>
      <div className="permission-tree-list">{renderList()}</div>
    </aside>
  );
}
