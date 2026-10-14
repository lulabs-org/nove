type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
type JsonObject = { [key: string]: JsonValue };

function isJsonValue(value: unknown): value is JsonValue {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return true;
  }
  if (Array.isArray(value)) {
    return value.every(isJsonValue);
  }
  return isJsonObject(value);
}

function isJsonObject(value: unknown): value is JsonObject {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value as Record<string, unknown>).every(isJsonValue)
  );
}

function stringifyJsonValue(value: JsonValue): string {
  return typeof value === 'string' ? value : JSON.stringify(value);
}

export interface ResourceField {
  name: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'enum' | 'userRef' | 'deptRef';
  options?: Array<{ label: string; value: string }>;
  description?: string;
}

export interface ResourceDefinition {
  resource: string;
  label: string;
  description: string;
  fields: ResourceField[];
}

export interface ContextVariable {
  key: string;
  label: string;
  description: string;
  type: 'string' | 'array';
  example: string;
}

export interface ActionDefinition {
  key: string;
  label: string;
  description: string;
  color: string;
}

export interface OperatorDefinition {
  key: string;
  label: string;
  symbol: string;
  applicableTypes?: Array<ResourceField['type']>;
}

export interface PresetTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  resource?: string;
  condition: string;
}

export interface VisualRuleItem {
  kind: 'rule';
  id: string;
  field: string;
  operator: string;
  valueType: 'variable' | 'constant';
  value: string;
  originalValue?: JsonValue;
}

export interface VisualConditionGroup {
  kind: 'group';
  id: string;
  combinator: 'AND' | 'OR';
  children: Array<VisualConditionGroup | VisualRuleItem>;
}

export const MAX_CONDITION_DEPTH = 5;
export const MAX_CONDITION_NODES = 100;

export function createEmptyConditionGroup(): VisualConditionGroup {
  return { kind: 'group', id: 'root', combinator: 'AND', children: [] };
}

export const SYSTEM_RESOURCES: ResourceDefinition[] = [
  {
    resource: 'order',
    label: '订单 (Order)',
    description: '交易订单、履约及权益记录',
    fields: [
      {
        name: 'currentOwnerId',
        label: '负责人 ID',
        type: 'userRef',
        description: '当前处理/跟进此订单的员工 ID',
      },
      {
        name: 'purchaserId',
        label: '购买者 ID',
        type: 'userRef',
        description: '发起下单或购买的企业/个人客户 ID',
      },
      { name: 'productId', label: '产品 ID', type: 'string' },
      {
        name: 'status',
        label: '订单状态',
        type: 'enum',
        options: [
          { label: '待支付 (UNPAID)', value: 'UNPAID' },
          { label: '已支付 (PAID)', value: 'PAID' },
          { label: '已完成 (COMPLETED)', value: 'COMPLETED' },
          { label: '已取消 (CANCELLED)', value: 'CANCELLED' },
          { label: '已冻结 (FROZEN)', value: 'FROZEN' },
        ],
      },
      {
        name: 'amount',
        label: '订单金额',
        type: 'number',
        description: '订单金额（最小货币单位：分）',
      },
      { name: 'currency', label: '币种', type: 'string', description: '货币类型如 CNY、USD' },
    ],
  },
  {
    resource: 'user',
    label: '用户 (User)',
    description: '企业员工、用户账号及档案',
    fields: [
      { name: 'id', label: '用户 ID', type: 'userRef' },
      { name: 'departmentId', label: '所属部门 ID', type: 'deptRef' },
      { name: 'role', label: '角色编码', type: 'string' },
      {
        name: 'status',
        label: '账号状态',
        type: 'enum',
        options: [
          { label: '正常 (ACTIVE)', value: 'ACTIVE' },
          { label: '禁用 (DISABLED)', value: 'DISABLED' },
        ],
      },
    ],
  },
  {
    resource: 'project',
    label: '项目 (Project)',
    description: '协同项目、研发交付及工单',
    fields: [
      { name: 'ownerId', label: '项目负责人 ID', type: 'userRef' },
      { name: 'departmentId', label: '归属部门 ID', type: 'deptRef' },
      {
        name: 'status',
        label: '项目状态',
        type: 'enum',
        options: [
          { label: '规划中 (PLANNING)', value: 'PLANNING' },
          { label: '进行中 (IN_PROGRESS)', value: 'IN_PROGRESS' },
          { label: '已完成 (COMPLETED)', value: 'COMPLETED' },
          { label: '已归档 (ARCHIVED)', value: 'ARCHIVED' },
        ],
      },
    ],
  },
  {
    resource: 'product',
    label: '商品/服务 (Product)',
    description: '商城商品、SKU 及标的物',
    fields: [
      { name: 'creatorId', label: '创建人 ID', type: 'userRef' },
      {
        name: 'status',
        label: '上架状态',
        type: 'enum',
        options: [
          { label: '已上架 (ON_SHELF)', value: 'ON_SHELF' },
          { label: '已下架 (OFF_SHELF)', value: 'OFF_SHELF' },
        ],
      },
    ],
  },
  {
    resource: 'minute',
    label: '会议纪要 (Minute)',
    description: '会议转写、纪要与待办事项',
    fields: [
      { name: 'creatorId', label: '发起人 ID', type: 'userRef' },
      { name: 'departmentId', label: '关联部门 ID', type: 'deptRef' },
      {
        name: 'privacyLevel',
        label: '保密级别',
        type: 'enum',
        options: [
          { label: '全员公开 (PUBLIC)', value: 'PUBLIC' },
          { label: '部门可见 (INTERNAL)', value: 'INTERNAL' },
          { label: '机密私有 (CONFIDENTIAL)', value: 'CONFIDENTIAL' },
        ],
      },
    ],
  },
];

