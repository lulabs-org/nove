import Button from 'antd/es/button';
import Popover from 'antd/es/popover';
import Space from 'antd/es/space';
import Tag from 'antd/es/tag';

interface ScopeSummaryProps {
  scopes?: string[];
}

function groupScopes(scopes: string[]) {
  return scopes.reduce<Record<string, string[]>>((groups, scope) => {
    const group = scope.includes(':') ? scope.split(':', 1)[0] : '其他';
    groups[group] ??= [];
    groups[group].push(scope);
    return groups;
  }, {});
}

export function ScopeSummary({ scopes = [] }: ScopeSummaryProps) {
  if (scopes.length === 0) return <span style={{ color: '#999' }}>未配置</span>;

  if (scopes.length <= 2) {
    return (
      <Space size={4}>
        {scopes.map((scope) => (
          <Tag key={scope} color="blue" style={{ marginInlineEnd: 0 }}>
            {scope}
          </Tag>
        ))}
      </Space>
    );
  }

  const groups = groupScopes(scopes);
  const groupEntries = Object.entries(groups);

  const content = (
    <div style={{ width: 420, maxHeight: 320, overflowY: 'auto', paddingRight: 4 }}>
      {groupEntries.map(([group, groupScopes]) => (
        <div key={group} style={{ marginBottom: 12 }}>
          <div style={{ marginBottom: 6, fontWeight: 600 }}>
            {group}
            <span style={{ marginLeft: 6, color: '#999', fontWeight: 400 }}>
              {groupScopes.length} 项
            </span>
          </div>
          <Space size={[4, 4]} wrap>
            {groupScopes.map((scope) => (
              <Tag key={scope} style={{ marginInlineEnd: 0 }}>
                {scope}
              </Tag>
            ))}
          </Space>
        </div>
      ))}
    </div>
  );

  return (
    <Space size={4}>
      <Popover
        title={`权限范围（${scopes.length} 项）`}
        content={content}
        trigger="click"
        placement="rightTop"
      >
        <Button type="link" size="small" style={{ height: 'auto', padding: 0 }}>
          查看 {scopes.length} 项权限
        </Button>
      </Popover>
      <span style={{ color: '#999', fontSize: 12 }}>{groupEntries.length} 个分组</span>
    </Space>
  );
}
