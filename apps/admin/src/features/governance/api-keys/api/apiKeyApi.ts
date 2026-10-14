/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2026-01-23 13:22:34
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2026-01-23 19:04:13
 * @FilePath: /nove-admin/src/features/platform-governance/api-keys/api/apiKeyApi.ts
 * @Description:
 *
 * Copyright (c) 2026 by LuLab-Team, All Rights Reserved.
 */
import type {
  ApiKey,
  ApiKeyListParams,
  ApiKeyListData,
  CreateApiKey,
  CreateApiKeyResult,
  UpdateApiKey,
  RotateApiKeyResult,
} from '../types';
import {
  apiKeyControllerListKeys,
  apiKeyControllerCreateKey,
  apiKeyControllerUpdateKey,
  apiKeyControllerRevokeKey,
  apiKeyControllerRotateKey,
} from '../../../../shared/lib/api/orval/business/admin-api-keys';

export const apiKeyApi = {
  list: async (params: ApiKeyListParams): Promise<ApiKeyListData> => {
    const result = await apiKeyControllerListKeys(params);
    return {
      data: result.items,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    };
  },

  create: (data: CreateApiKey): Promise<CreateApiKeyResult> => {
    return apiKeyControllerCreateKey(data);
  },

  update: (id: string, data: UpdateApiKey): Promise<ApiKey> => {
    return apiKeyControllerUpdateKey(id, data);
  },

  revoke: (id: string): Promise<void> => {
    return apiKeyControllerRevokeKey(id);
  },

  rotate: (id: string): Promise<RotateApiKeyResult> => {
    return apiKeyControllerRotateKey(id);
  },
};