export const CONTEXT_VARIABLES: ContextVariable[] = [
  {
    key: '${user.id}',
    label: '当前登录用户 ID',
    description: '运行时动态匹配当前操作人自身的 ID',
    type: 'string',
    example: 'usr_clq0a...',
  },
  {
    key: '${user.departmentId}',
    label: '当前用户所属部门 ID',
    description: '运行时动态匹配当前操作人所在的直属部门 ID',
    type: 'string',
    example: 'dept_dev_01',
  },
  {
    key: '${user.departmentIds}',
    label: '本部门及所有子部门 IDs',
    description: '包含当前用户直属部门及其下辖所有层级子部门的数组',
    type: 'array',
    example: '["dept_01", "dept_02"]',
  },
  {
    key: '${user.roles}',
    label: '当前用户所属角色列表',
    description: '当前用户被授予的所有角色标识列表',
    type: 'array',
    example: '["SALES", "MANAGER"]',
  },
  {
    key: '${user.companyId}',
    label: '当前企业/租户 ID',
    description: '当前登录人归属的企业机构编码',
    type: 'string',
    example: 'org_main',
  },
];

export const SYSTEM_ACTIONS: ActionDefinition[] = [
  {
    key: '*',
    label: '全部操作 (*)',
    description: '适用于对该资源的所有操作（通配符）',
    color: 'purple',
  },
  {
    key: 'read',
    label: '查看/查询 (read)',
    description: '数据查询、列表浏览与详情查看',
    color: 'blue',
  },
  {
    key: 'create',
    label: '创建/新增 (create)',
    description: '新增业务数据记录',
    color: 'green',
  },
  {
    key: 'update',
    label: '编辑/修改 (update)',
    description: '修改/编辑已有数据记录',
    color: 'orange',
  },
  {
    key: 'delete',
    label: '删除 (delete)',
    description: '删除数据记录',
    color: 'red',
  },
  {
    key: 'export',
    label: '导出 (export)',
    description: '批量导出数据报表',
    color: 'cyan',
  },
];

export function getActionMeta(actionKey?: string): ActionDefinition {
  const normalized = actionKey?.trim() || '*';
  const found = SYSTEM_ACTIONS.find((item) => item.key === normalized);
  if (found) return found;
  return {
    key: normalized,
    label: normalized,
    description: `自定义操作: ${normalized}`,
    color: 'default',
  };
}

