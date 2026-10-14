import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MarkdownViewer, renderMarkdown } from './index';

describe('MarkdownViewer', () => {
  it('renders empty text when content is empty or null', () => {
    render(<MarkdownViewer content="" emptyText="暂无内容" />);
    expect(screen.getByText('暂无内容')).toBeInTheDocument();

    const { container: nullContainer } = render(<MarkdownViewer content={null} />);
    expect(nullContainer.firstChild).toBeNull();
  });

  it('renders basic markdown elements correctly', () => {
    const md = '# 标题一\n\n**加粗文本** 与 [链接](https://example.com)\n\n- 列表项1\n- 列表项2';
    render(<MarkdownViewer content={md} />);

    expect(screen.getByRole('heading', { level: 1, name: '标题一' })).toBeInTheDocument();
    expect(screen.getByText('加粗文本')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: '链接' });
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(screen.getByText('列表项1')).toBeInTheDocument();
    expect(screen.getByText('列表项2')).toBeInTheDocument();
  });

  it('preserves line breaks in plain paragraphs (breaks: true)', () => {
    const multiline = '第一行文本\n第二行文本\n第三行文本';
    const html = renderMarkdown(multiline);
    expect(html).toContain('<br>');
  });

  it('sanitizes malicious script and onerror tags to prevent XSS', () => {
    const malicious =
      '<script>alert("xss")</script><img src="x" onerror="alert(1)" />\n\n**安全文本**';
    render(<MarkdownViewer content={malicious} />);

    expect(document.querySelector('script')).toBeNull();
    const img = document.querySelector('img');
    if (img) {
      expect(img).not.toHaveAttribute('onerror');
    }
    expect(screen.getByText('安全文本')).toBeInTheDocument();
  });
});
