import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DataRuleBuilder } from './DataRuleBuilder';
import { validateConditionJson } from './dataRuleConstants';

globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })),
});

describe('DataRuleBuilder', () => {
  it('shows nested AND/OR groups and preserves JSON when switching modes', async () => {
    const value = JSON.stringify({
      $and: [
        { $or: [{ currentOwnerId: '${user.id}' }, { purchaserId: '${user.id}' }] },
        { status: 'PAID' },
      ],
    });
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<DataRuleBuilder value={value} resource="order" onChange={onChange} />);

    expect(screen.getByText('第 2 层条件组:')).toBeInTheDocument();
    await user.click(screen.getByText('JSON 源码'));
    expect(
      screen.getByPlaceholderText('例如 {"departmentId": "${user.departmentId}"}')
    ).toHaveValue(value);
    await user.click(screen.getByText('可视化构建'));
    expect(screen.getByText('第 2 层条件组:')).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('turns an edited nested JSON condition into the same visual groups', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const value =
      '{"$and":[{"$or":[{"currentOwnerId":"${user.id}"},{"purchaserId":"${user.id}"}]},{"status":"PAID"}]}';
    render(<DataRuleBuilder value="{}" resource="order" onChange={onChange} />);
    await user.click(screen.getByText('JSON 源码'));
    await user.clear(screen.getByPlaceholderText('例如 {"departmentId": "${user.departmentId}"}'));
    await user.paste(value);
    expect(onChange).toHaveBeenLastCalledWith(value);
    await user.click(screen.getByText('可视化构建'));
    expect(screen.getByText('第 2 层条件组:')).toBeInTheDocument();
  });

  it('keeps unsupported JSON in source mode', () => {
    const value = '{"NOT":{"status":"PAID"}}';
    render(<DataRuleBuilder value={value} resource="order" />);
    expect(screen.getByDisplayValue(value)).toBeInTheDocument();
    expect(screen.getByText('可视化构建').closest('label')).toHaveClass(
      'ant-segmented-item-disabled'
    );
  });

  it('makes a new empty subgroup invalid until it contains a condition', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DataRuleBuilder value="{}" resource="order" onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: /添加条件组/ }));
    expect(screen.getByText(/空条件组无法保存/)).toBeInTheDocument();
    const invalidJson = onChange.mock.lastCall?.[0] as string;
    expect(validateConditionJson(invalidJson, 'order')).toContain('至少需要');
    await user.click(screen.getAllByRole('button', { name: /添加条件$/ })[1]);
    const validJson = onChange.mock.lastCall?.[0] as string;
    expect(validateConditionJson(validJson, 'order')).toBeNull();
  });

  it('shows resource-specific grouped templates and applies the selected condition', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(
      <DataRuleBuilder value="{}" resource="order" onChange={onChange} />
    );

    await user.click(screen.getByRole('combobox', { name: '选择规则模板' }));
    expect(document.querySelector('.data-rule-template-popup')).toBeInTheDocument();
    expect(screen.getByText('订单归属')).toBeInTheDocument();
    expect(screen.getByText('交易条件')).toBeInTheDocument();
    expect(screen.queryByText('本部门项目')).not.toBeInTheDocument();
    await user.click(screen.getByText('仅本人负责'));
    expect(onChange).toHaveBeenLastCalledWith(
      JSON.stringify({ currentOwnerId: '${user.id}' }, null, 2)
    );

    rerender(<DataRuleBuilder value="{}" resource="project" onChange={onChange} />);
    await user.click(screen.getByRole('combobox', { name: '选择规则模板' }));
    expect(screen.getByText('项目归属')).toBeInTheDocument();
    expect(screen.getByText('本部门项目')).toBeInTheDocument();
  });

  it('aligns the template action with the editor mode and explains replacement on demand', async () => {
    const user = userEvent.setup();
    render(<DataRuleBuilder value="{}" resource="order" />);

    const toolbar = screen
      .getByRole('combobox', { name: '选择规则模板' })
      .closest('.data-rule-editor-toolbar');
    expect(toolbar).toContainElement(screen.getByText('可视化构建'));
    expect(toolbar).toContainElement(screen.getByText('JSON 源码'));
    expect(screen.queryByText('选择后替换当前条件')).not.toBeInTheDocument();

    await user.hover(screen.getByRole('button', { name: '模板使用说明' }));
    expect(await screen.findByText('选择模板会替换当前规则条件')).toBeInTheDocument();
  });

  it('keeps the compact rule summary collapsed until requested', async () => {
    const user = userEvent.setup();
    const value = JSON.stringify({
      $and: [
        { currentOwnerId: '${user.id}' },
        { $or: [{ purchaserId: '${user.id}' }, { status: 'PAID' }] },
      ],
    });
    render(<DataRuleBuilder value={value} resource="order" />);

    expect(screen.getByText('同时满足：1 项条件、1 个条件组')).toBeInTheDocument();
    expect(screen.getByText('规则摘要').closest('details')).not.toHaveAttribute('open');
    await user.click(screen.getByText('规则摘要'));
    expect(screen.getByText('规则摘要').closest('details')).toHaveAttribute('open');
    expect(screen.getByText('负责人是当前登录用户')).toBeInTheDocument();
    expect(screen.getByText('满足任一项')).toBeInTheDocument();
  });

  it('shows a compact full-access summary and advisory warnings', () => {
    const { rerender } = render(<DataRuleBuilder value="{}" resource="order" />);
    expect(screen.getByText('匹配此资源的全部数据')).toBeInTheDocument();
    rerender(<DataRuleBuilder value='{"currentOwnerId":"${user.id}"}' resource="order" />);
    expect(screen.getByText('负责人是当前登录用户')).toBeInTheDocument();
    expect(screen.getByText('规则摘要').closest('details')).toBeNull();
    rerender(
      <DataRuleBuilder
        value={JSON.stringify({ $and: [{ productId: '${user.id}' }, { productId: '${user.id}' }] })}
        resource="order"
      />
    );
    expect(screen.getByRole('status')).toHaveTextContent('重复条件');
    expect(screen.getByRole('status')).toHaveTextContent('产品 ID');
  });

  it('inserts a chosen variable inside existing JSON quotes at the caret', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const value = '{"currentOwnerId": ""}';
    render(<DataRuleBuilder value={value} resource="order" onChange={onChange} />);
    await user.click(screen.getByText('JSON 源码'));
    const editor = screen.getByPlaceholderText('例如 {"departmentId": "${user.departmentId}"}');
    expect(screen.getByRole('combobox', { name: '插入上下文变量' })).toBeDisabled();
    await user.click(editor);
    const position = value.lastIndexOf('"');
    (editor as HTMLTextAreaElement).setSelectionRange(position, position);
    fireEvent.select(editor);
    expect(screen.getByRole('combobox', { name: '插入上下文变量' })).not.toBeDisabled();

    await user.click(screen.getByRole('combobox', { name: '插入上下文变量' }));
    await user.click(screen.getByText('当前登录用户 ID'));
    await act(async () => {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    });

    expect(onChange).toHaveBeenLastCalledWith('{"currentOwnerId": "${user.id}"}');
    expect(editor).toHaveValue('{"currentOwnerId": "${user.id}"}');
    expect((editor as HTMLTextAreaElement).selectionStart).toBe(
      '{"currentOwnerId": "${user.id}'.length
    );
  });

  it('adds quotes when inserting a variable outside a JSON string', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const value = '{"currentOwnerId": }';
    render(<DataRuleBuilder value={value} resource="order" onChange={onChange} />);
    const editor = screen.getByPlaceholderText('例如 {"departmentId": "${user.departmentId}"}');
    await user.click(editor);
    const position = value.indexOf('}');
    (editor as HTMLTextAreaElement).setSelectionRange(position, position);
    fireEvent.select(editor);

    await user.click(screen.getByRole('combobox', { name: '插入上下文变量' }));
    await user.click(screen.getByText('当前登录用户 ID'));
    await act(async () => {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    });

    expect(onChange).toHaveBeenLastCalledWith('{"currentOwnerId": "${user.id}"}');
    expect((editor as HTMLTextAreaElement).selectionStart).toBe(
      '{"currentOwnerId": "${user.id}"'.length
    );
  });
});