export const OPERATORS: OperatorDefinition[] = [
  { key: '$eq', label: '等于 (=)', symbol: '=' },
  { key: '$ne', label: '不等于 (≠)', symbol: '!=' },
  { key: '$in', label: '包含于 (IN)', symbol: 'IN' },
  { key: '$nin', label: '不包含于 (NOT IN)', symbol: 'NOT IN' },
  { key: '$gt', label: '大于 (>)', symbol: '>' },
  { key: '$gte', label: '大于等于 (≥)', symbol: '>=' },
  { key: '$lt', label: '小于 (<)', symbol: '<' },
  { key: '$lte', label: '小于等于 (≤)', symbol: '<=' },
  { key: 'isNull', label: '为空 (IS NULL)', symbol: 'IS NULL' },
  { key: 'isNotNull', label: '不为空 (NOT NULL)', symbol: 'IS NOT NULL' },
];

export const PRESET_TEMPLATES: PresetTemplate[] = [
  {
    id: 'all',
    name: '全量开放 (无限制)',
    description: '允许访问此资源下的所有数据行',
    category: '通用',
    condition: '{\n  \n}',
  },
  {
    id: 'order-owner',
    name: '仅本人负责',
    description: '只能访问由当前操作人员负责的订单',
    category: '订单归属',
    resource: 'order',
    condition: JSON.stringify({ currentOwnerId: '${user.id}' }, null, 2),
  },
  {
    id: 'order-purchaser',
    name: '仅本人购买的订单',
    description: '只能访问当前操作人购买的订单',
    category: '订单归属',
    resource: 'order',
    condition: JSON.stringify({ purchaserId: '${user.id}' }, null, 2),
  },
  {
    id: 'order-public-pool',
    name: '公海未认领订单',
    description: '允许访问尚未分配负责人的订单；需要显式分配给角色后才会生效',
    category: '订单归属',
    resource: 'order',
    condition: JSON.stringify({ currentOwnerId: null }, null, 2),
  },
  {
    id: 'order-amount-limit',
    name: '金额限额 (<= 10万元)',
    description: '仅能访问金额在 100,000 元及以下的订单（条件值为分）',
    category: '交易条件',
    resource: 'order',
    condition: JSON.stringify({ amount: { $lte: 10000000 } }, null, 2),
  },
  {
    id: 'user-self',
    name: '仅本人账号',
    description: '匹配当前登录用户的账号记录',
    category: '人员范围',
    resource: 'user',
    condition: JSON.stringify({ id: '${user.id}' }, null, 2),
  },
  {
    id: 'user-department',
    name: '本部门数据',
    description: '仅能访问当前用户所属直属部门的数据',
    category: '人员范围',
    condition: JSON.stringify({ departmentId: '${user.departmentId}' }, null, 2),
    resource: 'user',
  },
  {
    id: 'user-department-tree',
    name: '本部门及下级部门',
    description: '允许访问当前部门及其下属所有子部门的数据',
    category: '人员范围',
    condition: JSON.stringify({ departmentId: { $in: '${user.departmentIds}' } }, null, 2),
    resource: 'user',
  },
  {
    id: 'project-owner',
    name: '仅本人负责的项目',
    description: '匹配当前登录用户负责的项目',
    category: '项目归属',
    resource: 'project',
    condition: JSON.stringify({ ownerId: '${user.id}' }, null, 2),
  },
  {
    id: 'project-department',
    name: '本部门项目',
    description: '匹配当前用户所属部门的项目',
    category: '项目归属',
    resource: 'project',
    condition: JSON.stringify({ departmentId: '${user.departmentId}' }, null, 2),
  },
  {
    id: 'product-creator',
    name: '仅本人创建的商品',
    description: '匹配当前登录用户创建的商品或服务',
    category: '商品归属',
    resource: 'product',
    condition: JSON.stringify({ creatorId: '${user.id}' }, null, 2),
  },
  {
    id: 'minute-creator',
    name: '仅本人发起的纪要',
    description: '匹配当前登录用户发起的会议纪要',
    category: '纪要归属',
    resource: 'minute',
    condition: JSON.stringify({ creatorId: '${user.id}' }, null, 2),
  },
  {
    id: 'minute-department',
    name: '本部门纪要',
    description: '匹配当前用户所属部门的会议纪要',
    category: '纪要归属',
    resource: 'minute',
    condition: JSON.stringify({ departmentId: '${user.departmentId}' }, null, 2),
  },
];

