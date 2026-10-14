/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2026-01-07 07:30:08
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2026-01-07 07:30:21
 * @FilePath: /nove-admin/src/shared/api/mutator.ts
 * @Description:
 *
 * Copyright (c) 2026 by LuLab-Team, All Rights Reserved.
 */

import type { AxiosRequestConfig } from 'axios';
import { http } from './http';

export const mutator = <T>(config: AxiosRequestConfig): Promise<T> => {
  return http.request<T>(config).then((res) => res.data);
};
