import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MarkdownEditor } from './MarkdownEditor';

globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

describe('MarkdownEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders in edit mode with toolbar and textarea', () => {
    render(<MarkdownEditor value="# 测试" placeholder="输入介绍" />);

    expect(screen.getByRole('toolbar')).toBeInTheDocument();
    const textarea = screen.getByPlaceholderText('输入介绍');
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveValue('# 测试');
  });

  it('calls onChange when user types in textarea', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MarkdownEditor value="" onChange={onChange} placeholder="输入介绍" />);

    const textarea = screen.getByPlaceholderText('输入介绍');
    await user.type(textarea, 'Hello');

    expect(onChange).toHaveBeenCalled();
  });

  it('switches to preview mode when clicking 预览 segmented tab', async () => {
    const user = userEvent.setup();
    render(<MarkdownEditor value={'## 预览标题\n\n**加粗测试**'} />);

    // Click '预览'
    const previewTab = screen.getByText('预览');
    await user.click(previewTab);

    // Textarea is replaced by preview container
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.getByRole('heading', { level: 2, name: '预览标题' })).toBeInTheDocument();
    expect(screen.getByText('加粗测试')).toBeInTheDocument();
  });

  it('inserts formatting snippet when toolbar action clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MarkdownEditor value="" onChange={onChange} />);

    const boldBtn = screen.getByLabelText('加粗 (**加粗**)');
    await user.click(boldBtn);

    expect(onChange).toHaveBeenCalledWith('**加粗文本**');
  });

  it('disables toolbar and textarea when disabled prop is true', () => {
    render(<MarkdownEditor disabled value="只读内容" />);

    const boldBtn = screen.getByLabelText('加粗 (**加粗**)');
    expect(boldBtn).toBeDisabled();
    const textarea = screen.getByDisplayValue('只读内容');
    expect(textarea).toBeDisabled();
  });
});