export function getPresetTemplatesForResource(resource?: string): PresetTemplate[] {
  if (!resource) return [];
  const normalized = resource.trim().toLowerCase();
  return [
    ...PRESET_TEMPLATES.filter((template) => template.resource === normalized),
    ...PRESET_TEMPLATES.filter((template) => !template.resource),
  ];
}

export function getResourceFields(resourceName?: string): ResourceField[] {
  if (!resourceName) return [];
  const found = SYSTEM_RESOURCES.find(
    (item) => item.resource.toLowerCase() === resourceName.trim().toLowerCase()
  );
  return found ? found.fields : [];
}

export function getFieldLabel(fieldKey: string, resourceName?: string): string {
  const fields = getResourceFields(resourceName);
  const found = fields.find((f) => f.name === fieldKey);
  return found ? `${found.label} (${found.name})` : fieldKey;
}

export function getVariableLabel(variableKey: string): string {
  const found = CONTEXT_VARIABLES.find((v) => v.key === variableKey);
  return found ? `${found.label} (${variableKey})` : variableKey;
}

export function getOperatorLabel(opKey: string): string {
  const found = OPERATORS.find((op) => op.key === opKey);
  return found ? found.label : opKey;
}

type VisualConditionNode = VisualConditionGroup | VisualRuleItem;

function parseFieldCondition(
  field: string,
  value: JsonValue,
  id: string
): VisualConditionNode | null {
  if (value === null) {
    return { kind: 'rule', id, field, operator: 'isNull', valueType: 'constant', value: '' };
  }

  const makeRule = (operator: string, innerValue: JsonValue, ruleId: string): VisualRuleItem => {
    const text = stringifyJsonValue(innerValue);
    return {
      kind: 'rule',
      id: ruleId,
      field,
      operator,
      valueType: CONTEXT_VARIABLES.some((variable) => variable.key === text)
        ? 'variable'
        : 'constant',
      value: text,
      originalValue: innerValue,
    };
  };

  if (!isJsonObject(value)) return makeRule('$eq', value, id);

  const operators = Object.entries(value);
  if (operators.length === 0) return null;
  const rules: VisualRuleItem[] = [];
  for (const [operator, innerValue] of operators) {
    const alias =
      operator === 'equals'
        ? '$eq'
        : operator === 'not'
          ? '$ne'
          : operator === 'notIn'
            ? '$nin'
            : operator;
    const matched = OPERATORS.find((item) => item.key === alias || item.key === `$${alias}`);
    if (!matched || isJsonObject(innerValue)) return null;
    if (matched.key === '$ne' && innerValue === null) {
      rules.push({
        kind: 'rule',
        id: `${id}_${rules.length}`,
        field,
        operator: 'isNotNull',
        valueType: 'constant',
        value: '',
      });
    } else {
      rules.push(makeRule(matched.key, innerValue, `${id}_${rules.length}`));
    }
  }
  return rules.length === 1 ? rules[0] : { kind: 'group', id, combinator: 'AND', children: rules };
}

function parseConditionNode(
  value: JsonValue,
  id: string,
  depth: number,
  count: { value: number }
): VisualConditionNode | null {
  if (!isJsonObject(value) || depth > MAX_CONDITION_DEPTH || ++count.value > MAX_CONDITION_NODES)
    return null;
  const children: VisualConditionNode[] = [];
  for (const [key, entry] of Object.entries(value)) {
    if (key === '$and' || key === 'AND' || key === '$or' || key === 'OR') {
      if (!Array.isArray(entry) || entry.length === 0) return null;
      const groupChildren: VisualConditionNode[] = [];
      for (let index = 0; index < entry.length; index++) {
        const child = parseConditionNode(
          entry[index],
          `${id}_${children.length}_${index}`,
          depth + 1,
          count
        );
        if (!child) return null;
        groupChildren.push(child);
      }
      children.push({
        kind: 'group',
        id: `${id}_${children.length}`,
        combinator: key.toLowerCase().includes('or') ? 'OR' : 'AND',
        children: groupChildren,
      });
    } else {
      if (!key.trim() || key.startsWith('$')) return null;
      const child = parseFieldCondition(key, entry, `${id}_${children.length}`);
      if (!child) return null;
      children.push(child);
    }
  }
  if (children.length === 1) return children[0];
  return { kind: 'group', id, combinator: 'AND', children };
}

