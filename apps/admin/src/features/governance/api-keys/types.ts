/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2026-01-23 13:21:04
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2026-01-23 16:44:45
 * @FilePath: /nove-admin/src/features/platform-governance/api-keys/types.ts
 * @Description:
 *
 * Copyright (c) 2026 by LuLab-Team, All Rights Reserved.
 */
import type {
  ApiKeyDto,
  CreateApiKeyDto,
  CreateApiKeyResponse,
  UpdateApiKeyDto,
  RotateApiKeyResponse,
  ApiKeyControllerListKeysParams,
} from '../../../shared/lib/api/orval/business/schemas';

export type ApiKey = ApiKeyDto;
export type UpdateApiKey = UpdateApiKeyDto;

export type ApiKeyListParams = ApiKeyControllerListKeysParams;

export interface ApiKeyListData {
  data: ApiKey[];
  total: number;
  page: number;
  pageSize: number;
}

export type CreateApiKey = CreateApiKeyDto;

export type CreateApiKeyResult = CreateApiKeyResponse;

export type RotateApiKeyResult = RotateApiKeyResponse;
