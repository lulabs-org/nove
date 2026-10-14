import { describe, expect, it } from 'vitest';
import {
  conditionToVisualRules,
  createEmptyConditionGroup,
  describeRuleBriefly,
  getConditionWarnings,
  visualRulesToCondition,
  validateConditionJson,
  explainCondition,
  simulateCondition,
  getResourceFields,
  SYSTEM_RESOURCES,
  PRESET_TEMPLATES,
  getPresetTemplatesForResource,
} from './dataRuleConstants';

describe('dataRuleConstants', () => {
  it('defines known system resources with valid schema fields', () => {
    expect(SYSTEM_RESOURCES.length).toBeGreaterThanOrEqual(5);
    const orderFields = getResourceFields('order');
    expect(orderFields.map((f) => f.name)).toContain('currentOwnerId');
    expect(orderFields.map((f) => f.name)).toContain('amount');
  });

  describe('conditionToVisualRules', () => {
    it('handles empty or blank conditions as empty rules', () => {
      expect(conditionToVisualRules('')).toEqual(createEmptyConditionGroup());
      expect(conditionToVisualRules('{}')).toEqual(createEmptyConditionGroup());
    });

    it('parses single direct equality with context variable', () => {
      const json = JSON.stringify({ currentOwnerId: '${user.id}' });
      const res = conditionToVisualRules(json);
      expect(res).not.toBeNull();
      expect(res?.combinator).toBe('AND');
      expect(res?.children).toHaveLength(1);
      expect(res?.children[0]).toMatchObject({
        kind: 'rule',
        field: 'currentOwnerId',
        operator: '$eq',
        valueType: 'variable',
        value: '${user.id}',
      });
    });

    it('parses operator conditions like $lte or $in', () => {
      const json = JSON.stringify({
        departmentId: { $in: '${user.departmentIds}' },
        amount: { $lte: 5000 },
      });
      const res = conditionToVisualRules(json);
      expect(res).not.toBeNull();
      expect(res?.children).toHaveLength(2);

      const deptRule = res?.children.find(
        (node) => node.kind === 'rule' && node.field === 'departmentId'
      );
      expect(deptRule).toMatchObject({ operator: '$in', valueType: 'variable' });

      const amountRule = res?.children.find(
        (node) => node.kind === 'rule' && node.field === 'amount'
      );
      expect(amountRule).toMatchObject({ operator: '$lte', value: '5000' });
    });

    it('parses $or top-level grouping', () => {
      const json = JSON.stringify({
        $or: [{ currentOwnerId: '${user.id}' }, { purchaserId: '${user.id}' }],
      });
      const res = conditionToVisualRules(json);
      expect(res).not.toBeNull();
      expect(res?.combinator).toBe('OR');
      expect(res?.children).toHaveLength(2);
      expect(res?.children[0]).toMatchObject({ kind: 'rule', field: 'currentOwnerId' });
      expect(res?.children[1]).toMatchObject({ kind: 'rule', field: 'purchaserId' });
    });

    it('parses nested AND/OR groups and preserves the rule on serialization', () => {
      const original = {
        $and: [
          { $or: [{ currentOwnerId: '${user.id}' }, { purchaserId: '${user.id}' }] },
          { status: 'PAID' },
        ],
      };
      const visual = conditionToVisualRules(JSON.stringify(original));
      expect(visual?.combinator).toBe('AND');
      expect(visual?.children[0]).toMatchObject({ kind: 'group', combinator: 'OR' });
      expect(JSON.parse(visualRulesToCondition(visual!))).toEqual(original);
    });

    it('preserves duplicate field filters and string constants across round trips', () => {
      const original = {
        $and: [{ amount: { $gte: 100 } }, { amount: { $lte: 500 } }, { orderCode: '00123' }],
      };
      const visual = conditionToVisualRules(JSON.stringify(original));
      expect(JSON.parse(visualRulesToCondition(visual!))).toEqual(original);
    });

    it('keeps a single nested group after switching through JSON', () => {
      const visual = {
        kind: 'group' as const,
        id: 'root',
        combinator: 'AND' as const,
        children: [
          {
            kind: 'group' as const,
            id: 'group-1',
            combinator: 'OR' as const,
            children: [
              {
                kind: 'rule' as const,
                id: 'rule-1',
                field: 'currentOwnerId',
                operator: '$eq',
                valueType: 'variable' as const,
                value: '${user.id}',
              },
            ],
          },
        ],
      };
      const parsed = conditionToVisualRules(visualRulesToCondition(visual));
      expect(parsed?.children[0]).toMatchObject({ kind: 'group', combinator: 'OR' });
    });

    it('returns null for invalid JSON or unsupported operators', () => {
      expect(conditionToVisualRules('not a json')).toBeNull();
      expect(conditionToVisualRules(JSON.stringify([1, 2, 3]))).toBeNull();
      expect(conditionToVisualRules('{"$or":[{"status":{"$regex":"PAID"}}]}')).toBeNull();
    });
  });

  describe('visualRulesToCondition', () => {
    it('serializes AND rules into standard JSON', () => {
      const json = visualRulesToCondition({
        kind: 'group',
        id: 'root',
        combinator: 'AND',
        children: [
          {
            kind: 'rule',
            id: '1',
            field: 'currentOwnerId',
            operator: '$eq',
            valueType: 'variable',
            value: '${user.id}',
          },
          {
            kind: 'rule',
            id: '2',
            field: 'amount',
            operator: '$lte',
            valueType: 'constant',
            value: '100000',
          },
        ],
      });
      const parsed = JSON.parse(json);
      expect(parsed).toEqual({
        currentOwnerId: '${user.id}',
        amount: { $lte: 100000 },
      });
    });

    it('serializes OR rules into $or array', () => {
      const json = visualRulesToCondition({
        kind: 'group',
        id: 'root',
        combinator: 'OR',
        children: [
          {
            kind: 'rule',
            id: '1',
            field: 'currentOwnerId',
            operator: '$eq',
            valueType: 'variable',
            value: '${user.id}',
          },
          {
            kind: 'rule',
            id: '2',
            field: 'purchaserId',
            operator: '$eq',
            valueType: 'variable',
            value: '${user.id}',
          },
        ],
      });
      const parsed = JSON.parse(json);
      expect(parsed).toEqual({
        $or: [{ currentOwnerId: '${user.id}' }, { purchaserId: '${user.id}' }],
      });
    });

    it('returns empty json for blank rules', () => {
      expect(visualRulesToCondition(createEmptyConditionGroup())).toBe('{}');
    });
  });

  describe('validateConditionJson', () => {
    it('accepts nested order filters and explicit full access', () => {
      expect(validateConditionJson('{}', 'order')).toBeNull();
      expect(
        validateConditionJson(
          '{"$and":[{"$or":[{"currentOwnerId":"${user.id}"},{"purchaserId":"${user.id}"}]},{"status":"PAID"}]}',
          'order'
        )
      ).toBeNull();
    });

    it('rejects empty groups, unsupported operators, unknown order fields and excessive depth', () => {
      expect(validateConditionJson('{"$or":[]}', 'order')).toContain('至少需要');
      expect(validateConditionJson('{"$and":[{}]}', 'order')).toContain('不能为空');
      expect(validateConditionJson('{"status":{"$regex":"PAID"}}', 'order')).toContain('操作符');
      expect(validateConditionJson('{"departmentId":"dept-1"}', 'order')).toContain('不存在');
      expect(
        validateConditionJson('{"$or":[{"status":"PAID"}],"OR":[{"status":"UNPAID"}]}', 'order')
      ).toContain('重复');
      expect(validateConditionJson('{"status":{"$ne":"PAID","not":"UNPAID"}}', 'order')).toContain(
        '重复'
      );
      const nested = {
        $and: [{ $or: [{ $and: [{ $or: [{ $and: [{ currentOwnerId: 'usr-1' }] }] }] }] }],
      };
      expect(validateConditionJson(JSON.stringify(nested), 'order')).toContain('最多嵌套');
    });
  });

  describe('explainCondition', () => {
    it('explains empty condition as full access', () => {
      expect(explainCondition('{}')).toContain('全量开放');
    });

    it('explains owner equality condition in human-readable terms', () => {
      const explanation = explainCondition(
        JSON.stringify({ currentOwnerId: '${user.id}' }),
        'order'
      );
      expect(explanation).toContain('负责人 ID');
      expect(explanation).toContain('当前登录用户 ID');
    });

    it('explains $or condition clearly', () => {
      const explanation = explainCondition(
        JSON.stringify({
          $or: [{ currentOwnerId: '${user.id}' }, { purchaserId: '${user.id}' }],
        }),
        'order'
      );
      expect(explanation).toContain('满足以下任一条件');
      expect(explanation).toContain('负责人 ID');
      expect(explanation).toContain('购买者 ID');
    });
  });

  describe('compact condition summary', () => {
    it('uses short labels without technical field identifiers', () => {
      const group = conditionToVisualRules('{"currentOwnerId":"${user.id}"}');
      const rule = group?.children[0];
      expect(rule?.kind).toBe('rule');
      if (rule?.kind === 'rule') {
        expect(describeRuleBriefly(rule, 'order')).toBe('负责人是当前登录用户');
      }
    });

    it('advises on duplicates within one group and incompatible variables', () => {
      const group = conditionToVisualRules(
        JSON.stringify({
          $and: [
            { currentOwnerId: '${user.id}' },
            { currentOwnerId: '${user.id}' },
            { productId: '${user.id}' },
          ],
        })
      );
      expect(group).not.toBeNull();
      const warnings = getConditionWarnings(group!, 'order');
      expect(warnings).toContain('同一条件组存在重复条件，建议合并。');
      expect(warnings).toContain('产品 ID 与所选上下文变量可能不匹配，请核对。');
    });

    it('does not flag matching owner and department variables', () => {
      const group = conditionToVisualRules(
        JSON.stringify({ departmentId: { $in: '${user.departmentIds}' } })
      );
      expect(getConditionWarnings(group!, 'user')).toEqual([]);
    });
  });

  describe('simulateCondition', () => {
    it('replaces context variables with mock values', () => {
      const simulated = simulateCondition(
        JSON.stringify({
          currentOwnerId: '${user.id}',
          departmentId: { $in: '${user.departmentIds}' },
          status: 'PAID',
        }),
        {
          '${user.id}': 'test_user_1',
          '${user.departmentIds}': ['dept_a', 'dept_b'],
        }
      );

      expect(simulated).toEqual({
        currentOwnerId: 'test_user_1',
        departmentId: { $in: ['dept_a', 'dept_b'] },
        status: 'PAID',
      });
    });
  });

  describe('preset templates', () => {
    it('all preset templates have valid JSON conditions', () => {
      for (const t of PRESET_TEMPLATES) {
        expect(() => JSON.parse(t.condition)).not.toThrow();
        expect(validateConditionJson(t.condition, t.resource)).toBeNull();
      }
    });

    it('offers only matching resource templates plus the common option', () => {
      for (const resource of SYSTEM_RESOURCES) {
        const templates = getPresetTemplatesForResource(resource.resource);
        expect(templates.some((template) => template.resource === resource.resource)).toBe(true);
        expect(
          templates.every(
            (template) => !template.resource || template.resource === resource.resource
          )
        ).toBe(true);
        for (const template of templates.filter((item) => item.resource)) {
          const fields = getResourceFields(resource.resource).map((field) => field.name);
          const condition = JSON.parse(template.condition) as Record<string, unknown>;
          expect(Object.keys(condition).every((key) => fields.includes(key))).toBe(true);
        }
      }
      expect(getPresetTemplatesForResource()).toEqual([]);
    });

    it('exposes public-pool access only as an explicit order template', () => {
      const template = PRESET_TEMPLATES.find((item) => item.name === '公海未认领订单');

      expect(template).toMatchObject({ resource: 'order' });
      expect(JSON.parse(template?.condition || '{}')).toEqual({ currentOwnerId: null });
    });
  });
});
