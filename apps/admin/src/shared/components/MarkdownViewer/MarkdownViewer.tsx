import React, { useMemo } from 'react';
import './MarkdownViewer.css';
import { renderMarkdown } from './renderMarkdown';

export interface MarkdownViewerProps {
  content?: string | null;
  className?: string;
  style?: React.CSSProperties;
  emptyText?: string;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({
  content,
  className = '',
  style,
  emptyText,
}) => {
  const html = useMemo(() => {
    if (!content?.trim()) return '';
    return renderMarkdown(content);
  }, [content]);

  if (!html) {
    if (!emptyText) return null;
    return <div className={`markdown-viewer-empty ${className}`}>{emptyText}</div>;
  }

  return (
    <div
      className={`markdown-viewer ${className}`.trim()}
      style={style}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
