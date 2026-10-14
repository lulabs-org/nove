export interface TaskHandlerPayloadValues {
  handler: string;
  httpUrl?: string;
  httpMethod?: string;
  httpTimeout?: number;
  httpHeadersText?: string;
  httpDataText?: string;
  customPayloadText?: string;
  linkPlatform?: string;
  linkBatchSize?: number;
  orderLinkBatchSize?: number;
}

function parsePayload(text: string, label = 'Payload'): Record<string, unknown> {
  const parsed: unknown = JSON.parse(text || '{}');

  if (parsed === null || Array.isArray(parsed) || typeof parsed !== 'object') {
    throw new Error(`${label} 必须是 JSON 对象`);
  }

  return parsed as Record<string, unknown>;
}

export function buildHandlerPayload(values: TaskHandlerPayloadValues): Record<string, unknown> {
  if (values.handler === 'migrate_phone_hashes') return {};

  if (values.handler === 'link_platform_users_by_phone_hash') {
    return {
      ...(values.linkPlatform && values.linkPlatform !== 'ALL'
        ? { platform: values.linkPlatform }
        : {}),
      batchSize: values.linkBatchSize ?? 500,
    };
  }

  if (values.handler === 'link_orders_to_users_by_phone') {
    return { batchSize: values.orderLinkBatchSize ?? 500 };
  }

  if (values.handler === 'invoke_http') {
    return {
      url: values.httpUrl,
      method: values.httpMethod || 'POST',
      timeout: values.httpTimeout || 10000,
      headers: parsePayload(values.httpHeadersText || '{}', '请求头'),
      data: parsePayload(values.httpDataText || '{}', '请求体'),
    };
  }

  return parsePayload(values.customPayloadText || '{}');
}
