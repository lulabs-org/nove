import { useMemo, useState } from 'react';
import Button from 'antd/es/button';
import Checkbox from 'antd/es/checkbox';
import Input from 'antd/es/input';
import Space from 'antd/es/space';
import Tag from 'antd/es/tag';

interface ScopeSelectorProps {
  value?: string[];
  onChange?: (value: string[]) => void;
  options: string[];
}

function getScopeGroup(scope: string) {
  return scope.includes(':') ? scope.split(':', 1)[0] : '其他';
}

export function ScopeSelector({ value = [], onChange, options }: ScopeSelectorProps) {
  const [keyword, setKeyword] = useState('');
  const selectedScopes = useMemo(() => new Set(value), [value]);
  const availableScopes = useMemo(
    () => Array.from(new Set([...options, ...value])).sort((a, b) => a.localeCompare(b)),
    [options, value]
  );

  const groups = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    const filteredScopes = normalizedKeyword
      ? availableScopes.filter((scope) => scope.toLowerCase().includes(normalizedKeyword))
      : availableScopes;

    return filteredScopes.reduce<Record<string, string[]>>((result, scope) => {
      const group = getScopeGroup(scope);
      result[group] ??= [];
      result[group].push(scope);
      return result;
    }, {});
  }, [availableScopes, keyword]);

  const visibleScopes = Object.values(groups).flat();

  const updateScopes = (scopes: string[], checked: boolean) => {
    const nextScopes = new Set(value);
    scopes.forEach((scope) => {
      if (checked) nextScopes.add(scope);
      else nextScopes.delete(scope);
    });
    onChange?.(Array.from(nextScopes));
  };

  return (
    <div
      style={{
        border: '1px solid #d9d9d9',
        borderRadius: 8,
        overflow: 'hidden',
        background: '#fff',
      }}
    >
      <div
        style={{
          padding: 12,
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          borderBottom: '1px solid #f0f0f0',
          background: '#fafafa',
        }}
      >
        <Input
          allowClear
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="搜索权限，例如 meeting"
          style={{ flex: 1 }}
        />
        <Button
          size="small"
          disabled={visibleScopes.length === 0}
          onClick={() => updateScopes(visibleScopes, true)}
        >
          {keyword ? '全选结果' : '全选全部'}
        </Button>
        <Button size="small" disabled={value.length === 0} onClick={() => onChange?.([])}>
          清空
        </Button>
      </div>

      <div style={{ padding: '8px 12px', borderBottom: '1px solid #f0f0f0' }}>
        <Space size={6}>
          <span style={{ color: '#666' }}>已选择</span>
          <Tag color="blue" style={{ marginInlineEnd: 0 }}>
            {value.length}
          </Tag>
          <span style={{ color: '#999' }}>/ {availableScopes.length} 项</span>
        </Space>
      </div>

      <div style={{ maxHeight: 320, overflowY: 'auto', padding: '4px 12px 12px' }}>
        {Object.entries(groups).map(([group, scopes]) => {
          const selectedCount = scopes.filter((scope) => selectedScopes.has(scope)).length;

          return (
            <div key={group} style={{ paddingTop: 12 }}>
              <Checkbox
                checked={selectedCount === scopes.length}
                indeterminate={selectedCount > 0 && selectedCount < scopes.length}
                onChange={(event) => updateScopes(scopes, event.target.checked)}
                style={{ fontWeight: 600, marginBottom: 8 }}
              >
                {group}
                <span style={{ marginLeft: 6, color: '#999', fontWeight: 400 }}>
                  {selectedCount}/{scopes.length}
                </span>
              </Checkbox>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: '8px 16px',
                  paddingLeft: 24,
                }}
              >
                {scopes.map((scope) => (
                  <Checkbox
                    key={scope}
                    checked={selectedScopes.has(scope)}
                    onChange={(event) => updateScopes([scope], event.target.checked)}
                  >
                    <span style={{ wordBreak: 'break-all' }}>{scope}</span>
                  </Checkbox>
                ))}
              </div>
            </div>
          );
        })}

        {visibleScopes.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: '#999' }}>没有匹配的权限</div>
        )}
      </div>
    </div>
  );
}
