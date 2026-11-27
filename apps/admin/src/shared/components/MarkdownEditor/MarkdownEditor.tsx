import {
  BoldOutlined,
  CodeOutlined,
  EditOutlined,
  EyeOutlined,
  ItalicOutlined,
  LinkOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import type { GetRef } from 'antd';
import { Input, Segmented, Tooltip } from 'antd';
import React, { useRef, useState } from 'react';
import { MarkdownViewer } from '../MarkdownViewer';
import './MarkdownEditor.css';

type TextAreaRef = GetRef<typeof Input.TextArea>;

export interface MarkdownEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  rows?: number;
  minHeight?: number | string;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

type Mode = 'edit' | 'preview';

interface ToolbarItem {
  key: string;
  title?: string;
  icon?: React.ReactNode;
  content?: string;
  className?: string;
  isDivider?: boolean;
}

const TOOLBAR_ITEMS: ToolbarItem[] = [
  {
    key: 'bold',
    title: '加粗 (**加粗**)',
    icon: <BoldOutlined />,
  },
  {
    key: 'italic',
    title: '斜体 (*斜体*)',
    icon: <ItalicOutlined />,
  },
  {
    key: 'heading',
    title: '标题 (### 标题)',
    content: 'H',
    className: 'text-btn',
  },
  { key: 'divider-1', isDivider: true },
  {
    key: 'ul',
    title: '无序列表 (- 列表项)',
    icon: <UnorderedListOutlined />,
  },
  {
    key: 'ol',
    title: '有序列表 (1. 列表项)',
    icon: <OrderedListOutlined />,
  },
  {
    key: 'quote',
    title: '引用 (> 引用文本)',
    content: '”',
    className: 'text-btn',
  },
  { key: 'divider-2', isDivider: true },
  {
    key: 'code',
    title: '代码块 (```代码```)',
    icon: <CodeOutlined />,
  },
  {
    key: 'link',
    title: '超链接 ([描述](url))',
    icon: <LinkOutlined />,
  },
];

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value = '',
  onChange,
  placeholder = '请输入内容，支持 Markdown 语法排版（如 # 标题、* 列表、**加粗** 等）',
  rows = 6,
  minHeight = 180,
  disabled = false,
  className = '',
  style,
}) => {
  const [mode, setMode] = useState<Mode>('edit');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<TextAreaRef>(null);

  const insertSnippet = (prefix: string, suffix = '', defaultText = '') => {
    if (disabled) return;
    const textarea = textareaRef.current?.resizableTextArea?.textArea;
    const currentVal = value ?? '';

    if (!textarea) {
      const next = `${currentVal}${prefix}${defaultText}${suffix}`;
      onChange?.(next);
      return;
    }

    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const selected = currentVal.slice(start, end);
    const content = selected || defaultText;
    const updated = `${currentVal.slice(0, start)}${prefix}${content}${suffix}${currentVal.slice(end)}`;

    onChange?.(updated);

    setTimeout(() => {
      textarea.focus();
      const newStart = start + prefix.length;
      const newEnd = newStart + content.length;
      textarea.setSelectionRange(newStart, newEnd);
    }, 0);
  };

  const handleToolbarAction = (key: string) => {
    switch (key) {
      case 'bold':
        insertSnippet('**', '**', '加粗文本');
        break;
      case 'italic':
        insertSnippet('*', '*', '斜体文本');
        break;
      case 'heading':
        insertSnippet('\n### ', '\n', '标题');
        break;
      case 'ul':
        insertSnippet('\n- ', '', '列表项');
        break;
      case 'ol':
        insertSnippet('\n1. ', '', '列表项');
        break;
      case 'quote':
        insertSnippet('\n> ', '\n', '引用内容');
        break;
      case 'code':
        insertSnippet('\n```\n', '\n```\n', 'console.log("hello");');
        break;
      case 'link':
        insertSnippet('[', '](https://example.com)', '链接描述');
        break;
      default:
        break;
    }
  };

  return (
    <div
      className={`markdown-editor ${isFocused ? 'is-focused' : ''} ${disabled ? 'is-disabled' : ''} ${className}`.trim()}
      style={style}
    >
      <div className="markdown-editor-header">
        <div className="markdown-editor-toolbar" role="toolbar" aria-label="Markdown 格式工具栏">
          {mode === 'edit' &&
            TOOLBAR_ITEMS.map((item) => {
              if (item.isDivider) {
                return <span key={item.key} className="markdown-editor-toolbar-divider" />;
              }
              return (
                <Tooltip key={item.key} title={item.title}>
                  <button
                    type="button"
                    disabled={disabled}
                    className={`markdown-editor-toolbar-btn ${item.className ?? ''}`.trim()}
                    onClick={() => handleToolbarAction(item.key)}
                    aria-label={item.title}
                  >
                    {item.icon ?? item.content}
                  </button>
                </Tooltip>
              );
            })}
          {mode === 'preview' && (
            <span style={{ fontSize: 13, color: 'var(--ant-color-text-tertiary)', paddingLeft: 4 }}>实时渲染预览模式</span>
          )}
        </div>

        <Segmented<Mode>
          size="small"
          value={mode}
          onChange={(val) => setMode(val)}
          options={[
            { label: '编辑', value: 'edit', icon: <EditOutlined /> },
            { label: '预览', value: 'preview', icon: <EyeOutlined /> },
          ]}
        />
      </div>

      <div className="markdown-editor-body" style={{ minHeight }}>
        {mode === 'edit' ? (
          <Input.TextArea
            ref={textareaRef}
            className="markdown-editor-textarea"
            value={value}
            disabled={disabled}
            placeholder={placeholder}
            autoSize={{ minRows: rows, maxRows: 16 }}
            onChange={(e) => onChange?.(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
        ) : (
          <div
            className="markdown-editor-preview-container"
            style={{ minHeight, maxHeight: typeof minHeight === 'number' ? minHeight * 2.5 : 400 }}
          >
            <MarkdownViewer content={value} emptyText="（暂无内容，切换至编辑标签页输入）" />
          </div>
        )}
      </div>

      <div className="markdown-editor-footer">
        <span>支持 Markdown (GFM) 语法</span>
        <span>{(value ?? '').length} 字符</span>
      </div>
    </div>
  );
};