/** Returns null when the source cannot be edited visually without changing its meaning. */
export function conditionToVisualRules(conditionJson?: string): VisualConditionGroup | null {
  if (!conditionJson || !conditionJson.trim()) return createEmptyConditionGroup();
  let parsed: unknown;
  try {
    parsed = JSON.parse(conditionJson) as unknown;
  } catch {
    return null;
  }
  if (!isJsonObject(parsed)) return null;
  const node = parseConditionNode(parsed, 'root', 1, { value: 0 });
  if (!node) return null;
  return node.kind === 'group'
    ? { ...node, id: 'root' }
    : { ...createEmptyConditionGroup(), children: [node] };
}

function ruleValue(rule: VisualRuleItem): JsonValue {
  if (rule.originalValue !== undefined && stringifyJsonValue(rule.originalValue) === rule.value) {
    return rule.originalValue;
  }
  if (rule.valueType === 'variable') return rule.value;
  if (rule.value === 'true') return true;
  if (rule.value === 'false') return false;
  if (rule.value !== '' && !Number.isNaN(Number(rule.value))) return Number(rule.value);
  if (rule.value.startsWith('[')) {
    try {
      const parsed: unknown = JSON.parse(rule.value);
      if (isJsonValue(parsed)) return parsed;
    } catch {
      // A non-JSON value remains a literal string.
    }
  }
  return rule.value;
}

function serializeConditionNode(node: VisualConditionNode, root = false): JsonObject {
  if (node.kind === 'rule') {
    const value = ruleValue(node);
    if (node.operator === 'isNull') return { [node.field]: null };
    if (node.operator === 'isNotNull') return { [node.field]: { $ne: null } };
    return { [node.field]: node.operator === '$eq' ? value : { [node.operator]: value } };
  }
  const children = node.children.map((child) => serializeConditionNode(child));
  if (node.combinator === 'OR') return { $or: children };
  if (children.length === 0) return { $and: [] };
  if (children.length === 1) {
    return root && node.children[0].kind === 'rule' ? children[0] : { $and: children };
  }
  const allFields = children.every(
    (child) => Object.keys(child).length === 1 && !Object.keys(child)[0].startsWith('$')
  );
  const distinctFields =
    new Set(children.map((child) => Object.keys(child)[0])).size === children.length;
  if (allFields && distinctFields) return Object.assign({}, ...children) as JsonObject;
  return { $and: children };
}

export function visualRulesToCondition(group: VisualConditionGroup): string {
  if (group.children.length === 0) return '{}';
  return JSON.stringify(serializeConditionNode(group, true), null, 2);
}

const ORDER_FILTER_FIELDS = new Set([
  'id',
  'orderCode',
  'orderNumber',
  'externalId',
  'productId',
  'productName',
  'purchaserId',
  'channelId',
  'email',
  'phone',
  'phoneCode',
  'currentOwnerId',
  'financialCloserId',
  'financialClosedAt',
  'settledAt',
  'amount',
  'currency',
  'amountCny',
  'fxRateToCny',
  'fxLockedAt',
  'status',
  'paidAt',
  'cancelledAt',
  'completedAt',
  'durationDays',
  'benefitStart',
  'benefitEnd',
  'frozenDays',
  'frozenAt',
  'paymentProvider',
  'providerTradeNo',
  'createdAt',
  'updatedAt',
  'deletedAt',
]);

const FILTER_OPERATORS = new Set([
  'eq',
  'ne',
  'in',
  'nin',
  'gt',
  'gte',
  'lt',
  'lte',
  'equals',
  'not',
  'notIn',
]);

/** Validates the persisted rule shape, including nested groups and order scalar fields. */
export function validateConditionJson(conditionJson: string, resource?: string): string | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(conditionJson) as unknown;
  } catch {
    return '请输入有效的 JSON 条件';
  }
  if (!isJsonObject(parsed)) return '规则条件必须是 JSON 对象';

  let nodes = 0;
  const check = (obj: JsonObject, depth: number, root: boolean): string | null => {
    if (depth > MAX_CONDITION_DEPTH) return `条件组最多嵌套 ${MAX_CONDITION_DEPTH} 层`;
    if (!root && Object.keys(obj).length === 0) return '子条件不能为空';
    const seenLogicalKeys = new Set<string>();
    for (const [key, value] of Object.entries(obj)) {
      if (++nodes > MAX_CONDITION_NODES) return `条件最多包含 ${MAX_CONDITION_NODES} 个节点`;
      if (key === '$and' || key === 'AND' || key === '$or' || key === 'OR') {
        const canonical = key.toLowerCase().includes('or') ? 'OR' : 'AND';
        if (seenLogicalKeys.has(canonical)) return `重复的 ${canonical} 条件组`;
        seenLogicalKeys.add(canonical);
        if (!Array.isArray(value) || value.length === 0) return 'AND / OR 条件组至少需要一个条件';
        for (const child of value) {
          if (!isJsonObject(child)) return '条件组内必须是 JSON 对象';
          const error = check(child, depth + 1, false);
          if (error) return error;
        }
        continue;
      }
      if (
        !key.trim() ||
        key.startsWith('$') ||
        ['__proto__', 'constructor', 'prototype'].includes(key)
      ) {
        return `不支持的条件字段：${key}`;
      }
      if (resource?.toLowerCase() === 'order' && !ORDER_FILTER_FIELDS.has(key)) {
        return `订单不存在可过滤字段：${key}`;
      }
      if (Array.isArray(value)) return `字段 ${key} 不能直接使用数组，请使用 $in`;
      if (!isJsonObject(value)) continue;
      const operators = Object.entries(value);
      if (operators.length === 0) return `字段 ${key} 的操作符不能为空`;
      const seenOperators = new Set<string>();
      for (const [operator, operand] of operators) {
        const normalized = operator.startsWith('$') ? operator.slice(1) : operator;
        if (!FILTER_OPERATORS.has(normalized)) return `不支持的操作符：${operator}`;
        const canonical =
          normalized === 'eq'
            ? 'equals'
            : normalized === 'ne'
              ? 'not'
              : normalized === 'nin'
                ? 'notIn'
                : normalized;
        if (seenOperators.has(canonical)) return `字段 ${key} 存在重复操作符：${operator}`;
        seenOperators.add(canonical);
        if (normalized === 'in' || normalized === 'nin' || normalized === 'notIn') {
          const arrayVariable = operand === '${user.departmentIds}' || operand === '${user.roles}';
          if ((!Array.isArray(operand) || operand.length === 0) && !arrayVariable) {
            return `${operator} 需要非空数组或数组变量`;
          }
        } else if (Array.isArray(operand) || isJsonObject(operand)) {
          return `${operator} 需要单个值`;
        }
      }
    }
    return null;
  };
  return check(parsed, 1, true);
}

/**
 * Generates human-friendly Chinese natural language explanation of the rule condition.
 */
export function explainCondition(conditionJson?: string, resourceName?: string): string {
  if (!conditionJson || !conditionJson.trim()) {
    return '全量开放：允许访问该资源下的所有数据';
  }
  const error = validateConditionJson(conditionJson, resourceName);
  if (error) return `规则暂不完整：${error}`;
  const root = conditionToVisualRules(conditionJson);
  if (!root) return '规则包含不支持的条件，请在 JSON 源码中检查';
  if (root.children.length === 0) return '全量开放：允许访问该资源下的所有数据';

  const explainNode = (node: VisualConditionNode): string => {
    if (node.kind === 'group') {
      const connector = node.combinator === 'AND' ? ' 且 ' : ' 或 ';
      return `（${node.children.map(explainNode).join(connector)}）`;
    }
    const field = getFieldLabel(node.field, resourceName);
    if (node.operator === 'isNull') return `【${field}】为空`;
    if (node.operator === 'isNotNull') return `【${field}】不为空`;
    const variable = CONTEXT_VARIABLES.find((item) => item.key === node.value);
    const value = variable?.label ?? `"${node.value}"`;
    return `【${field}】${getOperatorLabel(node.operator)} ${value}`;
  };

  const connector = root.combinator === 'AND' ? ' 且 ' : ' 或 ';
  const prefix = root.combinator === 'AND' ? '必须同时满足：' : '满足以下任一条件：';
  return `${prefix}${root.children.map(explainNode).join(connector)}`;
}

/** Short labels for the editor's structured, expandable rule summary. */
export function describeRuleBriefly(rule: VisualRuleItem, resource?: string): string {
  const field = getResourceFields(resource).find((item) => item.name === rule.field);
  const fieldLabel = (field?.label ?? rule.field).replace(/\s*ID$/, '');
  if (rule.operator === 'isNull') return `${fieldLabel}为空`;
  if (rule.operator === 'isNotNull') return `${fieldLabel}不为空`;

  const operators: Record<string, string> = {
    $eq: '是',
    $ne: '不是',
    $in: '属于',
    $nin: '不属于',
    $gt: '大于',
    $gte: '不少于',
    $lt: '小于',
    $lte: '不超过',
  };
  const variables: Record<string, string> = {
    '${user.id}': '当前登录用户',
    '${user.departmentId}': '当前用户所属部门',
    '${user.departmentIds}': '当前部门及下级部门',
    '${user.roles}': '当前用户的角色',
    '${user.companyId}': '当前企业',
  };
  const enumLabel = field?.options?.find((option) => option.value === rule.value)?.label;
  const value = variables[rule.value] ?? enumLabel ?? rule.value;
  return `${fieldLabel}${operators[rule.operator] ?? getOperatorLabel(rule.operator)}${value}`;
}

/** Advisory only: never prevents saving a rule. */
export function getConditionWarnings(group: VisualConditionGroup, resource?: string): string[] {
  const warnings = new Set<string>();
  const fields = getResourceFields(resource);
  const visit = (current: VisualConditionGroup) => {
    const signatures = new Set<string>();
    for (const child of current.children) {
      if (child.kind === 'group') {
        visit(child);
        continue;
      }
      const signature = JSON.stringify([child.field, child.operator, child.valueType, child.value]);
      if (signatures.has(signature)) {
        warnings.add('同一条件组存在重复条件，建议合并。');
      }
      signatures.add(signature);

      if (child.valueType !== 'variable') continue;
      const field = fields.find((item) => item.name === child.field);
      if (!field) continue;
      const isUserId = child.value === '${user.id}';
      const isDepartment =
        child.value === '${user.departmentId}' || child.value === '${user.departmentIds}';
      const isArray = child.value === '${user.departmentIds}' || child.value === '${user.roles}';
      if (
        (isUserId && field.type !== 'userRef') ||
        (isDepartment && field.type !== 'deptRef') ||
        (isArray && child.operator !== '$in' && child.operator !== '$nin') ||
        ['number', 'boolean', 'enum'].includes(field.type)
      ) {
        warnings.add(`${field.label} 与所选上下文变量可能不匹配，请核对。`);
      }
    }
  };
  visit(group);
  return [...warnings];
}

/**
 * Simulates how context variables inside conditionJson will be substituted into a concrete query object.
 */
export function simulateCondition(
  conditionJson: string,
  mockContext: Record<string, JsonValue> = {
    '${user.id}': 'usr_demo_888',
    '${user.departmentId}': 'dept_sales_01',
    '${user.departmentIds}': ['dept_sales_01', 'dept_sales_north'],
    '${user.roles}': ['SALES_REPRESENTATIVE'],
    '${user.companyId}': 'org_enterprise_01',
  }
): JsonValue {
  if (!conditionJson || !conditionJson.trim()) {
    return {};
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(conditionJson) as unknown;
  } catch {
    return { _error: 'Invalid JSON' };
  }

  if (!isJsonValue(parsed)) {
    return { _error: 'Unsupported JSON value' };
  }

  const replaceVariables = (val: JsonValue): JsonValue => {
    if (val === null) return val;
    if (typeof val === 'string') {
      if (mockContext[val] !== undefined) {
        return mockContext[val];
      }
      return val;
    }
    if (Array.isArray(val)) {
      return val.map(replaceVariables);
    }
    if (isJsonObject(val)) {
      const out: JsonObject = {};
      for (const [k, v] of Object.entries(val)) {
        out[k] = replaceVariables(v);
      }
      return out;
    }
    return val;
  };

  return replaceVariables(parsed);
}
